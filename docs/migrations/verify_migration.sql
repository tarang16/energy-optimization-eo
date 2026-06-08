-- =====================================================================
-- Quick verification: run this once after the migration.
-- Expected results documented inline.
-- =====================================================================
USE SABIC_DT_EnergyOptimization;
GO

-- 1. Columns — should return 21 rows
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH,
       IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('model_output','seu_output','pi_output','peeo_ods_output',
                     'seec_kpi_output','operation_decision_support_output',
                     'model_alert_output')
  AND COLUMN_NAME IN ('source','python_run_id','created_on')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 2. Indexes — should return 7 rows, all with filter [source]='python'
SELECT t.name AS table_name, i.name AS index_name,
       i.is_unique, i.has_filter, i.filter_definition
FROM sys.indexes i
JOIN sys.tables t ON t.object_id = i.object_id
WHERE i.name LIKE '%_python'
ORDER BY t.name;

-- 3. Default constraints — should return 7 rows, all defaulting to 'db'
SELECT t.name AS table_name, dc.name AS constraint_name, dc.definition
FROM sys.default_constraints dc
JOIN sys.tables t ON t.object_id = dc.parent_object_id
WHERE dc.name LIKE 'DF_%_source'
ORDER BY t.name;

-- 4. Existing rows are auto-classified as 'db' — sanity check
SELECT 'model_output'                       AS tbl, COUNT(*) AS db_rows FROM dbo.model_output                       WHERE source='db'
UNION ALL SELECT 'seu_output',                            COUNT(*)            FROM dbo.seu_output                         WHERE source='db'
UNION ALL SELECT 'pi_output',                             COUNT(*)            FROM dbo.pi_output                          WHERE source='db'
UNION ALL SELECT 'peeo_ods_output',                       COUNT(*)            FROM dbo.peeo_ods_output                    WHERE source='db'
UNION ALL SELECT 'seec_kpi_output',                       COUNT(*)            FROM dbo.seec_kpi_output                    WHERE source='db'
UNION ALL SELECT 'operation_decision_support_output',     COUNT(*)            FROM dbo.operation_decision_support_output  WHERE source='db'
UNION ALL SELECT 'model_alert_output',                    COUNT(*)            FROM dbo.model_alert_output                 WHERE source='db'
ORDER BY tbl;

-- 5. Python rows count — should all be 0 (we haven't written any yet)
SELECT 'model_output'                       AS tbl, COUNT(*) AS python_rows FROM dbo.model_output                       WHERE source='python'
UNION ALL SELECT 'seu_output',                            COUNT(*)                FROM dbo.seu_output                         WHERE source='python'
UNION ALL SELECT 'pi_output',                             COUNT(*)                FROM dbo.pi_output                          WHERE source='python'
UNION ALL SELECT 'peeo_ods_output',                       COUNT(*)                FROM dbo.peeo_ods_output                    WHERE source='python'
UNION ALL SELECT 'seec_kpi_output',                       COUNT(*)                FROM dbo.seec_kpi_output                    WHERE source='python'
UNION ALL SELECT 'operation_decision_support_output',     COUNT(*)                FROM dbo.operation_decision_support_output  WHERE source='python'
UNION ALL SELECT 'model_alert_output',                    COUNT(*)                FROM dbo.model_alert_output                 WHERE source='python'
ORDER BY tbl;
