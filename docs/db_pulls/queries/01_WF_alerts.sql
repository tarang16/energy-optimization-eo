-- =====================================================================
--  WORKFLOW / ALERTS DATA PULL  —  SABIC_DT_MFG_EnergyOptimizer_WF
--  Snapshot window: 2026-03-24 to 2026-03-31 (7 days before snapshot)
--
--  SAVE CSVs into: db_pulls/csv_output/WF/
-- =====================================================================

USE SABIC_DT_MFG_EnergyOptimizer_WF;
GO

-- VALIDATE first
SELECT TOP 1 * FROM workflow.trn_eoods;
SELECT TOP 1 * FROM workflow.trn_wf_logic;
SELECT TOP 1 * FROM workflow.mst_wf_logic;
SELECT TOP 1 * FROM workflow.mst_wf_handling_reason;
SELECT TOP 1 * FROM workflow.log_eoods_mute_alerts_log;
GO

-- -------------------------------------------------------------------
-- SAVE AS: trn_eoods.csv
-- Transactional ODS alert log — what alerts actually fired near the
-- snapshot. Compare against our notebook's ODS_Alerts_Log output.
-- -------------------------------------------------------------------
SELECT *
FROM workflow.trn_eoods
WHERE time_stamp BETWEEN '2026-03-24 00:00:00' AND '2026-03-31 23:59:59'
ORDER BY time_stamp DESC;
GO

-- -------------------------------------------------------------------
-- SAVE AS: trn_wf_logic.csv
-- Workflow logic transaction log for the same window.
-- -------------------------------------------------------------------
SELECT *
FROM workflow.trn_wf_logic
WHERE time_stamp BETWEEN '2026-03-24 00:00:00' AND '2026-03-31 23:59:59'
ORDER BY time_stamp DESC;
GO

-- -------------------------------------------------------------------
-- SAVE AS: mst_wf_logic.csv   (static master — no date filter)
-- -------------------------------------------------------------------
SELECT * FROM workflow.mst_wf_logic;
GO

-- -------------------------------------------------------------------
-- SAVE AS: mst_wf_handling_reason.csv   (static master)
-- -------------------------------------------------------------------
SELECT * FROM workflow.mst_wf_handling_reason;
GO

-- -------------------------------------------------------------------
-- SAVE AS: log_mute_alerts.csv
-- Operator-muted alerts — context for which alerts were suppressed.
-- -------------------------------------------------------------------
SELECT TOP 500 *
FROM workflow.log_eoods_mute_alerts_log
ORDER BY created_on DESC;
GO
