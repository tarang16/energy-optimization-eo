"""
Generate the SQL migration that adds @source VARCHAR(20)='db' to every EO SP that
reads from the 7 source-aware output tables and injects [source]=@source into the
relevant JOIN clauses.

Reads:  EO_FRONTEND_BACKEND/Database Queries Data/schema/schema/EO/Energy_Optimization_WebUI_utf8.sql
Writes: EO_FRONTEND_BACKEND/migrations/2026-04-27_add_source_param_to_eo_sps_FULL.sql

Run once, then apply the resulting .sql with sqlcmd.
"""
from __future__ import annotations
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_FILE = ROOT / "Database Queries Data" / "schema" / "schema" / "EO" / "Energy_Optimization_WebUI_utf8.sql"
OUT_FILE = ROOT / "migrations" / "2026-04-27_add_source_param_to_eo_sps_FULL.sql"

# Output tables that the Python pipeline writes (each carries a [source] column).
SOURCE_AWARE_TABLES = [
    "model_output",
    "seu_output",
    "pi_output",
    "peeo_ods_output",
    "seec_kpi_output",
    "operation_decision_support_output",
    "model_alert_output",
]

# SPs that drive the EO dashboard; only these get rewritten.
TARGET_SPS = [
    # Phase 1 — original 12 SPs
    "usp_ui_get_kpi_output",
    "usp_ui_get_system_tiledata",
    "usp_ui_get_seu_output_data",
    "usp_ui_eo_get_overview_trend_data",
    "usp_ui_eo_get_tree_diagram_by_case_id",
    "usp_ui_get_monitoring_data",
    "usp_eo_em_get_seec_trend",
    "usp_ui_get_enegry_distribution",
    "usp_ui_eo_get_kevs_output",
    "usp_ui_get_ods_overview_by_case_id_time",
    "usp_get_peeo_ods_ids_by_caseid_time",
    "usp_ui_get_ods_details_by_odsidlist_time",
    # Phase 2 — additional SPs reading from source-aware tables
    "usp_ui_eo_get_optimizer_output",
    "usp_ui_eo_get_demand",
    "usp_ui_eo_get_equipment_availability",
    "usp_ui_eo_get_plant_load",
    "usp_ui_get_actualoptimum_trend",
    "usp_ui_eo_get_what_if_plant_parameters",
    "usp_ui_eo_get_datamodelskip",
    "usp_ui_get_ods_data_by_case_id_list_time_range_req_id",
    "usp_ui_get_ods_data_by_case_id_list_time_range_req_id_bk_pe",
    "usp_ui_get_ods_trend_data_by_request_id",
    "usp_ui_eo_get_all_tags_data_by_case_id",
    "usp_ui_get_casewise_download_data",
    "usp_ui_get_ods_alert_statistics_download_data",
    "usp_ui_get_seu_output_data_targetenergy",
    "usp_ui_get_all_vc_span_by_caseid",
    "usp_ui_get_vc_by_case_Id_list",
    "usp_ui_get_vc_calc_timeseries",
    "usp_ui_eo_get_tag_data_for_validation",
]


def extract_sp_body(schema: str, sp_name: str) -> str | None:
    """Pull the CREATE PROCEDURE [dbo].[sp_name] ... up to the next 'GO' on its own line."""
    pat = re.compile(
        r"(CREATE\s+(?:OR\s+ALTER\s+)?Procedure\s+\[dbo\]\.\[" + re.escape(sp_name) + r"\][\s\S]*?)\n\s*GO\s*\n",
        re.IGNORECASE,
    )
    m = pat.search(schema)
    return m.group(1) if m else None


PARAM_INJECT_RX = re.compile(
    r"((?:CREATE|ALTER)\s+(?:OR\s+ALTER\s+)?Procedure\s+\[dbo\]\.\[\w+\][\s\S]*?)(?=\n\s*(?:as|AS)\b)",
    re.IGNORECASE,
)


