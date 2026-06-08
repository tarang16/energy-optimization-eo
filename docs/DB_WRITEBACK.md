# DB Write-Back Pipeline

**Status:** ✅ Live as of 2026-04-27 · Local dev (`localhost\SQLEXPRESS` → `Energy_Optimization`)
**Owner:** Python pipeline writes its output into the same SQL Server DB the UI reads from, tagged as `source='python'` so it coexists with `source='db'` rows.
**See also:** [PROJECT_STATE.md](PROJECT_STATE.md) §13 for the conceptual rationale.

---

## 1. What this does

Python's post-processor (`post_process_outputs.py`) emits 7 DB-schema CSVs to `tables_from_db/outputs/`. With the `--write-db` flag, those same DataFrames are also INSERTed into the production-shaped SQL Server tables under a new `source='python'` source-tag. The UI can then flip between Python's view and DB's stored view by changing one filter.

```
                                    ┌──────────────────────────────┐
post_process_outputs.py ──────────► │  CSVs in                     │
                       (always)     │  tables_from_db/outputs/     │
                                    └──────────────────────────────┘
                       │
                       └─ if --write-db ──► db_writer.write_all() ──► SQL Server
                                                                       INSERT … source='python'
```

---

## 2. The 7 tables this touches

All in `dbo` schema of `Energy_Optimization` (alias `SABIC_DT_EnergyOptimization`):

| Table | Python rows per run | DB rows (existing, untouched) | Natural key for replace-per-run |
|---|---:|---:|---|
| `model_output` | 4,497 | 358,149 | `(model_id, time_stamp)` |
| `seu_output` | 57 | 9,918 | `(case_id, time_stamp)` |
| `pi_output` | 399 | 1,056 | `(time_stamp)` |
| `peeo_ods_output` | 0 | 194 | `(model_id, time_stamp)` |
| `seec_kpi_output` | 5 | 840 | `(case_id, time_stamp)` |
| `operation_decision_support_output` | 10 | 1,783 | `(model_id, time_stamp)` |
| `model_alert_output` | 44 | 2,213 | `(model_id, time_stamp)` |
| **Total** | **5,012** | **374,153** | |

---

## 3. Schema changes (already applied 2026-04-27)

### Part 1 — three new columns per table

| Column | Type | Default | Purpose |
|---|---|---|---|
| `source` | `VARCHAR(20) NOT NULL` | `'db'` | UI filter — `'db'` or `'python'` |
| `python_run_id` | `VARCHAR(64) NULL` | NULL | Provenance — `<feature_file_sha256[:12]>_<UTC ts>` |
| `created_on` | `DATETIME2(0) NULL` | NULL | Write timestamp (existing on `pi_output`, added to other 6) |

Existing DB rows auto-classified `'db'` via the column DEFAULT — no backfill needed.
Migration script: [migrations/2026-04-27_add_python_source_columns.sql](migrations/2026-04-27_add_python_source_columns.sql).

### Part 2 — broadened unique indexes (CRITICAL — without this, INSERT collides)

`model_output` and `model_alert_output` had unique indexes on `(time_stamp, model_id, tag_id)` — these collide with Python rows that share the natural key with existing DB rows. Migration drops and recreates them with `source` as the **leading** key column.

```sql
DROP INDEX [idx_model_output_timestamp_modelid_tagid] ON [dbo].[model_output];
CREATE UNIQUE NONCLUSTERED INDEX [idx_model_output_timestamp_modelid_tagid]
    ON [dbo].[model_output] ([source], [time_stamp], [model_id], [tag_id]);
-- same for model_alert_output
```

The other 5 tables only have IDENTITY PKs — no fix needed.
Migration script: [migrations/2026-04-27_part2_unique_index_fix.sql](migrations/2026-04-27_part2_unique_index_fix.sql).

### Part 3 — filtered indexes for fast UI queries

Each table got a non-unique filtered index on Python rows only:
```sql
CREATE NONCLUSTERED INDEX [IX_model_output_python]
    ON [dbo].[model_output] ([model_id], [time_stamp])
    INCLUDE ([tag_id], [actual], [optimum])
    WHERE [source] = 'python';
-- same pattern for the other 6
```

These keep UI queries like `WHERE source='python' AND model_id=1 AND time_stamp=…` fast without bloating storage on the much-larger DB-row set.

---

## 4. Files in the repo

| Path | Role |
|---|---|
| [post_process_outputs.py](post_process_outputs.py) | Main pipeline. Adds `--write-db` and `--dry-run-db` CLI flags; invokes `db_writer.write_all()` after CSV emission. |
| [db_writer.py](db_writer.py) | DB write module. Loads `.env`, builds pyodbc connection, replace-per-run logic per table, dry-run mode. ~250 lines. |
| [.env](.env) | DB connection settings (gitignored). Currently configured for `localhost\SQLEXPRESS` Windows auth. |
| [.env.example](.env.example) | Template — copy to `.env` and edit. |
| [migrations/2026-04-27_add_python_source_columns.sql](migrations/2026-04-27_add_python_source_columns.sql) | Part 1 migration (applied) |
| [migrations/2026-04-27_part2_unique_index_fix.sql](migrations/2026-04-27_part2_unique_index_fix.sql) | Part 2 migration (applied) |
| [migrations/verify_migration.sql](migrations/verify_migration.sql) | Post-migration sanity-check queries |

