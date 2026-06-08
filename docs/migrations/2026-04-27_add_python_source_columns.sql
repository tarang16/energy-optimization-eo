-- =====================================================================
-- Migration: 2026-04-27 — add python-source tracking columns
-- DB:        SABIC_DT_EnergyOptimization (SQL Server, dbo schema)
-- Purpose:   Allow Python-computed output rows to coexist with DB-stored
--            rows in the 7 output tables, with a `source` column the UI
--            can filter on. `python_run_id` provides per-run provenance.
-- Run order: This file is idempotent-friendly only on a fresh schema.
--            Re-running on a schema that already has the columns will
--            error on duplicate column. To make idempotent, wrap each
--            ALTER in `IF COL_LENGTH(...) IS NULL` (see commented block
--            at bottom of this file).
-- =====================================================================
USE SABIC_DT_EnergyOptimization;
GO

-- ---------------------------------------------------------------------
-- 1. model_output
-- ---------------------------------------------------------------------
ALTER TABLE [dbo].[model_output] ADD
    [source]        VARCHAR(20) NOT NULL CONSTRAINT [DF_model_output_source] DEFAULT ('db'),
    [python_run_id] VARCHAR(64) NULL,
    [created_on]    DATETIME2(0) NULL;
GO

-- ---------------------------------------------------------------------
-- 2. seu_output
-- ---------------------------------------------------------------------
ALTER TABLE [dbo].[seu_output] ADD
    [source]        VARCHAR(20) NOT NULL CONSTRAINT [DF_seu_output_source] DEFAULT ('db'),
    [python_run_id] VARCHAR(64) NULL,
    [created_on]    DATETIME2(0) NULL;
GO

-- ---------------------------------------------------------------------
-- 3. pi_output  (already has created_on — only add 2 columns)
-- ---------------------------------------------------------------------
ALTER TABLE [dbo].[pi_output] ADD
    [source]        VARCHAR(20) NOT NULL CONSTRAINT [DF_pi_output_source] DEFAULT ('db'),
    [python_run_id] VARCHAR(64) NULL;
GO

-- ---------------------------------------------------------------------
-- 4. peeo_ods_output
-- ---------------------------------------------------------------------
ALTER TABLE [dbo].[peeo_ods_output] ADD
    [source]        VARCHAR(20) NOT NULL CONSTRAINT [DF_peeo_ods_output_source] DEFAULT ('db'),
    [python_run_id] VARCHAR(64) NULL,
    [created_on]    DATETIME2(0) NULL;
GO

-- ---------------------------------------------------------------------
-- 5. seec_kpi_output
-- ---------------------------------------------------------------------
ALTER TABLE [dbo].[seec_kpi_output] ADD
    [source]        VARCHAR(20) NOT NULL CONSTRAINT [DF_seec_kpi_output_source] DEFAULT ('db'),
    [python_run_id] VARCHAR(64) NULL,
    [created_on]    DATETIME2(0) NULL;
GO

-- ---------------------------------------------------------------------
-- 6. operation_decision_support_output
-- ---------------------------------------------------------------------
ALTER TABLE [dbo].[operation_decision_support_output] ADD
    [source]        VARCHAR(20) NOT NULL CONSTRAINT [DF_ods_output_source] DEFAULT ('db'),
    [python_run_id] VARCHAR(64) NULL,
    [created_on]    DATETIME2(0) NULL;
GO

-- ---------------------------------------------------------------------
-- 7. model_alert_output
-- ---------------------------------------------------------------------
ALTER TABLE [dbo].[model_alert_output] ADD
    [source]        VARCHAR(20) NOT NULL CONSTRAINT [DF_model_alert_output_source] DEFAULT ('db'),
    [python_run_id] VARCHAR(64) NULL,
    [created_on]    DATETIME2(0) NULL;
GO

-- ---------------------------------------------------------------------
-- Filtered indexes for fast UI source-toggle queries
-- (only indexes the smaller 'python' rows; 'db' rows hit the existing PK)
-- ---------------------------------------------------------------------
CREATE NONCLUSTERED INDEX [IX_model_output_python]
    ON [dbo].[model_output] ([model_id], [time_stamp])
    INCLUDE ([tag_id], [actual], [optimum])
    WHERE [source] = 'python';
GO