def inject_source_param(create_block: str) -> str:
    """Append `, @source VARCHAR(20) = 'db'` to the SP parameter list (just before AS).

    Handles the edge case where trailing commented-out parameters appear after the real
    parameter list (e.g. `--@timestamp datetime=NULL`).  We scan backwards through the
    head to find the last *real* (non-comment, non-blank) line and append there.
    """
    m = PARAM_INJECT_RX.match(create_block)
    if not m:
        # Some SPs have no parameters at all — nothing to do.
        return create_block
    head = m.group(1)
    tail = create_block[m.end():]
    if "@source" in head:
        return create_block  # idempotent

    # Find the last non-comment, non-blank line in the parameter section and
    # append the new parameter there (safe even when trailing comment lines exist).
    lines = head.split("\n")
    last_real_idx = -1
    for i in range(len(lines) - 1, -1, -1):
        stripped = lines[i].strip()
        if stripped and not stripped.startswith("--"):
            last_real_idx = i
            break

    if last_real_idx == -1:
        return create_block  # cannot determine injection point

    lines[last_real_idx] = lines[last_real_idx].rstrip() + ",\n    @source VARCHAR(20) = 'db'"
    return "\n".join(lines) + tail


def _scan_on_clause_end(body: str, start: int) -> int:
    """Walk forward from `start` until we hit a top-level (paren-depth-0) terminator
    keyword that ends an ON clause: JOIN, WHERE, GROUP BY, ORDER BY, UNION, semi-colon,
    a closing paren, or the procedure's END/GO. We MUST skip over balanced parentheses
    so SELECTs inside subqueries don't fool us into thinking the ON clause ended."""
    terminator_rx = re.compile(
        r"\b(?:LEFT\s+JOIN|RIGHT\s+JOIN|INNER\s+JOIN|FULL\s+JOIN|CROSS\s+JOIN|JOIN"
        r"|WHERE|GROUP\s+BY|ORDER\s+BY|UNION|HAVING|OPTION|FOR\s+JSON"
        r"|INSERT|SELECT|UPDATE|DELETE|DROP|DECLARE|IF|BEGIN|END|GO)\b|;",
        re.IGNORECASE,
    )
    depth = 0
    i = start
    n = len(body)
    while i < n:
        ch = body[i]
        if ch == "(":
            depth += 1
            i += 1
            continue
        if ch == ")":
            if depth == 0:
                return i
            depth -= 1
            i += 1
            continue
        if ch == "'":
            # skip string literal
            i += 1
            while i < n and body[i] != "'":
                i += 1
            i += 1
            continue
        if ch == "-" and i + 1 < n and body[i + 1] == "-":
            # skip line comment
            while i < n and body[i] != "\n":
                i += 1
            continue
        if depth == 0:
            m = terminator_rx.match(body, i)
            if m:
                return i
        i += 1
    return n


def inject_source_filter(body: str) -> str:
    """For every JOIN against a source-aware table, append AND [<alias>].[source] = @source to the ON clause."""
    pattern = re.compile(
        r"(?P<joinkw>\b(?:LEFT\s+JOIN|RIGHT\s+JOIN|INNER\s+JOIN|JOIN)\b)\s+"
        r"\[Energy_Optimization\]\.\[dbo\]\.\[(?P<tbl>\w+)\]\s*"
        r"(?:AS\s+)?(?:\[(?P<alias>[^\]]+)\]|(?P<alias2>\w+))?\s*"
        r"(?:WITH\s*\(\s*NOLOCK\s*\)\s*)?"
        r"(?P<onkw>ON\b)",
        re.IGNORECASE,
    )

    chunks: list[tuple[int, int, str]] = []  # (start, end, replacement)
    for m in pattern.finditer(body):
        tbl = m.group("tbl").lower()
        if tbl not in SOURCE_AWARE_TABLES:
            continue
        alias = m.group("alias") or m.group("alias2") or m.group("tbl")
        end_search_start = m.end()
        on_end = _scan_on_clause_end(body, end_search_start)
        on_clause = body[end_search_start:on_end]
        if "[source]" in on_clause.lower() or "@source" in on_clause:
            continue  # already filtered
        # Match indent of the previous AND/ON line so the inserted clause aligns visually.
        indent_match = re.search(r"\n([ \t]+)\bAND\b", on_clause, re.IGNORECASE)
        indent = indent_match.group(1) if indent_match else "    "
        # Walk backwards from on_end past the next keyword's leading whitespace so the
        # insertion lands on its own line and doesn't fuse with the next JOIN/WHERE/etc.
        insert_pos = on_end
        while insert_pos > 0 and body[insert_pos - 1] in " \t":
            insert_pos -= 1
        addition = f"{indent}AND [{alias}].[source] = @source\n"
        chunks.append((insert_pos, insert_pos, addition))

    if not chunks:
        return body

    # Apply chunks in reverse order so positions remain valid.
    chunks.sort(key=lambda c: c[0], reverse=True)
    new_body = body
    for start, end, ins in chunks:
        new_body = new_body[:end] + ins + new_body[end:]
    return new_body