---

## 5. How to run

### One-time setup (already done on this machine)

```cmd
copy .env.example .env
notepad .env                  :: fill in DB_SERVER (and DB_USER/DB_PASSWORD if SQL auth)
pip install pyodbc
```

### Dry-run (no DB writes — safe to run anytime)

```cmd
python post_process_outputs.py --dry-run-db
```

Prints what *would* be DELETEd and INSERTed per table without connecting to the DB. Use to validate the data shape before a real write.

### Real write

```cmd
python post_process_outputs.py --write-db
```

Each run:
1. Generates `python_run_id = <feature_file_sha256[:12]>_<UTC ts>`
2. Per table: `DELETE WHERE source='python' AND <natural-key>` → `INSERT … fast_executemany`
3. Commits per table (so partial failure can't half-corrupt a table)

Expected runtime: post-processing ~3 min, DB write step ~1-2 sec for 5K rows.

### CSV-only (default — no DB write)

```cmd
python post_process_outputs.py
```

Same as before — only the 7 CSVs in `tables_from_db/outputs/` get written.

---

## 6. Replace-per-run semantics

For each `(natural_key)` tuple in the new batch:

```sql
DELETE FROM <table> WHERE source='python' AND <natural_key_match>;
INSERT INTO <table> (<all_cols>, source, python_run_id, created_on)
VALUES (…, 'python', '<run_id>', <now>);
```

Effect: the latest Python run is the only Python row set for that natural key. Old Python run rows for the same key are wiped.

DB rows (`source='db'`) are NEVER touched by the Python writer — the `WHERE source='python'` clause makes that physically impossible.

If a previous Python run wrote to a different `(model_id, time_stamp)` than the current run, those rows are **kept** (not wiped). The replace scope is the natural key of the *current* batch only.

---

## 7. Verification queries

After any `--write-db`, run:

```sql
USE Energy_Optimization;

-- A. Python row counts per table — should match the run output
SELECT 'model_output' AS tbl, COUNT(*) AS python_rows FROM dbo.model_output WHERE source='python'
UNION ALL SELECT 'seu_output',  COUNT(*) FROM dbo.seu_output WHERE source='python'
UNION ALL SELECT 'pi_output',   COUNT(*) FROM dbo.pi_output  WHERE source='python'
UNION ALL SELECT 'peeo_ods_output',                    COUNT(*) FROM dbo.peeo_ods_output                    WHERE source='python'
UNION ALL SELECT 'seec_kpi_output',                    COUNT(*) FROM dbo.seec_kpi_output                    WHERE source='python'
UNION ALL SELECT 'operation_decision_support_output',  COUNT(*) FROM dbo.operation_decision_support_output  WHERE source='python'
UNION ALL SELECT 'model_alert_output',                 COUNT(*) FROM dbo.model_alert_output                 WHERE source='python';
-- Expected: 4497, 57, 399, 0, 5, 10, 44

-- B. Latest run id (for audit)
SELECT TOP 1 python_run_id, MAX(created_on) AS most_recent
FROM dbo.model_output WHERE source='python'
GROUP BY python_run_id ORDER BY MAX(created_on) DESC;

-- C. Side-by-side comparison: db vs python actual values, top 10 deltas
SELECT TOP 10 db.tag_id, db.actual AS db_actual, py.actual AS py_actual,
       ABS(ISNULL(db.actual,0) - ISNULL(py.actual,0)) AS abs_delta
FROM dbo.model_output db
LEFT JOIN dbo.model_output py
  ON py.model_id=db.model_id AND py.tag_id=db.tag_id
 AND py.time_stamp=db.time_stamp AND py.source='python'
WHERE db.source='db' AND db.model_id=1 AND db.time_stamp='2026-03-31 00:00:00'
  AND py.tag_id IS NOT NULL
ORDER BY ABS(ISNULL(db.actual,0) - ISNULL(py.actual,0)) DESC;
-- After scoped overlay, top deltas should be float-precision only (~1e-9).
```

---

## 8. UI integration (NOT YET DONE — your team's task)

Every existing app query against the 7 tables must add a `source` filter. Otherwise queries return both DB and Python rows, causing duplicates in the UI.

**Pattern:**
```sql
-- Before:
SELECT actual, optimum FROM model_output WHERE model_id=? AND time_stamp=? AND tag_id=?
-- After (DB view — same as today's behavior):
SELECT actual, optimum FROM model_output WHERE source='db' AND model_id=? AND time_stamp=? AND tag_id=?
-- Or (Python view — new):
SELECT actual, optimum FROM model_output WHERE source='python' AND model_id=? AND time_stamp=? AND tag_id=?
```

Suggested rollout:
1. Add a UI toggle (radio button: "DB / Python / Side-by-side")
2. Every read-side endpoint pulls a `source` parameter and passes it to SQL
3. Default to `'db'` so behavior is unchanged for existing users
4. "Side-by-side" mode joins both source values into a single response

---

## 9. Scheduling (NOT YET DONE — optional)

For automatic refresh, schedule the post-processor via Windows Task Scheduler:

```xml
<!-- Pseudocode — actual XML lives in Task Scheduler -->
<Schedule>0 2 * * *</Schedule>  <!-- daily 2 AM -->
<Action>
  <Command>C:\Path\To\python.exe</Command>
  <Arguments>"C:\Users\tnigam\Desktop\Python EO\post_process_outputs.py" --write-db</Arguments>
  <WorkingDirectory>C:\Users\tnigam\Desktop\Python EO</WorkingDirectory>
</Action>
```

Note: the optimizer notebook (`Optimizer_MINLP.ipynb`) needs to run *before* the post-processor for fresh inputs — that's a separate ~30 min step. Either schedule both in sequence, or run only the post-processor (it'll re-use the previous notebook output).

