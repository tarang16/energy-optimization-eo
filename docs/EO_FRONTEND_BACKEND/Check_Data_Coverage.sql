/* =====================================================================
   EO Data Coverage Inspection — READ-ONLY, makes no changes.
   Run in SSMS connected to localhost\SQLEXPRESS.
   Returns five result grids; copy/paste them back to me.
   ===================================================================== */

------------------------------------------------------------------
-- 1. What does run_info think "now" is?
------------------------------------------------------------------
USE Energy_Optimization;
SELECT  'run_info'                              AS [table],
        COUNT(*)                                AS row_count,
        MIN(last_data_update)                   AS earliest_last_data_update,
        MAX(last_data_update)                   AS latest_last_data_update,
        MIN(last_run_time)                      AS earliest_last_run_time,
        MAX(last_run_time)                      AS latest_last_run_time
FROM    run_info;

------------------------------------------------------------------
-- 2. model_output — the main fact table the tiles read from.
--    Date range, row count, and rough density per day.
------------------------------------------------------------------
SELECT  'model_output'                          AS [table],
        COUNT(*)                                AS total_rows,
        MIN(time_stamp)                         AS earliest_timestamp,
        MAX(time_stamp)                         AS latest_timestamp,
        DATEDIFF(DAY, MIN(time_stamp), MAX(time_stamp)) + 1 AS span_days,
        COUNT(*) * 1.0
          / NULLIF(DATEDIFF(DAY, MIN(time_stamp), MAX(time_stamp)) + 1, 0) AS rows_per_day_avg
FROM    model_output;

------------------------------------------------------------------
-- 3. model_output — distinct day breakdown so we can see if there
--    are any gaps inside the range.
------------------------------------------------------------------
SELECT  CAST(time_stamp AS DATE)                AS day,
        COUNT(*)                                AS rows
FROM    model_output
GROUP BY CAST(time_stamp AS DATE)
ORDER BY day DESC;

------------------------------------------------------------------
-- 4. Show the actual columns of model_output so we know the schema.
--    (My earlier guess of `case_id` was wrong — let's see what's real.)
------------------------------------------------------------------
SELECT  COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE
FROM    INFORMATION_SCHEMA.COLUMNS
WHERE   TABLE_SCHEMA = 'dbo'
AND     TABLE_NAME   = 'model_output'
ORDER BY ORDINAL_POSITION;

------------------------------------------------------------------
-- 5. GSR_* tables (Energy Management tab) — the 11 known-empty stubs.
--    Confirming row counts so we know which tabs will be empty.
------------------------------------------------------------------
SELECT  t.name                                  AS gsr_table,
        SUM(p.rows)                             AS row_count
FROM    sys.tables t
JOIN    sys.partitions p
        ON p.object_id = t.object_id AND p.index_id IN (0, 1)
WHERE   t.name LIKE 'GSR[_]%'
GROUP BY t.name
ORDER BY t.name;
