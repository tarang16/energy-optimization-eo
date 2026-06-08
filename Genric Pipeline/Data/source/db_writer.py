"""
db_writer.py — write Python-emitted output rows into SQL Server.

Policy: REPLACE-PER-RUN.
  For each output table, DELETE existing rows where source='python' AND the
  natural key (e.g. model_id + time_stamp) matches the new batch, then
  INSERT fresh. Each run produces at most one Python-row set per natural key.

Connection: read from .env at repo root. See .env.example for the keys.
DB engine : Microsoft SQL Server (T-SQL), via pyodbc + fast_executemany.

Invoked from post_process_outputs.py when --write-db is passed. Returns the
python_run_id so it can be logged or passed back to the UI for traceability.
"""
from __future__ import annotations
import hashlib
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd

# Per-table schema column order, integer-typed columns (for NaN→None safety),
# and natural-key columns used to scope the per-run DELETE.
WRITE_SPECS = {
    "model_output": {
        "cols": ["model_id","tag_id","time_stamp","actual","optimum",
                 "polarity","design","current"],
        "int_cols": ["model_id","tag_id","polarity"],
        "natural_key": ["model_id","time_stamp"],
    },
    "seu_output": {
        "cols": ["case_id","time_stamp","seu_id","actual","target","baseline",
                 "gain","enpi","enpi_benefit","gain_benefit",
                 "baseline_gjph","actual_gjph","target_gjph"],
        "int_cols": ["case_id","seu_id"],
        "natural_key": ["case_id","time_stamp"],
    },
    "pi_output": {
        # created_on has a getdate() default in DB — don't insert it
        "cols": ["time_stamp","output_pi_name","value"],
        "int_cols": [],
        "natural_key": ["time_stamp"],
    },
    "peeo_ods_output": {
        "cols": ["peeo_ods_info_id","time_stamp","model_id"],
        "int_cols": ["peeo_ods_info_id","model_id"],
        "natural_key": ["model_id","time_stamp"],
    },
    "seec_kpi_output": {
        "cols": ["case_id","time_stamp","seec_kpi_id","seec_kpi_value"],
        "int_cols": ["case_id","seec_kpi_id"],
        "natural_key": ["case_id","time_stamp"],
    },
    "operation_decision_support_output": {
        "cols": ["model_id","time_stamp","operation_decision_support_id",
                 "message_info_id","opportunity_value"],
        "int_cols": ["model_id","operation_decision_support_id","message_info_id"],
        "natural_key": ["model_id","time_stamp"],
    },
    "model_alert_output": {
        "cols": ["model_id","time_stamp","tag_id","raw_value",
                 "ccp_info_id","ccp_id","switch_configuration_id"],
        "int_cols": ["model_id","tag_id","ccp_info_id","ccp_id","switch_configuration_id"],
        "natural_key": ["model_id","time_stamp"],
    },
}


