-- =====================================================================
--  WEBUI / OPERATOR SUGGESTIONS  —  SABIC_DT_EnergyOptimization_WebUI
--  Snapshot window: 2026-03-24 to 2026-03-31
--
--  SAVE CSVs into: db_pulls/csv_output/WebUI/
-- =====================================================================

USE SABIC_DT_EnergyOptimization_WebUI;
GO

-- VALIDATE
SELECT TOP 1 * FROM dbo.trn_ods_suggestion;
GO

-- -------------------------------------------------------------------
-- SAVE AS: trn_ods_suggestion.csv
-- What the UI showed the control-room engineer for this window.
-- -------------------------------------------------------------------
SELECT *
FROM dbo.trn_ods_suggestion
WHERE time_stamp BETWEEN '2026-03-24 00:00:00' AND '2026-03-31 23:59:59'
ORDER BY time_stamp DESC;
GO
