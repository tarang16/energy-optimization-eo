-- =====================================================================
--  POST-OPTIMIZER DATA PULL — SABIC_DT_EnergyOptimization
--  Target snapshot:  2026-03-31 00:00:00
--
--  HOW TO RUN (SSMS)
--  1. Open this file in SSMS.
--  2. Query → Results To → Results to File  (Ctrl+Shift+F)
--  3. Execute.  When prompted, save each result set as the filename noted
--     in the -- :OUT <filename.csv> comment immediately above the SELECT.
--     (Or use SQLCMD mode: set :OUT <path>\<name>.csv before each block.)
--  4. Save all CSVs into folder:  db_pulls/csv_output/EO/
-- =====================================================================
USE SABIC_DT_EnergyOptimization;
GO

DECLARE @snap datetime = '2026-03-31 00:00:00';
DECLARE @model_id int = 1;   -- SABIC UN EO model

-- =====================================================================
-- [1/15]  pi_output.csv  — ACTUAL plant PI snapshot (ALL tags incl. process)
--         This is the big one: fills the process-side gap
-- =====================================================================
-- :OUT pi_output.csv
SELECT p.model_id, p.time_stamp, t.tag_name, p.value AS actual_value
FROM dbo.pi_output p
JOIN dbo.tag     t ON t.tag_id = p.tag_id AND t.model_id = p.model_id
WHERE p.model_id = @model_id
  AND p.time_stamp = @snap
ORDER BY t.tag_name;

-- =====================================================================
-- [2/15]  model_output.csv  — DB's own actual/optimum/current/design per tag
--         Use this as ground-truth for reconciliation
-- =====================================================================
-- :OUT model_output.csv
SELECT m.model_id, m.time_stamp, t.tag_name, mt.tag_type,
       m.actual, m.current, m.optimum, m.design, m.polarity
FROM dbo.model_output m
JOIN dbo.tag       t ON t.tag_id = m.tag_id AND t.model_id = m.model_id
LEFT JOIN dbo.model_tag mt ON mt.tag_id = t.tag_id AND mt.model_id = m.model_id
WHERE m.model_id = @model_id
  AND m.time_stamp = @snap
ORDER BY t.tag_name;

-- =====================================================================
-- [3/15]  seu_output.csv  — DB's computed SEU duty/gain/benefit
-- =====================================================================
-- :OUT seu_output.csv
SELECT s.model_id, s.time_stamp, d.seu_name, d.seu_display_name,
       d.seu_category, d.energy_source,
       s.baseline_duty, s.actual_duty, s.target_duty,
       s.gain, s.enpi, s.benefit_factor,
       s.benefit_value, s.status
FROM dbo.seu_output s
JOIN dbo.seu_details d ON d.seu_id = s.seu_id
WHERE s.model_id = @model_id
  AND s.time_stamp = @snap
ORDER BY d.seu_name;

-- =====================================================================
-- [4/15]  seec_kpi_output.csv  — energy KPIs (fuel/power/water bills etc.)
-- =====================================================================
-- :OUT seec_kpi_output.csv
SELECT k.model_id, k.time_stamp, kpi.kpi_name, kpi.kpi_description,
       k.actual_value, k.optimum_value, k.baseline_value, k.uom
FROM dbo.seec_kpi_output k
JOIN dbo.seec_kpi        kpi ON kpi.kpi_id = k.kpi_id AND kpi.model_id = k.model_id
WHERE k.model_id = @model_id
  AND k.time_stamp = @snap
ORDER BY kpi.kpi_name;

-- =====================================================================
-- [5/15]  operation_decision_support_output.csv
--         (which Effect↔Cause pairs actually fired)
-- =====================================================================
-- :OUT operation_decision_support_output.csv
SELECT o.model_id, o.time_stamp, e.effect_name, c.cause_name,
       c.casue_message, o.effect_fired, o.cause_fired, o.raw_value
FROM dbo.operation_decision_support_output o
JOIN dbo.operation_decision_support ods
     ON ods.operation_decision_support_id = o.operation_decision_support_id
JOIN dbo.effect e ON e.effect_id = ods.effect_id AND e.model_id = ods.model_id
JOIN dbo.cause  c ON c.cause_id  = ods.cause_id  AND c.model_id = ods.model_id
WHERE o.model_id = @model_id
  AND o.time_stamp = @snap
