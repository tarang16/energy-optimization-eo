-- =====================================================================
--  POST-OPTIMIZER DATA PULL  —  SABIC_DT_EnergyOptimization
--  Snapshot : 2026-03-31 00:00:00      model_id : 1
--
--  HOW TO RUN IN SSMS
--  1.  Tools → Options → Query Results → SQL Server → Results to Grid
--      → Check "Include column headers when copying or saving results"
--  2.  Set Results to File:  Query → Results To → Results to File
--  3.  Execute this entire script (F5).
--  4.  Each block saves ONE CSV.  Name each file exactly as shown in
--      the comment  "-- SAVE AS: <name>.csv"  above each SELECT.
--  5.  Drop all CSVs into:  db_pulls/csv_output/EO/
--
--  NOTE: All tables use tag_name directly — no tag_id joins needed.
--        Run the VALIDATE block first (Section 0) to confirm table
--        names exist in your environment before the full pulls.
-- =====================================================================

USE SABIC_DT_EnergyOptimization;
GO

-- ===========================  SECTION 0  ==============================
--  VALIDATE: confirm each table exists & show its columns (1 row only)
--  Run this first. If a table is missing you'll see an error — tell me
--  which one and I'll correct the name.
-- ======================================================================

SELECT TOP 1 * FROM dbo.model_output;
SELECT TOP 1 * FROM dbo.pi_output;
SELECT TOP 1 * FROM dbo.seu_output;
SELECT TOP 1 * FROM dbo.seec_kpi_output;
SELECT TOP 1 * FROM dbo.operation_decision_support_output;
SELECT TOP 1 * FROM dbo.seu_details;
SELECT TOP 1 * FROM dbo.derived_equations_post_optimizer;
SELECT TOP 1 * FROM dbo.effect;
SELECT TOP 1 * FROM dbo.cause;
SELECT TOP 1 * FROM dbo.operation_decision_support;
SELECT TOP 1 * FROM dbo.seec_kpi;
SELECT TOP 1 * FROM dbo.peeo_ods_info;
SELECT TOP 1 * FROM dbo.eo_peeo_tag_mapping;
SELECT TOP 1 * FROM dbo.output_pi_seu_tag_mapping;
SELECT TOP 1 * FROM dbo.seu_suggestions_mapping;
SELECT TOP 1 * FROM dbo.sub_model;
SELECT TOP 1 * FROM dbo.sub_model_child;
GO


-- ===========================  SECTION 1  ==============================
--  PRIORITY PULLS  (unlock process-side SEUs + validate savings)
-- ======================================================================

-- -------------------------------------------------------------------
-- SAVE AS: model_output.csv
-- The DB's own actual / current / optimum / design per tag.
-- This IS the ground-truth (same as Output_from_db.csv you shared).
-- -------------------------------------------------------------------
SELECT *
FROM dbo.model_output
WHERE time_stamp = '2026-03-31 00:00:00'
ORDER BY tag_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: pi_output.csv
-- RAW PI snapshot for the snapshot — includes ALL process-side tags
-- (H-1111 status, E-2523 flow, KM-2115 load etc.) that the notebook
-- was missing.  This is the single biggest unlocker for SEU benefits.
-- -------------------------------------------------------------------
SELECT *
FROM dbo.pi_output
WHERE time_stamp = '2026-03-31 00:00:00'
ORDER BY tag_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: seu_output.csv
-- DB's computed SEU baseline / actual / target / gain / benefit.
-- We'll compare this against our notebook's zero-benefit result.
-- -------------------------------------------------------------------
SELECT *
FROM dbo.seu_output
WHERE time_stamp = '2026-03-31 00:00:00'
ORDER BY seu_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: seec_kpi_output.csv
-- Fuel_Bill / Power_Bill / DMW_Bill / CW_Chem_Bill values from DB.
-- -------------------------------------------------------------------
SELECT *
FROM dbo.seec_kpi_output
WHERE time_stamp = '2026-03-31 00:00:00';
GO

-- -------------------------------------------------------------------
-- SAVE AS: ods_output.csv
-- Which Effect-Cause pairs fired for this snapshot and their values.
-- -------------------------------------------------------------------
SELECT *
FROM dbo.operation_decision_support_output
WHERE time_stamp = '2026-03-31 00:00:00'
ORDER BY effect_name, cause_name;
GO


-- ===========================  SECTION 2  ==============================
--  STATIC REFERENCE TABLES  (config / formula libraries)
--  These rarely change — pull once and they stay valid.
-- ======================================================================

-- -------------------------------------------------------------------
-- SAVE AS: seu_details.csv
-- Full SEU expression library (58 SEUs with all duty formulas).
-- -------------------------------------------------------------------
SELECT *
FROM dbo.seu_details
ORDER BY seu_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: derived_equations_post_optimizer.csv
-- Post-solve formula layer (tags recomputed after optimum is found).
-- -------------------------------------------------------------------
SELECT *
FROM dbo.derived_equations_post_optimizer
ORDER BY tag_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: effect.csv
-- ODS effect definitions (what KPI moved — full list, not just 5).
-- -------------------------------------------------------------------
SELECT *
FROM dbo.effect
ORDER BY effect_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: cause.csv
-- ODS cause definitions (why the KPI moved — all 115 causes).
-- -------------------------------------------------------------------
SELECT *
FROM dbo.cause
ORDER BY cause_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: ods_mapping.csv
-- Effect ↔ Cause relationship table (replaces the 'ods' Excel sheet).
-- -------------------------------------------------------------------
SELECT *
FROM dbo.operation_decision_support
ORDER BY effect_name, cause_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: seec_kpi.csv
-- KPI definitions: names, formulas, UoM for all bills/costs.
-- -------------------------------------------------------------------
SELECT *
FROM dbo.seec_kpi
ORDER BY kpi_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: peeo_ods_info.csv
-- PEEO adjustment rules (step-change suggestions per ODS ID).
-- -------------------------------------------------------------------
SELECT *
FROM dbo.peeo_ods_info
ORDER BY peeo_ods_info_id;
GO

-- -------------------------------------------------------------------
-- SAVE AS: eo_peeo_tag_mapping.csv
-- Maps PEEO rule IDs to their driver tag names.
-- -------------------------------------------------------------------
SELECT *
FROM dbo.eo_peeo_tag_mapping;
GO

-- -------------------------------------------------------------------
-- SAVE AS: seu_suggestions_mapping.csv
-- Maps each SEU to its ODS suggestion expression.
-- -------------------------------------------------------------------
SELECT *
FROM dbo.seu_suggestions_mapping
ORDER BY seu_id;
GO

-- -------------------------------------------------------------------
-- SAVE AS: output_pi_seu_tag_mapping.csv
-- PI write-back tag names for SEU outputs.
-- -------------------------------------------------------------------
SELECT *
FROM dbo.output_pi_seu_tag_mapping
ORDER BY seu_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: sub_model.csv
-- What-If sub-model expressions (independent of optimizer).
-- -------------------------------------------------------------------
SELECT *
FROM dbo.sub_model
ORDER BY [order], sub_model_name;
GO

-- -------------------------------------------------------------------
-- SAVE AS: sub_model_child.csv
-- Driver tags for each sub-model.
-- -------------------------------------------------------------------
SELECT *
FROM dbo.sub_model_child;
GO