_NBSP_RX = re.compile(r"[   ]")  # NBSP and friends — fatal to T-SQL parser outside literals.


def normalize_whitespace(text: str) -> str:
    """The schema dump contains stray non-breaking spaces inside SP bodies (likely from a
    Word-formatted source). T-SQL rejects them outside string literals, so squash to ASCII space."""
    return _NBSP_RX.sub(" ", text)


def transform_sp(create_block: str) -> str:
    """Convert a CREATE PROCEDURE block into an ALTER PROCEDURE with @source wired in."""
    # 0) Strip non-breaking spaces — they are syntactically invalid in T-SQL.
    altered = normalize_whitespace(create_block)
    # 1) Add the @source parameter to the SP's parameter list (before AS keyword).
    altered = inject_source_param(altered)
    # 2) Convert CREATE -> ALTER so we can re-run on an existing DB.
    altered = re.sub(
        r"^\s*CREATE\s+(?:OR\s+ALTER\s+)?Procedure",
        "ALTER PROCEDURE",
        altered,
        count=1,
        flags=re.IGNORECASE,
    )
    # 3) Inject [source] = @source into JOIN clauses against the 7 source-aware tables.
    altered = inject_source_filter(altered)
    return altered


HEADER = """\
-- =====================================================================================
--  Migration (auto-generated): add @source VARCHAR(20) = 'db' to EO dashboard SPs
--  Generator: migrations/_build_source_param_migration.py
--  Source   : Database Queries Data/schema/schema/EO/Energy_Optimization_WebUI_utf8.sql
--  Date     : 2026-04-27
--
--  WHY      : Python pipeline writes its output to the same SQL Server tables as the
--             production EO pipeline, distinguished by a [source] column ('db' | 'python').
--             Without filtering, every SELECT returns BOTH row sets and the UI shows
--             duplicates.
--
--  WHAT     : This migration ALTERs each SP to (a) accept @source VARCHAR(20) = 'db'
--             and (b) add `[<alias>].[source] = @source` to every JOIN against the seven
--             source-aware tables (model_output, seu_output, pi_output, peeo_ods_output,
--             seec_kpi_output, operation_decision_support_output, model_alert_output).
--
--  IDEMPOTENT: Re-running is safe — the script skips JOINs that already filter on [source].
--
--  HOW TO APPLY (local dev):
--    sqlcmd -S localhost\\SQLEXPRESS -d SABIC_DT_EnergyOptimization_WebUI -E ^
--           -i 2026-04-27_add_source_param_to_eo_sps_FULL.sql
-- =====================================================================================
USE [SABIC_DT_EnergyOptimization_WebUI];
GO

"""


def main() -> None:
    schema = SCHEMA_FILE.read_text(encoding="utf-8", errors="ignore")
    sections: list[str] = []
    for sp in TARGET_SPS:
        block = extract_sp_body(schema, sp)
        if block is None:
            sections.append(
                f"-- !!! SP not found in schema dump: {sp} — skipped. Add it manually if needed.\n"
            )
            continue
        altered = transform_sp(block)
        sections.append(
            f"-- ---------------------------------------------------------------------------\n"
            f"-- {sp}\n"
            f"-- ---------------------------------------------------------------------------\n"
            f"{altered.rstrip()}\nGO\n"
        )

    out = HEADER + "\n".join(sections) + "\n"
    OUT_FILE.write_text(out, encoding="utf-8")
    print(f"Wrote {OUT_FILE} ({len(out)} bytes, {len(TARGET_SPS)} SPs)")


if __name__ == "__main__":
    main()
