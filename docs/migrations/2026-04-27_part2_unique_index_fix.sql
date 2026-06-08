-- =====================================================================
-- Migration part 2: 2026-04-27 — broaden unique indexes to include `source`
-- DB:        Energy_Optimization (alias of SABIC_DT_EnergyOptimization)
-- Why:       The first migration added a `source` column but did NOT touch
--            the existing unique indexes on (time_stamp, model_id, tag_id).
--            On `model_output` and `model_alert_output`, those indexes
--            forbid two rows at the same (time_stamp, model_id, tag_id)
--            regardless of source — so a python INSERT collided with the
--            existing DB row at the same natural key.
-- Fix:       Drop and recreate each unique index with `source` as the
--            leading key column. Same uniqueness semantics within each
--            source, but DB and python rows can now coexist.
-- =====================================================================
USE Energy_Optimization;
GO

-- ---------------------------------------------------------------------
-- 1. model_output
-- ---------------------------------------------------------------------
DROP INDEX [idx_model_output_timestamp_modelid_tagid] ON [dbo].[model_output];
GO

CREATE UNIQUE NONCLUSTERED INDEX [idx_model_output_timestamp_modelid_tagid]
    ON [dbo].[model_output] ([source], [time_stamp], [model_id], [tag_id]);
GO

-- ---------------------------------------------------------------------
-- 2. model_alert_output
-- ---------------------------------------------------------------------
DROP INDEX [idx_model_alert_output_timestamp_modelid_tagid] ON [dbo].[model_alert_output];
GO

CREATE UNIQUE NONCLUSTERED INDEX [idx_model_alert_output_timestamp_modelid_tagid]
    ON [dbo].[model_alert_output] ([source], [time_stamp], [model_id], [tag_id]);
GO

-- ---------------------------------------------------------------------
-- Verification — both indexes should now have `source` as their first key column.
-- Expected: 2 rows with key_ordinal 1 and column_name 'source'.
-- ---------------------------------------------------------------------
SELECT t.name AS tbl, i.name AS index_name,
       c.name AS column_name, ic.key_ordinal
FROM sys.indexes i
JOIN sys.tables t          ON t.object_id  = i.object_id
JOIN sys.index_columns ic  ON ic.object_id = i.object_id AND ic.index_id = i.index_id
JOIN sys.columns c         ON c.object_id  = ic.object_id AND c.column_id = ic.column_id
WHERE t.name IN ('model_output','model_alert_output')
  AND i.name LIKE 'idx_%_timestamp_modelid_tagid'
  AND ic.is_included_column = 0
ORDER BY t.name, ic.key_ordinal;


-- =====================================================================
-- ROLLBACK (if needed)
-- =====================================================================
/*
USE Energy_Optimization;
GO

DROP INDEX [idx_model_output_timestamp_modelid_tagid] ON [dbo].[model_output];
GO
CREATE UNIQUE NONCLUSTERED INDEX [idx_model_output_timestamp_modelid_tagid]
    ON [dbo].[model_output] ([time_stamp], [model_id], [tag_id]);
GO

DROP INDEX [idx_model_alert_output_timestamp_modelid_tagid] ON [dbo].[model_alert_output];
GO
CREATE UNIQUE NONCLUSTERED INDEX [idx_model_alert_output_timestamp_modelid_tagid]
    ON [dbo].[model_alert_output] ([time_stamp], [model_id], [tag_id]);
GO
*/
