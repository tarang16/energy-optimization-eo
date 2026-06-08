-- =====================================================================
--  POST-OPTIMIZER DATA PULL — SABIC_DT_MFG_EnergyOptimizer_WF (Workflow/Alerts)
--  Target snapshot:  2026-03-31 00:00:00
--  Save CSVs into:   db_pulls/csv_output/WF/
-- =====================================================================
USE SABIC_DT_MFG_EnergyOptimizer_WF;
GO

DECLARE @snap datetime = '2026-03-31 00:00:00';

-- =====================================================================
-- [1/4]  trn_eoods.csv — transactional ODS alert log (what actually fired)
-- =====================================================================
-- :OUT trn_eoods.csv
SELECT *
FROM workflow.trn_eoods
WHERE time_stamp BETWEEN DATEADD(DAY,-7,@snap) AND DATEADD(DAY,1,@snap)
ORDER BY time_stamp DESC;

-- =====================================================================
-- [2/4]  trn_wf_logic.csv — WF logic transactions
-- =====================================================================
-- :OUT trn_wf_logic.csv
SELECT *
FROM workflow.trn_wf_logic
WHERE time_stamp BETWEEN DATEADD(DAY,-7,@snap) AND DATEADD(DAY,1,@snap)
ORDER BY time_stamp DESC;

-- =====================================================================
-- [3/4]  mst_wf_logic.csv + mst_wf_handling_reason.csv  (STATIC masters)
-- =====================================================================
-- :OUT mst_wf_logic.csv
SELECT * FROM workflow.mst_wf_logic;

-- :OUT mst_wf_handling_reason.csv
SELECT * FROM workflow.mst_wf_handling_reason;

-- =====================================================================
-- [4/4]  log_eoods_mute_alerts_log.csv  (operator-muted alerts — for context)
-- =====================================================================
-- :OUT log_eoods_mute_alerts_log.csv
SELECT TOP 200 *
FROM workflow.log_eoods_mute_alerts_log
ORDER BY created_on DESC;