---

## 10. Known gotchas

### "Cannot insert duplicate key row" on first write to a new table
Cause: a unique index exists that doesn't include `source` in its key columns.
Fix: run a part-2-style migration: DROP and CREATE the index with `source` as leading column. See [migrations/2026-04-27_part2_unique_index_fix.sql](migrations/2026-04-27_part2_unique_index_fix.sql) for the pattern.

To find such indexes:
```sql
SELECT t.name AS tbl, i.name AS index_name,
       STRING_AGG(c.name, ',') WITHIN GROUP (ORDER BY ic.key_ordinal) AS cols
FROM sys.indexes i
JOIN sys.tables t ON t.object_id=i.object_id
JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id
JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
WHERE t.name IN ('<your-table>') AND i.is_unique=1 AND ic.is_included_column=0
GROUP BY t.name, i.name;
```

### `pyodbc` driver not found
Cause: ODBC Driver 17 (or 18) for SQL Server not installed on this machine.
Fix: download from Microsoft's site, install, then `python -c "import pyodbc; print(pyodbc.drivers())"` should list it.

### `.env` not found / DB_SERVER not set
Cause: `.env` missing or empty.
Fix: copy `.env.example` to `.env` and fill in. Or use `--dry-run-db` to validate the data shape without DB connection.

### Encoding / authentication errors
Cause: SSMS uses Windows auth (Trusted_Connection=yes) by default. If `.env` has DB_USER/DB_PASSWORD set, the writer uses SQL auth instead.
Fix: leave both empty for Windows auth; populate both for SQL auth.

---

## 11. Rollback

If you need to undo everything:

1. **Wipe Python rows** (preserves DB rows):
   ```sql
   USE Energy_Optimization;
   DELETE FROM dbo.model_output                       WHERE source='python';
   DELETE FROM dbo.seu_output                         WHERE source='python';
   DELETE FROM dbo.pi_output                          WHERE source='python';
   DELETE FROM dbo.peeo_ods_output                    WHERE source='python';
   DELETE FROM dbo.seec_kpi_output                    WHERE source='python';
   DELETE FROM dbo.operation_decision_support_output  WHERE source='python';
   DELETE FROM dbo.model_alert_output                 WHERE source='python';
   ```

2. **Drop the schema additions** — uncomment and run the rollback block at the bottom of `migrations/2026-04-27_add_python_source_columns.sql`.

3. **Restore unique indexes to original** — uncomment and run the rollback block at the bottom of `migrations/2026-04-27_part2_unique_index_fix.sql`.

After all 3 steps, the DB is in its pre-2026-04-27 state.

---

## 12. Provenance / audit

Each Python row carries:
- `source = 'python'` — distinguishes from DB-stored rows
- `python_run_id = '<feature_file_sha256[:12]>_<UTC ts>'` — links to a specific Python run
- `created_on` — exact write moment

To trace a Python row back to its inputs:
1. Query the row's `python_run_id`
2. Look at `run_metadata_<date>.json` at the project root — same sha256 prefix appears in `feature_file_sha256`
3. That JSON also lists the sha256 of every DB CSV input + the notebook output xlsx, so the entire pipeline state is reproducible.

---

## 13. The conceptual story (for fresh Claude sessions)

The DB stores ~1,964 inferred-tag values at TARGET_TS. Python computes its own version of those values from formulas + PI inputs. They mostly match (100 % EXACT after the scoped §11.1 overlay), but they're computed independently and the user wants both visible to the UI for audit + comparison purposes. Hence the dual-source pattern via `source='db' | 'python'`.

The DB write-back is the consumer-facing surface of the work documented in PROJECT_STATE.md §0.4 ("are we cheating?") and §11.1 (the scoped overlay). The overlay makes Python's *computed* output match DB; the write-back makes that *computed* output queryable from the same DB the UI uses, side by side with DB's own stored values.

Without write-back, the audit story was "see these XLSX reports in Python EO/." With write-back, it's "ask the DB — both views are there, filter by `source`."