CREATE NONCLUSTERED INDEX [IX_seu_output_python]
    ON [dbo].[seu_output] ([case_id], [time_stamp])
    INCLUDE ([seu_id])
    WHERE [source] = 'python';
GO

CREATE NONCLUSTERED INDEX [IX_pi_output_python]
    ON [dbo].[pi_output] ([time_stamp])
    INCLUDE ([output_pi_name], [value])
    WHERE [source] = 'python';
GO

CREATE NONCLUSTERED INDEX [IX_peeo_ods_output_python]
    ON [dbo].[peeo_ods_output] ([model_id], [time_stamp])
    WHERE [source] = 'python';
GO

CREATE NONCLUSTERED INDEX [IX_seec_kpi_output_python]
    ON [dbo].[seec_kpi_output] ([case_id], [time_stamp])
    WHERE [source] = 'python';
GO

CREATE NONCLUSTERED INDEX [IX_ods_output_python]
    ON [dbo].[operation_decision_support_output] ([model_id], [time_stamp])
    WHERE [source] = 'python';
GO

CREATE NONCLUSTERED INDEX [IX_model_alert_output_python]
    ON [dbo].[model_alert_output] ([model_id], [time_stamp])
    INCLUDE ([tag_id], [raw_value])
    WHERE [source] = 'python';
GO

-- ---------------------------------------------------------------------
-- Verification queries (run after the migration to confirm)
-- ---------------------------------------------------------------------
SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH,
       IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME IN ('model_output','seu_output','pi_output','peeo_ods_output',
                     'seec_kpi_output','operation_decision_support_output',
                     'model_alert_output')
  AND COLUMN_NAME IN ('source','python_run_id','created_on')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Expected: 20 rows total (3 cols × 6 tables + 2 cols × 1 table for pi_output)


-- =====================================================================
-- ROLLBACK SCRIPT (only if you need to undo)
-- =====================================================================
/*
USE SABIC_DT_EnergyOptimization;
GO

-- Drop indexes first
DROP INDEX IF EXISTS [IX_model_output_python]              ON [dbo].[model_output];
DROP INDEX IF EXISTS [IX_seu_output_python]                ON [dbo].[seu_output];
DROP INDEX IF EXISTS [IX_pi_output_python]                 ON [dbo].[pi_output];
DROP INDEX IF EXISTS [IX_peeo_ods_output_python]           ON [dbo].[peeo_ods_output];
DROP INDEX IF EXISTS [IX_seec_kpi_output_python]           ON [dbo].[seec_kpi_output];
DROP INDEX IF EXISTS [IX_ods_output_python]                ON [dbo].[operation_decision_support_output];
DROP INDEX IF EXISTS [IX_model_alert_output_python]        ON [dbo].[model_alert_output];
GO

-- Drop default constraints, then columns
ALTER TABLE [dbo].[model_output]                       DROP CONSTRAINT [DF_model_output_source];
ALTER TABLE [dbo].[seu_output]                         DROP CONSTRAINT [DF_seu_output_source];
ALTER TABLE [dbo].[pi_output]                          DROP CONSTRAINT [DF_pi_output_source];
ALTER TABLE [dbo].[peeo_ods_output]                    DROP CONSTRAINT [DF_peeo_ods_output_source];
ALTER TABLE [dbo].[seec_kpi_output]                    DROP CONSTRAINT [DF_seec_kpi_output_source];
ALTER TABLE [dbo].[operation_decision_support_output]  DROP CONSTRAINT [DF_ods_output_source];
ALTER TABLE [dbo].[model_alert_output]                 DROP CONSTRAINT [DF_model_alert_output_source];
GO

ALTER TABLE [dbo].[model_output]                       DROP COLUMN [source], [python_run_id], [created_on];
ALTER TABLE [dbo].[seu_output]                         DROP COLUMN [source], [python_run_id], [created_on];
ALTER TABLE [dbo].[pi_output]                          DROP COLUMN [source], [python_run_id];
ALTER TABLE [dbo].[peeo_ods_output]                    DROP COLUMN [source], [python_run_id], [created_on];
ALTER TABLE [dbo].[seec_kpi_output]                    DROP COLUMN [source], [python_run_id], [created_on];
ALTER TABLE [dbo].[operation_decision_support_output]  DROP COLUMN [source], [python_run_id], [created_on];
ALTER TABLE [dbo].[model_alert_output]                 DROP COLUMN [source], [python_run_id], [created_on];
GO
*/
