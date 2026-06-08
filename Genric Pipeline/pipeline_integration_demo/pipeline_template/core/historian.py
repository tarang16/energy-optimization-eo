"""
historian.py
Fetch PI tag timeseries from a CSV file or a live historian endpoint.

Two source modes:
  - "csv"       : load from a user-supplied CSV dump
  - "historian" : connect to real PI historian via FastAPI endpoint

Usage:
    from core.historian import fetch

    df = fetch(
        pi_tags=["PI-H1-DRAFT.PV", "ZI-H1-IDFAN.PV"],
        start_time=datetime(2026, 3, 1),
        end_time=datetime(2026, 3, 2),
        interval="1h",
        source="historian",
        historian_config={"host": "http://192.168.9.249:8000"},
    )
"""

import numpy as np
import pandas as pd
from datetime import timedelta


def _parse_interval(interval: str) -> timedelta:
    """Parse interval string like '1h', '15m', '1d' into timedelta."""
    s = interval.strip().lower()
    if s.endswith("h"):
        return timedelta(hours=int(s[:-1]))
    elif s.endswith("m"):
        return timedelta(minutes=int(s[:-1]))
    elif s.endswith("d"):
        return timedelta(days=int(s[:-1]))
    elif s.endswith("s"):
        return timedelta(seconds=int(s[:-1]))
    else:
        raise ValueError(f"Cannot parse interval '{interval}'. Use e.g. '1h', '15m', '1d'.")


def fetch(
    pi_tags: list[str],
    start_time,
    end_time,
    interval: str = "1h",
    source: str = "historian",
    csv_path: str | None = None,
    historian_config: dict | None = None,
) -> pd.DataFrame:
    """
    Fetch interpolated timeseries for the given PI tags.

    Args:
        pi_tags:          list of PI tag names
        start_time:       datetime — start of range (inclusive)
        end_time:         datetime — end of range (inclusive)
        interval:         str — time step, e.g. "1h", "15m", "1d"
        source:           "csv" | "historian"
        csv_path:         path to CSV file (required when source="csv")
        historian_config: dict with PI Web API connection settings (required when source="historian")

    Returns:
        pd.DataFrame — index=DatetimeIndex, columns=pi_tags, values=float
    """
    if source == "csv":
        if csv_path is None:
            raise ValueError("csv_path is required when source='csv'")
        return _load_from_csv(pi_tags, csv_path, start_time, end_time, interval)
    elif source == "historian":
        return _fetch_from_historian(pi_tags, start_time, end_time, interval, historian_config)
    else:
        raise ValueError(f"Unknown source '{source}'. Use 'csv' or 'historian'.")


def _expected_timestamps(start_time, end_time, interval: str) -> list[pd.Timestamp]:
    """Build the expected timestamp index for a given time range and interval."""
    td, timestamps = _parse_interval(interval), []
    t, end_ts = pd.Timestamp(start_time).floor("s"), pd.Timestamp(end_time).floor("s")
    while t <= end_ts:
        timestamps.append(t)
        t += td
    return timestamps


def _validate(df: pd.DataFrame, pi_tags: list[str], expected_ts: list[pd.Timestamp], source: str) -> None:
    """Raise if any requested tags or expected timestamps are missing from df."""
    missing_tags = [t for t in pi_tags if t not in df.columns]
    if missing_tags:
        raise ValueError(
            f"[{source}] {len(missing_tags)} requested tag(s) not returned: {missing_tags}"
        )

    actual_ts = set(df.index.floor("s"))
    missing_ts = [t for t in expected_ts if t not in actual_ts]
    if missing_ts:
        sample = [str(t) for t in missing_ts[:3]]
        raise ValueError(
            f"[{source}] {len(missing_ts)} expected timestamp(s) missing "
            f"(e.g. {sample}{'...' if len(missing_ts) > 3 else ''})"
        )


def _load_from_csv(pi_tags: list[str], csv_path: str, start_time, end_time, interval: str) -> pd.DataFrame:
    """Load timeseries from a CSV file (timestamp as index, PI tag names as columns)."""
    df = pd.read_csv(csv_path, index_col=0, parse_dates=True)
    if not isinstance(df.index, pd.DatetimeIndex):
        raise ValueError(f"CSV at '{csv_path}' must have a parseable timestamp as its first column.")
    df.index.name = "timestamp"

    mask = (df.index >= pd.Timestamp(start_time)) & (df.index <= pd.Timestamp(end_time))
    df = df.loc[mask]

    expected_ts = _expected_timestamps(start_time, end_time, interval)
    _validate(df, pi_tags, expected_ts, source=f"csv:{csv_path}")

    return df[pi_tags].astype(float)


def _fetch_from_historian(
    pi_tags: list[str],
    start_time,
    end_time,
    interval: str,
    historian_config: dict | None,
) -> pd.DataFrame:
    """
    Fetch interpolated timeseries from the historian FastAPI endpoint.

    POST {host}/api/query
    Body: { tags, start_time, end_time, frequency_seconds }
    Response: { data: [ { timestamp, <tag>: value, ... }, ... ] }

    historian_config keys:
        host         Base URL, e.g. "http://192.168.9.249:8000"
        auth_type    "none" | "basic" | "bearer"  (default: "none")
        username     username for basic auth
        password     password for basic auth (or HISTORIAN_PASSWORD env var)
        token        bearer token (or HISTORIAN_TOKEN env var)
        verify_ssl   bool, default True
    """
    if historian_config is None:
        raise ValueError(
            "historian_config is required for source='historian'. "
            "Provide a dict with at least {'host': 'http://...'} or load from historian_config.json."
        )
    host = historian_config.get("host", "").rstrip("/")
    if not host:
        raise ValueError("historian_config['host'] must be set, e.g. 'http://192.168.9.249:8000'")

    try:
        import requests
        from requests.auth import HTTPBasicAuth
    except ImportError:
        raise ImportError("requests is required for source='historian'. Run: pip install requests")

    import os

    auth_type  = historian_config.get("auth_type", "none").lower()
    verify_ssl = historian_config.get("verify_ssl", True)
    username   = historian_config.get("username", "")
    password   = historian_config.get("password") or os.environ.get("HISTORIAN_PASSWORD", "")
    token      = historian_config.get("token")    or os.environ.get("HISTORIAN_TOKEN", "")

    session = requests.Session()
    session.verify = verify_ssl
    if auth_type == "basic" and username:
        session.auth = HTTPBasicAuth(username, password)
    elif auth_type == "bearer" and token:
        session.headers["Authorization"] = f"Bearer {token}"

    def _date_str(dt) -> str:
        return pd.Timestamp(dt).strftime("%Y-%m-%dT%H:%M:%S")

    def _interval_to_seconds(iv: str) -> int:
        return int(_parse_interval(iv).total_seconds())

    payload = {
        "tags":              pi_tags,
        "start_time":        _date_str(start_time),
        "end_time":          _date_str(end_time),
        "frequency_seconds": _interval_to_seconds(interval),
    }

    resp = session.post(f"{host}/api/query", json=payload, timeout=120)
    resp.raise_for_status()
    rows = resp.json().get("data", [])

    expected_ts = _expected_timestamps(start_time, end_time, interval)

    if not rows:
        raise ValueError(
            f"[historian] No data returned for {len(pi_tags)} tag(s) "
            f"between {_date_str(start_time)} and {_date_str(end_time)}."
        )

    df = pd.DataFrame(rows)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.set_index("timestamp")
    df.index.name = "timestamp"

    _validate(df, pi_tags, expected_ts, source="historian")

    return df[pi_tags].astype(float)
