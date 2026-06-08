-- =====================================================================
--  POST-OPTIMIZER DATA PULL — SABIC_DT_EnergyOptimization_WebUI
--  Target snapshot:  2026-03-31 00:00:00
--  Save CSVs into:   db_pulls/csv_output/WebUI/
-- =====================================================================
USE SABIC_DT_EnergyOptimization_WebUI;
GO

DECLARE @snap datetime = '2026-03-31 00:00:00';

-- =====================================================================
-- [1/1]  trn_ods_suggestion.csv — operator-facing ODS suggestions
--         This is what the UI shows the control-room engineer.
--         Compare against our post-optimizer's ODS_Alerts_Log.
-- =====================================================================
-- :OUT trn_ods_suggestion.csv
SELECT *
FROM dbo.trn_ods_suggestion
WHERE time_stamp BETWEEN DATEADD(DAY,-7,@snap) AND DATEADD(DAY,1,@snap)
ORDER BY time_stamp DESC;