ORDER BY e.effect_name, c.cause_name;

-- =====================================================================
-- [6/15]  seu_details.csv  — full SEU expression library (STATIC)
-- =====================================================================
-- :OUT seu_details.csv
SELECT seu_name, seu_id, case_plant_id,
       baseline_duty_expression, actual_duty_expression, target_duty_expression,
       seu_category, energy_source, seu_display_name,
       gain_expression, enpi_expression, benefit_factor,
       target_duty_pi_name, actual_duty_pi_name, baseline_duty_pi_name
FROM dbo.seu_details
WHERE model_id = @model_id
ORDER BY seu_name;

-- =====================================================================
-- [7/15]  seu_suggestions_mapping.csv  — SEU → ODS suggestion expressions
-- =====================================================================
-- :OUT seu_suggestions_mapping.csv
SELECT seu_id, operation_decision_support_id, solution_source,
       expression, old_expression
FROM dbo.seu_suggestions_mapping
WHERE model_id = @model_id;

-- =====================================================================
-- [8/15]  derived_equations_post_optimizer.csv  (STATIC formula library)
-- =====================================================================
-- :OUT derived_equations_post_optimizer.csv
SELECT model_id, tag_name, formula_expression
FROM dbo.derived_equations_post_optimizer
WHERE model_id = @model_id
ORDER BY tag_name;

-- =====================================================================
-- [9/15]  effect.csv  + cause.csv  + operation_decision_support.csv
--         (STATIC ODS library — complete set)
-- =====================================================================
-- :OUT effect.csv
SELECT effect_name, effect_description, effect_expression, category, monitoring_tag_name
FROM dbo.effect
WHERE model_id = @model_id
ORDER BY effect_name;

-- :OUT cause.csv
SELECT cause_name, cause_description, cause_expression, casue_message, monitoring_tag_name
FROM dbo.cause
WHERE model_id = @model_id
ORDER BY cause_name;

-- :OUT operation_decision_support.csv
SELECT ods.operation_decision_support_id, ods.model_id,
       e.effect_name, c.cause_name
FROM dbo.operation_decision_support ods
JOIN dbo.effect e ON e.effect_id = ods.effect_id AND e.model_id = ods.model_id
JOIN dbo.cause  c ON c.cause_id  = ods.cause_id  AND c.model_id = ods.model_id
WHERE ods.model_id = @model_id
ORDER BY e.effect_name, c.cause_name;

-- =====================================================================
-- [10/15]  peeo_ods_info.csv + eo_peeo_tag_mapping.csv  (PEEO adjustments)
-- =====================================================================
-- :OUT peeo_ods_info.csv
SELECT *
FROM dbo.peeo_ods_info
WHERE model_id = @model_id;

-- :OUT eo_peeo_tag_mapping.csv
SELECT *
FROM dbo.eo_peeo_tag_mapping
WHERE model_id = @model_id;

-- =====================================================================
-- [11/15]  output_pi_seu_tag_mapping.csv  — PI write-back mapping
-- =====================================================================
-- :OUT output_pi_seu_tag_mapping.csv
SELECT *
FROM dbo.output_pi_seu_tag_mapping
WHERE model_id = @model_id;

-- =====================================================================
-- [12/15]  seec_kpi.csv  — KPI definitions (fuel/power/water/CO2 bills)
-- =====================================================================
-- :OUT seec_kpi.csv
SELECT *
FROM dbo.seec_kpi
WHERE model_id = @model_id
ORDER BY kpi_name;

-- =====================================================================
-- [13/15]  sub_model.csv + sub_model_child.csv  (What-If library)
-- =====================================================================
-- :OUT sub_model.csv
SELECT *
FROM dbo.sub_model
WHERE model_id = @model_id
ORDER BY [order], sub_model_name;

-- :OUT sub_model_child.csv
SELECT *
FROM dbo.sub_model_child
WHERE model_id = @model_id;

-- =====================================================================
-- [14/15]  case_configuration_portal.csv  (bounds / defaults / NaN logic)
-- =====================================================================
-- :OUT case_configuration_portal.csv
SELECT *
FROM dbo.case_configuration_portal
WHERE model_id = @model_id;

-- =====================================================================
-- [15/15]  run_info.csv  — metadata for the snapshot
-- =====================================================================
-- :OUT run_info.csv
SELECT *
FROM dbo.run_info
WHERE model_id = @model_id;