# ───────────────────────────────────────────────────────────────────────
#  Environment + connection
# ───────────────────────────────────────────────────────────────────────
def load_env(env_path: Path) -> dict:
    """Tiny .env reader (no python-dotenv dep). Lines like KEY=value, '#' comments."""
    env: dict[str, str] = {}
    if not env_path.exists():
        return env
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def get_connection(env: dict):
    """Build a pyodbc connection. Imports pyodbc lazily so dry-runs don't need it."""
    import pyodbc  # local import — keeps the rest of the module usable without driver
    server   = env.get("DB_SERVER")
    db       = env.get("DB_NAME", "SABIC_DT_EnergyOptimization")
    driver   = env.get("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    user     = env.get("DB_USER", "")
    password = env.get("DB_PASSWORD", "")
    if not server:
        raise RuntimeError("DB_SERVER not set in .env — see .env.example")
    if user and password:
        cs = (f"DRIVER={{{driver}}};SERVER={server};DATABASE={db};"
              f"UID={user};PWD={password};Encrypt=yes;TrustServerCertificate=yes")
    else:
        cs = (f"DRIVER={{{driver}}};SERVER={server};DATABASE={db};"
              f"Trusted_Connection=yes;Encrypt=yes;TrustServerCertificate=yes")
    return pyodbc.connect(cs, autocommit=False)


def compute_run_id(ff_sha256: str | None) -> str:
    """Stable run-id: first 12 hex chars of feature-file sha256 + UTC timestamp."""
    prefix = (ff_sha256 or "unknown")[:12]
    ts = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    return f"{prefix}_{ts}"


# ───────────────────────────────────────────────────────────────────────
#  DataFrame preparation
# ───────────────────────────────────────────────────────────────────────
def _prepare_df(df: pd.DataFrame, spec: dict, run_id: str,
                created_on: datetime) -> pd.DataFrame:
    """Subset to schema columns, coerce dtypes, add source/python_run_id/created_on."""
    if df is None or df.empty:
        return pd.DataFrame(columns=spec["cols"])

    out = df.reindex(columns=spec["cols"]).copy()

    # time_stamp: ensure pandas datetime (pyodbc binds datetime cleanly)
    if "time_stamp" in out.columns:
        out["time_stamp"] = pd.to_datetime(out["time_stamp"], errors="coerce")

    # int columns: NaN → None, real → int (pandas float cols can't bind smallint)
    for c in spec["int_cols"]:
        if c in out.columns:
            out[c] = out[c].apply(lambda v: int(v) if pd.notnull(v) else None)

    # add provenance columns
    out["source"]        = "python"
    out["python_run_id"] = run_id
    if "created_on" not in spec["cols"]:
        out["created_on"] = created_on

    # NaN/NaT → None for pyodbc
    out = out.astype(object).where(pd.notnull(out), None)
    return out


def _natural_keys(df: pd.DataFrame, key_cols: list[str]) -> list[tuple]:
    """Distinct natural-key tuples in the prepared df. Empty df → empty list."""
    if df.empty:
        return []
    return [tuple(r) for r in df[key_cols].drop_duplicates().itertuples(index=False, name=None)]


# ───────────────────────────────────────────────────────────────────────
#  Single-table writer
# ───────────────────────────────────────────────────────────────────────
def write_table(conn, table: str, df_in: pd.DataFrame,
                run_id: str, created_on: datetime) -> dict:
    spec = WRITE_SPECS[table]
    df   = _prepare_df(df_in, spec, run_id, created_on)
    if df.empty:
        print(f"  [{table:40}] empty df — skipping (no DELETE, no INSERT)")
        return {"deleted": 0, "inserted": 0}

    cur = conn.cursor()
    cur.fast_executemany = True

    # 1. DELETE existing python rows for the natural keys in this batch
    keys = _natural_keys(df, spec["natural_key"])
    n_del = 0
    where  = " AND ".join(f"[{c}]=?" for c in spec["natural_key"])
    sql_del = f"DELETE FROM [dbo].[{table}] WHERE [source]='python' AND {where}"
    for k in keys:
        cur.execute(sql_del, *k)
        n_del += cur.rowcount

    # 2. INSERT fresh python rows
    insert_cols = spec["cols"] + ["source", "python_run_id"]
    if "created_on" not in spec["cols"]:
        insert_cols.append("created_on")
    placeholders = ",".join(["?"] * len(insert_cols))
    sql_ins = (f"INSERT INTO [dbo].[{table}] "
               f"({','.join(f'[{c}]' for c in insert_cols)}) "
               f"VALUES ({placeholders})")
    rows = [tuple(r) for r in df[insert_cols].itertuples(index=False, name=None)]
    cur.executemany(sql_ins, rows)
    conn.commit()

    print(f"  [{table:40}] -{n_del:>5} stale + {len(rows):>5} new "
          f"= net +{len(rows) - n_del:>5}")
    return {"deleted": n_del, "inserted": len(rows)}


# ───────────────────────────────────────────────────────────────────────
#  Dry-run helper (no DB connection)
# ───────────────────────────────────────────────────────────────────────
def dry_run(outputs: dict, run_id: str, created_on: datetime) -> None:
    print("="*70); print("DRY RUN — no DB writes"); print("="*70)
    print(f"  python_run_id : {run_id}")
    print(f"  created_on    : {created_on}")
    for table, spec in WRITE_SPECS.items():
        df = _prepare_df(outputs.get(table), spec, run_id, created_on)
        keys = _natural_keys(df, spec["natural_key"])
        print(f"  [{table:40}] would DELETE for {len(keys):>3} natural keys, "
              f"INSERT {len(df):>5} rows")


# ───────────────────────────────────────────────────────────────────────
#  Top-level entry point
# ───────────────────────────────────────────────────────────────────────
def write_all(outputs: dict, ff_sha256: str | None = None,
              env_path: Path | None = None, dry: bool = False) -> str:
    """Write all 7 output tables. `outputs` matches the dict main() builds."""
    env = load_env(env_path or Path(__file__).parent / ".env")
    run_id = compute_run_id(ff_sha256)
    created_on = datetime.now()

    print("\n" + "="*70); print("WRITE TO DB"); print("="*70)
    print(f"  python_run_id : {run_id}")
    print(f"  target server : {env.get('DB_SERVER','<unset>')}/{env.get('DB_NAME','<unset>')}")

    if dry:
        dry_run(outputs, run_id, created_on)
        return run_id

    if not env.get("DB_SERVER"):
        raise RuntimeError(
            "DB_SERVER not set in .env. Either populate .env (see .env.example) "
            "or run with --dry-run-db to validate the data shape without writing."
        )

    conn = get_connection(env)
    try:
        totals = {"deleted": 0, "inserted": 0}
        for table in WRITE_SPECS:
            r = write_table(conn, table, outputs.get(table), run_id, created_on)
            totals["deleted"]  += r["deleted"]
            totals["inserted"] += r["inserted"]
        print(f"  TOTALS: -{totals['deleted']} stale + {totals['inserted']} new")
    finally:
        conn.close()
    return run_id
