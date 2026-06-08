-- =====================================================================================
--  Migration (auto-generated): add @source VARCHAR(20) = 'db' to EO dashboard SPs
--  Generator: migrations/_build_source_param_migration.py
--  Source   : Database Queries Data/schema/schema/EO/Energy_Optimization_WebUI_utf8.sql
--  Date     : 2026-04-27
--
--  WHY      : Python pipeline writes its output to the same SQL Server tables as the
--             production EO pipeline, distinguished by a [source] column ('db' | 'python').
--             Without filtering, every SELECT returns BOTH row sets and the UI shows
--             duplicates.
--
--  WHAT     : This migration ALTERs each SP to (a) accept @source VARCHAR(20) = 'db'
--             and (b) add `[<alias>].[source] = @source` to every JOIN against the seven
--             source-aware tables (model_output, seu_output, pi_output, peeo_ods_output,
--             seec_kpi_output, operation_decision_support_output, model_alert_output).
--
--  IDEMPOTENT: Re-running is safe — the script skips JOINs that already filter on [source].
--
--  HOW TO APPLY (local dev):
--    sqlcmd -S localhost\SQLEXPRESS -d SABIC_DT_EnergyOptimization_WebUI -E ^
--           -i 2026-04-27_add_source_param_to_eo_sps_FULL.sql
-- =====================================================================================
USE [SABIC_DT_EnergyOptimization_WebUI];
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_kpi_output
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_kpi_output] @caseID INT , @time DATETIME2(0),
    @source VARCHAR(20) = 'db'

  as           

  Begin  

  Begin Try  

 --DECLARE @caseID INT =1--checkpoint              

-- DECLARE @time DATETIME2(0) ='2025-02-03T23:00:00'          

 

  DECLARE @modelID INT = (SELECT top 1 [model_id]               

         FROM [Energy_Optimization].[dbo].[model] WITH (NOLOCK)               

          WHERE [case_id] = 1)              

  --SELECT @modelIDLBM --checkpoint              

 -- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@              

  DROP TABLE IF EXISTS #all_tag_name_1 --checkpoint              

  CREATE TABLE #all_tag_name_1([kpi_type] VARCHAR(250),              

       [kpi_sort_id] INT,              

       [library] VARCHAR(250),              

       [tag_name] VARCHAR(250),              

       [value_decimal] INT,              

       [category] VARCHAR(250),              

       [kpi_description] VARCHAR(MAX),              

       [trend_library] VARCHAR(100) )              

  INSERT INTO #all_tag_name_1              

  SELECT               

   [MST_Kpi_Overview].[kpi_type],              

   [MST_Kpi_Overview].[kpi_sort_id],              

   [MST_Kpi_Overview].[library],               

   [MST_Kpi_Overview].[tag_name_1],              

   [MST_Kpi_Overview].[value_decimal],              

   [MST_Kpi_Overview].[category],              

   [MST_Kpi_Overview].[kpi_description],              

   [MST_Kpi_Overview].[trend_library]              

  FROM               

   [dbo].[MST_Kpi_Overview] AS [MST_Kpi_Overview] WITH (NOLOCK)              

  WHERE               

   [tag_name_1] IS NOT NULL AND [tag_name_2] IS NULL              

   AND [case_id] = @caseID   

   And [MST_Kpi_Overview].active=1

   --Select * from #all_tag_name_1               

              

-- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@              

  DROP TABLE IF EXISTS #all_tag_name_1_tag_data_value               

  CREATE TABLE #all_tag_name_1_tag_data_value (

  [pi_name] VARCHAR(255),

  [tag_id] INT,              

  [tag_name] VARCHAR(250),

  [ui_display_name] VARCHAR(250),

  [tag_description] VARCHAR(MAX),              

  [tag_formula] VARCHAR(MAX),              

  [uom] VARCHAR(256),              

  [data_type] VARCHAR(50),              

  [kpi_type] VARCHAR(250),              

  [kpi_sort_id] INT,              

  [library] VARCHAR(250),              

  [kpi_description] VARCHAR(MAX),              

  [trend_library] VARCHAR(100),              

  [value_decimal] INT,              

  [category] VARCHAR(250),              

  [value1] VARCHAR(5000),              

  [value2] VARCHAR(5000),              

  [state] INT)               

                

  INSERT INTO #all_tag_name_1_tag_data_value                             

 SELECT 

  [Tag].[pi_name],

  [TAG].[tag_id],              

  #all_tag_name_1.[tag_name],  

  [TAG].[ui_display_name],

  [TAG].[description],              

  Case when tag_type='inferred' then formula_expression ELSE  pi_name end as formula,--[TAG].[formula],              

  [uom_name],              

  [TAG].[tag_type],              

  #all_tag_name_1.[kpi_type],              

  #all_tag_name_1.[kpi_sort_id],              

  #all_tag_name_1.[library],              

  #all_tag_name_1.[kpi_description],              

  #all_tag_name_1.[trend_library],              

  #all_tag_name_1.[value_decimal],              

  #all_tag_name_1.[category],              

  CASE WHEN [TAG].[data_type] = 'text' THEN UPPER([message].[message])              

  WHEN Len([Model_Output].[actual])<10 THEN CAST([Model_Output].[actual] AS VARCHAR(250))              

  ELSE CAST(CAST([Model_Output].[actual] as BIGINT) as Varchar(250)) End,              

  CASE WHEN [TAG].[data_type] = 'text' THEN UPPER([message].[message])              

  WHEN Len([Model_Output].[optimum])<10 THEN CAST([Model_Output].[optimum] AS VARCHAR(250))              

  ELSE CAST(CAST([Model_Output].[optimum] as BIGINT) as Varchar(250)) End,              

  [Model_Output].[polarity] as [state]---Model_Output.[state]     

  FROM  #all_tag_name_1 WITH (NOLOCK)              

  Left Join[Energy_Optimization].[dbo].[Tag] AS [Tag]  WITH (NOLOCK)              

  ON [TAG].[tag_name] = #all_tag_name_1.[tag_name] and tag.active= 1                 

  Left JOIN [Energy_Optimization].[dbo].model_tag AS [Model_Tag] WITH (NOLOCK)              

  ON [Tag].[tag_id] = [Model_Tag].[tag_id]  AND [Model_Tag].model_id=@modelID and [Model_Tag].[active] = 1            

  Left join [Energy_Optimization].[dbo].[unit_of_measurement] AS [uom] WITH (NOLOCK)   

  on [Model_tag].uom_id=uom.uom_id  

  LEFT JOIN [Energy_Optimization].[dbo].[model_output] AS [Model_Output] WITH (NOLOCK)              

  ON [Tag].[tag_id] = [Model_Output].[tag_id]                  

  AND [Model_Output].[time_stamp] = @time              

  AND [Model_Output].[source] = @source
  LEFT JOIN [Energy_Optimization].[dbo].[Message_info] AS [Message] WITH (NOLOCK)              

  ON [Model_Output].[actual] = [Message].[message_info_id]              

  AND [Message].[category] = 'text_mapping'          

  Left join [Energy_Optimization].dbo.inferred_details  WITH (NOLOCK)  

  on [Model_Tag].model_tag_id=inferred_details.model_tag_id

  --WHERE [Model_Tag].[model_id] in (SELECT [model_id]               

  --FROM [Energy_Optimization].[dbo].[model] WITH (NOLOCK)               

  --  WHERE [case_id] =1)    

   -- and [Model_Output].[value] is not NULL              

                

--SELECT * FROM  #all_tag_name_1_tag_data_value     --checkpoint              

-- --- --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@          

      

----------Added logic to delete tags with NULL value-----------      

      

  ;With CTEDeleteDupTagIDvALUES as            

  (Select *,row_number() Over(Partition by tag_name,kpi_type Order by tag_name,kpi_type,value1 desc) as rnk            

  From #all_tag_name_1_tag_data_value)            

  Delete from CTEDeleteDupTagIDvALUES Where rnk>1 AND value1 IS Null      

      

-------------------------------------------------------------      

  --;With CTEDeleteDupTagID as              

  --(Select *,row_number() Over(Partition by tag_name,kpi_type Order by [TBL] desc) as rnk              

  --From #all_tag_name_1_tag_data_value)              

  --Delete from CTEDeleteDupTagID Where rnk>1        

        

----  -- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@              

              

  DROP TABLE IF EXISTS #tag_name_1_2_3_4              

  CREATE TABLE #tag_name_1_2_3_4([kpi_type] VARCHAR(250),              

  [kpi_sort_id] INT,              

  [library] VARCHAR(250),              

  [kpi_description] VARCHAR(MAX),              

  [trend_library] VARCHAR(100),              

  [tag_name_1] VARCHAR(250),              

  [tag_name_2] VARCHAR(250),              

  [tag_name_3] VARCHAR(250),              

  [tag_name_4] VARCHAR(250),              

  [value_decimal] INT,              

  [category] VARCHAR(250),          

  [Value_1] VARCHAR(250),          

  [Value_2]  VARCHAR(250),          

  [Value_3]  VARCHAR(250),          

  [Value_4]  VARCHAR(250))              

  INSERT INTO #tag_name_1_2_3_4            

  ([kpi_type],kpi_sort_id,              

  [library] ,              

  [kpi_description],              

  [trend_library],              

  [tag_name_1] ,              

  [tag_name_2] ,         

  [tag_name_3] ,              

  [tag_name_4] ,              

  [value_decimal],              

  [category])          

  SELECT               

  [MST_Kpi_Overview].[kpi_type],              

  [MST_Kpi_Overview].[kpi_sort_id],              

  [MST_Kpi_Overview].[library],              

  [MST_Kpi_Overview].[kpi_description],              

  [MST_Kpi_Overview].[trend_library],              

  [MST_Kpi_Overview].[tag_name_1],              

  [MST_Kpi_Overview].[tag_name_2],              

  [MST_Kpi_Overview].[tag_name_3],              

  [MST_Kpi_Overview].[tag_name_4],              

  [MST_Kpi_Overview].[value_decimal],              

  [MST_Kpi_Overview].[category]              

  FROM               

  [dbo].[MST_Kpi_Overview] AS [MST_Kpi_Overview] WITH (NOLOCK)              

  WHERE [tag_name_1] IS NOT NULL AND [tag_name_2] IS NOT NULL              

  AND [case_id] = @caseid          

     And [MST_Kpi_Overview].active=1

    --checkpoint              

                

  --/*--------------- @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ */               

  ---------Introduced Pivot*              

  DROP TABLE IF EXISTS #tag_name_1_2_union  --checkpoint              

  CREATE TABLE #tag_name_1_2_union([kpi_type] VARCHAR(250),             

  [kpi_sort_id] INT,              

  [library] VARCHAR(250),              

  [kpi_description] VARCHAR(MAX),              

  [trend_library] VARCHAR(100),              

  [tag_name] VARCHAR(250),              

  [value_decimal] INT,              

  [category] VARCHAR(250))              

  INSERT INTO #tag_name_1_2_union              

                

  SELECT [kpi_type],[kpi_sort_id],[library],[kpi_description],[trend_library],              

  [tag_name],[value_decimal], [category]              

  FROM               

  (SELECT [kpi_type], [kpi_sort_id],[library],[kpi_description],[trend_library],              

  [tag_name_1],              

  [tag_name_2],              

  [tag_name_3],              

  [tag_name_4],[value_decimal],[category]              

  FROM #tag_name_1_2_3_4) baseTable              

  UNPIVOT               

  ([tag_name] FOR Tagname in ([tag_name_1],[tag_name_2],[tag_name_3],[tag_name_4])) as TagValues              

          

   --checkoint              

               

  ---- --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@              

              

  DROP TABLE IF EXISTS #tag_name_1_2_tag_data_value --checkpoint              

  CREATE TABLE  #tag_name_1_2_tag_data_value(

  [pi_name] VARCHAR(255),[tag_id] INT,[tag_name] VARCHAR(250), ui_display_name VARCHAR(250),           

  [tag_description] VARCHAR(MAX),              

  [tag_formula] VARCHAR(MAX),              

  [uom] VARCHAR(256),              

  [data_type] VARCHAR(50),              

  [kpi_type] VARCHAR(250),              

  [kpi_sort_id] INT,              

  [library] VARCHAR(250),              

  [kpi_description] VARCHAR(MAX),              

  [trend_library] VARCHAR(100),              

  [value_decimal] INT,              

  [category] VARCHAR(250),              

  [value] VARCHAR(80),              

  [state] INT,Valuetext varchar(max))              

              

  INSERT INTO  #tag_name_1_2_tag_data_value([pi_name],[tag_id],[tag_name], ui_display_name,             

  [tag_description],              

  [tag_formula],              

  [uom],              

  [data_type],              

  [kpi_type],              

  [kpi_sort_id],              

  [library],              

  [kpi_description],              

  [trend_library],              

  [value_decimal],              

  [category],              

  [value],              

  [state])               

        

  SELECT  

  [Tag].[pi_name],

  [Tag].[tag_id],              

  #tag_name_1_2_union.[tag_name],   

  [Tag].[ui_display_name],

  [Tag].[description],              

  Case when tag_type='inferred' then formula_expression ELSE  pi_name end as formula,              

  [uom_name],              

  [Tag].[data_type],              

  #tag_name_1_2_union.[kpi_type],              

  #tag_name_1_2_union.[kpi_sort_id],              

  #tag_name_1_2_union.[library],              

  #tag_name_1_2_union.[kpi_description],              

  #tag_name_1_2_union.[trend_library],              

  #tag_name_1_2_union.[value_decimal],              

  #tag_name_1_2_union.[category],              

  CASE WHEN [TAG].[data_type] = 'text' THEN [Message].[message]              

  When Len([Model_Output].[actual])<10 THEN CAST([Model_Output].[actual] AS VARCHAR(50))              

  ELSE CAST(CAST([Model_Output].[actual] as BIGINT) as Varchar(50)) End,              

  [Model_Output].[polarity] as [state]---Model_Output.[state]             

  FROM  #tag_name_1_2_union WITH (NOLOCK)            

  Left join[Energy_Optimization].[dbo].[Tag] AS [Tag] WITH (NOLOCK)  

  ON [Tag].[tag_name] = #tag_name_1_2_union.[tag_name] and Tag.[active] = 1  

  Left JOIN [Energy_Optimization].[dbo].model_tag AS [Model_Tag] WITH (NOLOCK)              

  ON [Tag].[tag_id] = [Model_Tag].[tag_id] AND [Model_Tag].[active] = 1 and [Model_Tag].model_id=@modelID                                  

  LEFT JOIN [Energy_Optimization].[dbo].[model_output] AS [Model_Output] WITH (NOLOCK)              

  ON [Tag].[tag_id] = [Model_Output].[tag_id]                       

  AND [Model_Output].[time_stamp] = @time   

  AND [Model_Output].[source] = @source
  Left join [Energy_Optimization].[dbo].[unit_of_measurement] AS [uom] WITH (NOLOCK)   

	on [Model_tag].uom_id=uom.uom_id

  LEFT JOIN [Energy_Optimization].[dbo].[Message_info] AS [Message] WITH (NOLOCK)              

	ON [Model_Output].[actual] = [Message].[message_info_id]              

	AND [Message].[category] = 'text_mapping' 

  Left join [Energy_Optimization].dbo.inferred_details  WITH (NOLOCK)  

	on [Model_Tag].model_tag_id=inferred_details.model_tag_id

  --WHERE               

  --[Model_Tag].[model_id] IN (SELECT [model_id]               

  --FROM [Energy_Optimization].[dbo].[model] WITH (NOLOCK)             

  --WHERE [case_id] =@CaseId )    

                

                

  -- SELECT * FROM #tag_name_1_2_3_4              

   --Select * from #tag_name_1_2_tag_data_value              

  ------ @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@              

  ;With CTEDeleteDup as              

  (Select *,row_number() Over(Partition by tag_name,kpi_type Order by Value desc) as rnk              

  From #tag_name_1_2_tag_data_value)              

  Delete from CTEDeleteDup Where rnk>1              

              

  Update #tag_name_1_2_tag_data_value SET [Valuetext]=[Value], [Value]=null              

  Where data_type ='text'              

  ------------------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@-----------------          

  --SELECT * FROM #tag_name_1_2_3_4          

  --SELECT * FROM #tag_name_1_2_union          

  --Select * from #tag_name_1_2_tag_data_value              

  --------------------------------------------------------------------------------------          

 Update  Tag_Values  SET Tag_Values.Value_1=tag_data_value_1.[Value],           

       Tag_Values.value_2=tag_data_value_2.[Value],          

       Tag_Values.value_3=tag_data_value_3.[Value],          

       Tag_Values.value_4=tag_data_value_4.[Value]          

 FROM #tag_name_1_2_3_4 Tag_Values          

 Left Join #tag_name_1_2_union tag_union_1          

 On Tag_Values.tag_name_1=tag_union_1.tag_name         

 Left Join #tag_name_1_2_tag_data_value tag_data_value_1          

 On tag_union_1.tag_name=tag_data_value_1.tag_name          

 Left Join #tag_name_1_2_union tag_union_2          

 On Tag_Values.tag_name_2=tag_union_2.tag_name          

 Left Join #tag_name_1_2_tag_data_value tag_data_value_2          

 On tag_union_2.tag_name=tag_data_value_2.tag_name          

 Left Join #tag_name_1_2_union tag_union_3          

 On Tag_Values.tag_name_3=tag_union_3.tag_name          

 Left Join #tag_name_1_2_tag_data_value tag_data_value_3          

 On tag_union_3.tag_name=tag_data_value_3.tag_name          

 Left Join #tag_name_1_2_union tag_union_4          

 On Tag_Values.tag_name_4=tag_union_4.tag_name          

 Left Join #tag_name_1_2_tag_data_value tag_data_value_4          

 On tag_union_4.tag_name=tag_data_value_4.tag_name          

          

 --Select * from #tag_name_1_2_3_4          

-------------------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@---------------------------------          

          

  SELECT               

  #all_tag_name_1_tag_data_value.[kpi_type] AS kpiType,              

  #all_tag_name_1_tag_data_value.[kpi_sort_id] AS kpiSortId,              

  #all_tag_name_1_tag_data_value.[library] AS [library],              

  #all_tag_name_1_tag_data_value.[kpi_description] AS kpiDescription,              

  #all_tag_name_1_tag_data_value.[trend_library] AS trendLibrary,              

  #all_tag_name_1_tag_data_value.[tag_name] AS tagName,              

  NULL AS tagName2,              

  #all_tag_name_1_tag_data_value.[pi_name] AS piName,

 -- [MST_Display_Info].[display_tag_alias] AS tagNameAlias,   

  NULL as tagNameAlias,

  --CASE               

  --WHEN [MST_Display_Info].[display_name] IS NULL THEN #all_tag_name_1_tag_data_value.[tag_name]              

  --ELSE [MST_Display_Info].[display_name]              

  --END AS displayName, 

  #all_tag_name_1_tag_data_value.[ui_display_name] as displayName,

  NULL AS displayName2,        

  --CASE               

  --WHEN [MST_Display_Info].[display_uom] IS NULL AND #all_tag_name_1_tag_data_value.[uom] IS NULL THEN '-'              

  --WHEN [MST_Display_Info].[display_uom] IS NULL AND #all_tag_name_1_tag_data_value.[uom] IS NOT NULL THEN #all_tag_name_1_tag_data_value.[uom]              

  --ELSE [MST_Display_Info].[display_uom]              

  --END AS displayUom,

  #all_tag_name_1_tag_data_value.uom AS displayUom,

  --CASE               

  --WHEN [MST_Display_Info].[display_description] IS NULL THEN #all_tag_name_1_tag_data_value.[tag_description]              

  --ELSE [MST_Display_Info].[display_description]               

  --END AS displayDescription, 

   #all_tag_name_1_tag_data_value.[tag_description] AS displayDescription, 

  --CASE              

  --WHEN [MST_Display_Info].[display_formula] IS NULL THEN #all_tag_name_1_tag_data_value.[tag_formula]              

  --ELSE [MST_Display_Info].[display_formula]              

  --END AS displayFormula, 

  #all_tag_name_1_tag_data_value.[tag_formula] AS displayFormula

  ,CASE WHEN #all_tag_name_1_tag_data_value.[data_type] ='Text' THEN #all_tag_name_1_tag_data_value.[value1]              

  WHEN Len(#all_tag_name_1_tag_data_value.[value1])<10 THEN CAST(Round(CAST(#all_tag_name_1_tag_data_value.Value1 AS FLOAT),ISNULL(#all_tag_name_1_tag_data_value.[value_decimal],2)) as varchar(50))              

  ELSE #all_tag_name_1_tag_data_value.Value1 End AS value1,              

  CASE WHEN #all_tag_name_1_tag_data_value.[data_type] ='Text' THEN #all_tag_name_1_tag_data_value.[value2]              

  WHEN Len(#all_tag_name_1_tag_data_value.[value2])<10 THEN CAST(Round(CAST(#all_tag_name_1_tag_data_value.Value2 AS FLOAT),ISNULL(#all_tag_name_1_tag_data_value.[value_decimal],2)) as varchar(50))              

  ELSE #all_tag_name_1_tag_data_value.Value2 End AS value2,              

  NULL AS value3,              

  NUll AS value4,              

  #all_tag_name_1_tag_data_value.[value_decimal] AS valueDecimal,              

  LOWER(#all_tag_name_1_tag_data_value.[category]) AS category,              

  #all_tag_name_1_tag_data_value.[state] AS [state],              

  NULL AS [state2]              

  From #all_tag_name_1_tag_data_value WITH (NOLOCK)              

  --LEFT JOIN               

  --[dbo].[tag] AS [MST_Display_Info] WITH (NOLOCK)              

  --ON #all_tag_name_1_tag_data_value.[tag_name] = [MST_Display_Info].[tag_name]              

  --AND [MST_Display_Info].[case_id] = @caseID              

  --Select * from #all_tag_name_1_tag_data_value              

  Union               

              

  SELECT               

  #AlltagsValue.[kpi_type] AS kpiType,              

  #AlltagsValue.[kpi_sort_id] AS kpiSortId,              

  #AlltagsValue.[library] AS [library],              

  #AlltagsValue.[kpi_description] AS kpiDescription,              

  #AlltagsValue.[trend_library] AS trendLibrary,              

  #AlltagsValue.[tag_name_1] AS tagName,              

  #AlltagsValue.[tag_name_2] AS [tagName2], 

  tag_data_value_1.[pi_name] AS piName,

 -- [MST_Display_Info].[display_tag_alias] AS tagNameAlias,   

  NULL as tagNameAlias,

  --CASE               

  --WHEN [MST_Display_Info].[display_name] IS NULL THEN #AlltagsValue.[tag_name_1]              

  --ELSE [MST_Display_Info].[display_name]              

  --END AS displayName,    

  [MST_Display_Info].ui_display_name AS displayName, 

  --Case        

  --WHEN [MST_Display_Info_2].[display_name] IS NULL THEN #AlltagsValue.[tag_name_2]              

  --ELSE [MST_Display_Info_2].[display_name]              

  --END AS displayName2,   

  [MST_Display_Info_2].ui_display_name AS displayName2,

  --CASE               

  --WHEN [MST_Display_Info].[display_uom] IS NULL AND tag_data_value_1.[uom] IS NULL THEN '-'              

  --WHEN [MST_Display_Info].[display_uom] IS NULL AND tag_data_value_1.[uom] IS NOT NULL THEN tag_data_value_1.[uom]              

  --ELSE [MST_Display_Info].[display_uom]              

  --END AS displayUom,

  NULL AS displayUom,

  --CASE               

  --WHEN [MST_Display_Info].[display_description] IS NULL THEN tag_data_value_1.[tag_description]              

  --ELSE [MST_Display_Info].[display_description]               

  --END AS displayDescription, 

  NULL as  displayDescription,

  --CASE              

  --WHEN [MST_Display_Info].[display_formula] IS NULL THEN tag_data_value_1.[tag_formula]              

  --ELSE [MST_Display_Info].[display_formula]              

  --END AS displayFormula,

  NULL as displayFormula,

  CASE WHEN tag_data_value_1.data_type= 'Text' Then tag_data_value_1.ValueText              

  WHEN Len([#AlltagsValue].Value_1)<12 THEN CAST(Round(CAST(#AlltagsValue.[Value_1] AS FLOAT),#AlltagsValue.[value_decimal]) as varchar(50))              

  ELSE #AlltagsValue.Value_1 End AS value1,              

  CASE WHEN tag_data_value_2.data_type= 'Text' Then tag_data_value_2.ValueText              

  When Len([#AlltagsValue].Value_2)<12 THEN CAST(Round(CAST([#AlltagsValue].[Value_2] AS FLOAT),#AlltagsValue.[value_decimal]) as varchar(50))              

  ELSE [#AlltagsValue].[Value_2] End AS value2,              

  CASE WHEN tag_data_value_3.data_type= 'Text' Then tag_data_value_3.ValueText              

  When Len([#AlltagsValue].[Value_3])<12 THEN CAST(Round(CAST([#AlltagsValue].[Value_3] AS FLOAT),#AlltagsValue.[value_decimal]) as varchar(50))              

  ELSE [#AlltagsValue].[Value_3] End AS value3,              

  CASE WHEN tag_data_value_4.data_type= 'Text' Then tag_data_value_4.ValueText              

  When Len([#AlltagsValue].[Value_3])<12 THEN CAST(Round(CAST([#AlltagsValue].[Value_4] AS Float),#AlltagsValue.[value_decimal]) as Varchar(50))              

  ELSE [#AlltagsValue].[Value_4] End AS value4,              

  #AlltagsValue.[value_decimal] AS valueDecimal,              

  LOWER(#AlltagsValue.[category]) AS category,              

  tag_data_value_1.[state] AS [state],              

  tag_data_value_2.[state] AS [state2]              

  FROM              

  #tag_name_1_2_3_4 as #AlltagsValue WITH (NOLOCK)             

  Left Join #tag_name_1_2_tag_data_value tag_data_value_1 WITH (NOLOCK)          

  ON #AlltagsValue.[tag_name_1] = [tag_data_value_1].[tag_name]          

  Left Join #tag_name_1_2_tag_data_value tag_data_value_2 WITH (NOLOCK)          

  ON #AlltagsValue.[tag_name_2] = [tag_data_value_2].[tag_name]          

  Left Join #tag_name_1_2_tag_data_value tag_data_value_3 WITH (NOLOCK)          

  ON #AlltagsValue.[tag_name_3] = [tag_data_value_3].[tag_name]          

  Left Join #tag_name_1_2_tag_data_value tag_data_value_4 WITH (NOLOCK)          

  ON #AlltagsValue.[tag_name_4] = [tag_data_value_4].[tag_name]          

  Left Join[Energy_Optimization].[dbo].[Tag] AS [MST_Display_Info] WITH (NOLOCK)            

  ON #AlltagsValue.[tag_name_1] = [MST_Display_Info].[tag_name]        

  --AND [MST_Display_Info].[case_id] = @caseID          

  Left Join[Energy_Optimization].[dbo].[Tag] AS [MST_Display_Info_2] WITH (NOLOCK)            

  ON [#AlltagsValue].[tag_name_2] = [MST_Display_Info].[tag_name]        

  --AND [MST_Display_Info_2].[case_id] = @caseID           

   

	 END TRY

Begin Catch  

Declare @serverName varchar(100)=@@servername  

  

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'  

 insert into [dbo].[log_errors_tracker]

([Application_Name],[Host_Name],[Error_Message],[Error_Number],[stored_procedure],

[error_severity],status_code,created_by,created_on)   

  SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()  

  

End Catch  

 End        

        

-- /*        

--DECLARE @caseID INT = 79;        

--DECLARE @time DATETIME2(0) = (SELECT MAX([last_run_time]) FROM [Unified_PE].[Energy_Optimization].[dbo].[Run_info]        

--          INNER JOIN [Unified_PE].[Energy_Optimization].[dbo].[model]        

--          ON [Run_Info].[model_id] = [Model].[model_id]        

--          WHERE [Model].[case_id] = @caseID         

--          AND [Model].[model_type] = 'LBM' AND [Run_Info].[model_status] = 'ON' )        

         

--EXEC [dbo].[usp_ui_get_kpi_output]  @caseID = @caseID, @time = @time;        

        

--*/
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_system_tiledata
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_system_tiledata]            

 @caseID INT=NULL,            

 @time DATETIME2(0)=NULL,
    @source VARCHAR(20) = 'db'

            

AS            

BEGIN            

 -- SET NOCOUNT ON added to prevent extra result sets from            

 SET NOCOUNT ON;            

            

 --DECLARE @caseID INT = 3  --checkpoint            

 --DECLARE @time DATETIME2(0) = '2024-06-16T18:00:00' --checkpoint            

          

Drop table IF EXISTS #oppData          

Drop table IF EXISTS #alertData          

        

Begin Try         

     DROP TABLE IF EXISTS  #oppData 

     CREATE TABLE #oppData(caseId INT,tagId INT,[tagName] VARCHAR(250),[actual] FLOAT,uomName NVARCHAR(250))

 

 INSERT INTO #oppData

 SELECT             

 [case_info].[case_id] as caseId,            

 tag.tag_id as tagId,          

 LOWER([tag_name]) AS [tagName],            

 [actual]            

 ,[uom_name] AS uomName  

 --ISNULL([STATE],0) as [STATE]      

          

 FROM            

 [Energy_Optimization].[dbo].[case_info] WITH (NOLOCK)       

 left join [Energy_Optimization].[dbo].[model]      

 on [Model].[case_id]=[case_info].[case_id]      

 left join [Energy_Optimization].[dbo].model_tag      

 on [Model_tag].[model_id]=[model].[model_id]      

 Left join[Energy_Optimization].[dbo].[Tag]      

 on [tag].tag_id=model_tag.tag_id      

 Left JOIN             

 [Energy_Optimization].[dbo].[model_output] AS [model_Output] WITH (NOLOCK)            

 ON [model_Output].[model_id] = [model].[model_id]      

 AND [tag].[tag_Id] = [model_Output].[tag_id]            

 AND [model_Output].[time_stamp] =@time               

 AND [case_info].[active] = 1      

 AND [model_Output].[source] = @source
 Left join [Energy_Optimization].[dbo].[unit_of_measurement] AS [uom] WITH (NOLOCK)     

 on [Model_tag].uom_id=uom.uom_id     

 WHERE [case_info].[case_id] =@caseID          

 AND(        

[tag].[tag_name] = 'opportunity_energy_bills' -- Production_Opportunity            

OR [tag_name] = 'opportunity_Total_Energy_Consumption' --opportunity_energy            

OR [tag_name] = 'opportunity_co2' -- Environment_Opportunity            

OR [tag_name] = 'energy_bill_efficiency'            

OR [tag_name] = 'energy_efficiency'          

OR [tag_name] = 'Carbon_Neutrality_Index'   

--OR [tag_name] = 'seec_gain'          

--OR [tag_name] = 'seec_enpi'   

--OR [tag_name] = 'opportunity_production_constrained'      

--OR [tag_name] = 'opportunity_energy_constrained'      

--OR [tag_name] = 'opportunity_environment_constrained'      

)          

          

 --Select * from #oppData 

  UNION   

 SELECT    distinct     

 [seec_kpi].[case_id] as caseId,            

 [seec_kpi].seec_kpi_id as tagId,          

 LOWER([seec_kpi].seec_kpi_name) AS [tagName],            

 [seec_kpi_output].seec_kpi_value AS [actual]            

 ,[uom_name] AS uomName  

 --ISNULL([STATE],0) as [STATE]      

 FROM            

 [Energy_Optimization].[dbo].[case_info] WITH (NOLOCK)       

 left join [Energy_Optimization].[dbo].[model]      

 on [Model].[case_id]=[case_info].[case_id]      

 left join [Energy_Optimization].[dbo].model_tag      

 on [Model_tag].[model_id]=[model].[model_id]  

  left join [Energy_Optimization].[dbo].tag      

 on [Model_tag].tag_id=tag.tag_id 

 Left join [Energy_Optimization].[dbo].[unit_of_measurement] AS [uom] WITH (NOLOCK)     

 on [Model_tag].uom_id=uom.uom_id  

 LEFT JOIN [Energy_Optimization].[dbo].[seec_kpi] WITH(NOLOCK)

 ON [seec_kpi].case_id=[model].case_id

 LEFT JOIN Energy_Optimization.[dbo].[seec_kpi_output] WITH(NOLOCK)

 ON [seec_kpi_output].seec_kpi_id=[seec_kpi].seec_kpi_id

 and [seec_kpi_output].case_id=[seec_kpi].case_id

 and [seec_kpi_output].[time_stamp] =@time 

 WHERE [case_info].[case_id] =@caseID          

 AND( [seec_kpi].seec_kpi_name = 'seec_gain'          

OR [seec_kpi].seec_kpi_name = 'seec_enpi')

AND  ([tag_name] = 'seec_gain'          

OR [tag_name] = 'seec_enpi') 



          

 CREATE TABLE #alertData (case_id INT, deviationActive INT, deviationOverdue INT)            

 INSERT INTO #alertData 

       

	    -- old query

 --SELECT [case_id],NULL AS [active], NULL AS [overdue]              

 --FROM  [Energy_Optimization].[dbo].[operation_decision_support] WITH (NOLOCK)            

 -- INNER JOIN [Energy_Optimization].[dbo].[operation_decision_support_output] WITH (NOLOCK)            

 --ON [Operation_Decision_Support].operation_decision_support_id = [operation_decision_support_output].operation_decision_support_id

 --Inner join [Energy_Optimization].[dbo].[model] WITH (NOLOCK) 

 --on [model].model_id=[operation_decision_support_output].model_id

 --WHERE case_id = @caseID              

         

 --GROUP BY [case_id] 





 -- new query added by shraddha 

 SELECT [case_id],SUM([active]) AS [active], SUM(overdue) AS [overdue]             

 FROM (            

 SELECT [case_id], ([In Progress]+[Pending]+[Overdue]) AS [active],[overdue]             

 FROM (            

 SELECT  case_id,[status],[TRN_PEODS].[Cause_id]            

 FROM SABIC_DT_MFG_EnergyOptimizer_WF.dbo.[trn_eoods] [TRN_PEODS] WITH (NOLOCK)            

 WHERE case_id = @caseID) q1             

 PIVOT             

 (COUNT([status]) FOR [status] IN ([In Progress],[Pending],[Overdue])) pt ) q1             

 GROUP BY [case_id]            

          

--SELECT * FROM #alertData --checkpoint          

            

Select distinct #oppData.caseId,tagId,Tagname,Round(actual,5) as [actual],uomName, --,uom,[State],      

#alertData.[deviationActive] AS deviationActive,       

#alertData.[deviationOverdue] AS deviationOverdue          

from #oppData  WITH (NOLOCK)            

Left JOIN #alertData WITH (NOLOCK)            

ON #oppData.[caseID] = #alertData.[case_id]            

          

 DROP TABLE IF EXISTS #oppData  --checkpoint            

 DROP TABLE IF EXISTS #alertData  --checkpoint            

       

End Try             

Begin Catch            

              

DECLARE @server_name VARCHAR(100) = @@SERVERNAME -- Checkpoint  

        INSERT INTO [dbo].[log_errors_tracker]  

       ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity], [status_code], [created_by], [created_on])  

        SELECT 'Energy_Optimization_SQL Server', @server_name, Error_Message(), Error_Number(), Error_Procedure(), Error_Severity(), Error_State(), 1, GETDATE();  

       

End Catch            

                 

End            

            

/*             

          

 EXEC [dbo].[usp_ui_get_system_tiledata]             

 @caseID = 1,            

 @time = '2024-12-01 00:00:00.000'            

          

*/
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_seu_output_data
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_seu_output_data]        

@caseId INT =NULL  ,@timestamp datetime=NULL,
    @source VARCHAR(20) = 'db'

        

AS        

BEGIN        

    SET NOCOUNT ON;        

             

 Begin Try     

  

-- ;with CTEseutemp  

--as  

-- (select  

-- [actual] as 'energyConsumed',  

-- [target] as 'targetEnergy',  

-- [baseline] as 'baselineEnergy',  

-- [gain] as 'seecGain',  

-- enpi as 'enpi',  

-- [seu_id]  

-- from [Energy_Optimization].[dbo].[seu_output] With(NOLOCK)  

-- where case_id=@caseId  

-- and time_stamp=@timestamp )  

  

 --select * from  CTEseutemp  

 

 --With RemoveDuplicate

 --as(



    select [case_plant_mapping].case_Id as CaseId,  

 plant.[name] as  'plantName',  

    [energy_source] as energySource,  

 [seu_details].[seu_name] as equipment,  

 seu_category as equipmentCategory,  

 [seu_details].[seu_display_name] as equipmentDescription,  

 --energyConsumed,  

 --targetEnergy,  

 --baselineEnergy,  

 --seecGain,  

  

 ROUND([actual], COALESCE([mst_seu_details_value_decimal].[actual_duty_decimal], 2)) AS energyConsumed,  

  

 ROUND([target], COALESCE([mst_seu_details_value_decimal].[target_duty_decimal], 2)) AS targetEnergy,  

  

 ROUND([baseline], COALESCE([mst_seu_details_value_decimal].[baseline_duty_decimal], 2)) AS baselineEnergy,  

  

 ROUND([gain], COALESCE([mst_seu_details_value_decimal].[seec_gain_decimal], 2)) AS seecGain,  

  

 ROUND([enpi], COALESCE([mst_seu_details_value_decimal].[seec_enpi_decimal], 2)) AS enpi,  

  

 ROUND([enpi_benefit], COALESCE([mst_seu_details_value_decimal].[benifit_enpi_decimal], 2)) AS [enpiBenefit],  

  

 ROUND([gain_benefit], COALESCE([mst_seu_details_value_decimal].[benifit_gain_decimal], 2)) AS gainBenefit  

 --,ROW_NUMBER() over (partition by [seu_details].[seu_name] order by [actual] desc) as rnk



 --[actual] as 'energyConsumed',  

 --[target] as 'targetEnergy',  

 --[baseline] as 'baselineEnergy',  

 --[gain] as 'seecGain',  

 --enpi as 'enpi',  

 --enpi_benefit as [enpiBenefit],  

 --gain_benefit as [gainBenefit]  

 FROM [Energy_Optimization].[dbo].[seu_details] With(NOLOCK)  

 left join [Energy_Optimization].[dbo].[seu_output] With(NOLOCK)  

 on [seu_output].seu_id=seu_details.seu_id  

  and case_id=@caseId and time_stamp=@timestamp  

  AND [seu_output].[source] = @source
 join [Energy_Optimization].[dbo].[case_plant_mapping]   

 on [seu_details].case_plant_id= [case_plant_mapping].case_plant_id  

 join plant With(NOLOCK) on [case_plant_mapping].plant_id=plant.plant_id  

  

 LEFT JOIN [dbo].[mst_seu_details_value_decimal] WITH(NOLOCK)   

 ON [mst_seu_details_value_decimal].[seu_id]=[seu_details].[seu_id]  

 where [case_plant_mapping].case_id=@caseId  

 and [seu_details].active=1  



--)



--Select * from RemoveDuplicate 

--Where rnk=1

  

 END TRY      

 BEGIN CATCH        

  DECLARE @serverName VARCHAR(100) = ISNULL(@@servername,'SQL Server')          

    

  SELECT       

  ERROR_MESSAGE() AS 'Error_Message', ERROR_NUMBER() AS 'Error_Number',     

  ERROR_SEVERITY() AS 'Error_Severity'    

      

  Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'      

  INSERT INTO [dbo].[log_errors_tracker]    

  ([application_name], [host_name], [error_message], [error_number], [stored_procedure],     

  [error_severity], [status_code], [created_by], [created_on])     

  SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()      

      

 END CATCH       

             

END   

  

--select top 5 * FROM [Energy_Optimization].[dbo].[seu_output]   

--  

--Select top 5 * from [dbo].[seu_detail] With(NOLOCK)
GO

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_overview_trend_data
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_overview_trend_data]  

 @caseID INT,
    @source VARCHAR(20) = 'db'

AS  

BEGIN  

 SET NOCOUNT ON;  

  

 --DECLARE @caseID INT = 54 --checkpoint  

 Begin Try  

 SELECT  

    [case_id] AS caseId,  

    [display_name] AS displayName,  

    [library] AS [library],  

    [tag_name_1] AS tagName1,  

    [tag_name_2] AS tagName2,  

    [value_decimal] AS valueDecimal,  

    [default_days] AS defaultDays,  

    [y_min_limit] AS yMinLimit,  

    [y_max_limit] AS yMaxLimit  

 FROM   

  [dbo].[MST_Overview_Trend] AS [MST_Overview_Trend] WITH (NOLOCK)  

 WHERE  

  [MST_Overview_Trend].[case_id] = @caseID  

  AND [MST_Overview_Trend].active=1

END TRY  

  

BEGIN CATCH   

 Declare @serverName varchar(100)=@@servername  

  

 Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'  

 INSERT INTO [dbo].[log_errors_tracker]

       ([application_name], [host_name], [error_message], [error_number], [stored_procedure], 

	   [error_severity], [status_code], [created_by], [created_on]) 

	SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()  

  

END CATCH  



END 

-- EXEC [dbo].[usp_ui_get_overview_trend_data] @caseID=1;
GO

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_tree_diagram_by_case_id
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_tree_diagram_by_case_id]

 @caseid int ,@timeStamp DATETIME2(0), @category VARCHAR(60),
    @source VARCHAR(20) = 'db'

 AS

 BEGIN



 BEGIN TRY   

 

 --DECLARE @caseID INT = 1  --checkpoint  

 --DECLARE @timeStamp DATETIME2(0) = '2024-12-01 00:00:00' --checkpoint  

 --DECLARE @category VARCHAR(60) = 'energy' --checkpoint  

 

 DROP TABLE IF EXISTS #all_tag_value  

 CREATE TABLE #all_tag_value( case_id INT,  

        [level] VARCHAR(25),  

        [tag_name] VARCHAR(255),  

        [alignment] VARCHAR(25),  

        [display_name] VARCHAR(250),  

        [display_uom] VARCHAR(25),  

        [actual] FLOAT,  

        [optimum] FLOAT,  

        [state] BIT,  

        [gap_tag_name] VARCHAR(255),  

        [category] VARCHAR(60) )  

 INSERT INTO #all_tag_value  

 SELECT [MST_Tree_Diagram].[case_id],  

     UPPER([MST_Tree_Diagram].[level]),  

     UPPER([MST_Tree_Diagram].[tag_name]),  

     UPPER([MST_Tree_Diagram].[alignment]),  

     UPPER(view_case_tag.[ui_display_name]) AS [display_name],  

     UPPER(view_case_tag.[uom]) AS [display_uom],  

     ROUND([Model_Output].[actual],2) AS [actual],  

     ROUND([Model_Output].[optimum],2) AS [optimum],  

     [Model_Output].[polarity],  

     [MST_Tree_Diagram].[gap_tag_name],  

     UPPER([MST_Tree_Diagram].[category])  

 FROM [dbo].[MST_Tree_Diagram] AS [MST_Tree_Diagram] WITH (NOLOCK)  

 INNER JOIN [dbo].[view_case_tag]  WITH (NOLOCK)  

 ON [MST_Tree_Diagram].[case_id] = [view_case_tag].[caseid]  

  AND  

  [MST_Tree_Diagram].[tag_name] = [view_case_tag].[tagName]    

 LEFT JOIN [Energy_Optimization].[dbo].[model_output] AS [Model_Output] WITH (NOLOCK)  

 ON view_case_tag.[tagID] = [Model_Output].[tag_id]  

 AND [Model_Output].[time_stamp] = @timeStamp  

 AND [Model_Output].[source] = @source
 WHERE [MST_Tree_Diagram].[case_id] = @caseID  

    AND  

    [MST_Tree_Diagram].[category] LIKE '%' + @category + '%'  

    AND view_case_tag.[active]=1 

	AND [MST_Tree_Diagram].[active]=1 

      

   

 --SELECT * FROM #all_tag_value --checkpoint  

   

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@  

  

 SELECT #all_tag_value.[case_id] AS caseId,  

     #all_tag_value.[level] AS [level],  

     #all_tag_value.[tag_name] AS tagName,  

     #all_tag_value.[alignment] AS alignment,  

     #all_tag_value.[display_name] AS displayName,  

     #all_tag_value.[display_uom] AS displayUom,  

     #all_tag_value.[actual] AS actual,  

     #all_tag_value.[optimum] AS optimum,  

     Cast(#all_tag_value.[state] as Int) AS [state],  

     #all_tag_value.[category],  

     UPPER(#all_tag_value.[gap_tag_name]) AS gapTagName,  

     ROUND([Model_Output].[actual],2) AS gapActual,  

     [Model_Output].[polarity] AS gapState  

 FROM #all_tag_value WITH (NOLOCK)   

 LEFT JOIN [dbo].[view_case_tag]  WITH (NOLOCK)  

 ON #all_tag_value.[case_id] = [view_case_tag].[caseID]  

  AND  

  #all_tag_value.[gap_tag_name] = [view_case_tag].[tagName]  

  AND   

  view_case_tag.[active]=1  

 LEFT JOIN [Energy_Optimization].[dbo].[model_output] AS [Model_Output] WITH (NOLOCK)  

 ON view_case_tag.[tagID] = [Model_Output].[tag_id]  

 AND [Model_Output].[time_stamp] = @timeStamp  

   

 AND [Model_Output].[source] = @source
 ORDER BY #all_tag_value.[level] 



 END TRY           

      

BEGIN CATCH         

   

    

Declare @serverName varchar(100)=ISNULL(@@servername,'SQL server')        

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'         

      

insert into [dbo].[log_errors_tracker] ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity],[status_code], [created_by], [created_on])     

SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()         

      

END CATCH         

      

END
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_monitoring_data
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_monitoring_data]          

@caseID INT, @time DATETIME2(0) ,         

 @pageNumber INT=1,

@pageSize INT=100,

@category varchar(400)=NULL ,

@searchField varchar(100)=NULL,         

@pageCount INT = 1 OUTPUT,
    @source VARCHAR(20) = 'db'

AS          

          

BEGIN           

 SET NOCOUNT ON          

      

 SELECT [model_id]        

 into #tempDM      

 FROM [Energy_Optimization].[dbo].[model] WITH (NOLOCK)           

 WHERE [case_id] = @caseID --and [model_type] = 'DM'         

 --Union        

 --Select @modelIDLBM        

        

 -- SELECT @modelIDLBM --checkpoint    

   

 Begin try 

 drop table if exists #Main

 SELECT DISTINCT          

  [MST_Monitoring].[category] AS [category],  [Tag].tag_id as tagId,        

  [Tag].[tag_name] AS [tagName],          

  --[MST_Display_Info].[display_tag_alias] AS tagNameAlias, 

  NULL AS tagNameAlias, 

  --CASE           

  -- WHEN [MST_Display_Info].[display_name] IS NULL THEN [Tag].[tag_name]         

  -- ELSE [MST_Display_Info].[display_name]           

  --END AS [parameter], 

  [tag].[ui_display_name] as [parameter], 

  uom.uom_name AS [uom],          

  --CASE           

  -- WHEN [MST_Display_Info].[display_description] IS NULL THEN [Tag].[description]          

  -- ELSE [MST_Display_Info].[display_description]           

  --END AS displayDescription,   

  [Tag].[description] AS displayDescription,

  --CASE           

  -- WHEN [MST_Display_Info].[display_formula] IS NULL THEN NULL--[Tag].[formula]          

  -- ELSE [MST_Display_Info].[display_formula]          

  --END AS displayFormula,

	  Case when tag_type='inferred' then formula_expression ELSE  pi_name end as displayFormula,

	[MST_Monitoring].[sort_id] AS sortID,          

	CASE           

	WHEN [MST_Monitoring].[value_decimal] IS NOT NULL THEN ROUND([Model_Output].[design],[MST_Monitoring].[value_decimal])           

	ELSE ROUND([Model_Output].[design],2)           

	END AS [design],          

	CASE           

	WHEN [MST_Monitoring].[value_decimal] IS NOT NULL THEN ROUND([Model_Output].[optimum],[MST_Monitoring].[value_decimal])           

	ELSE ROUND([Model_Output].[optimum],2)           

	END AS [optimum],          

  CASE           

   WHEN [MST_Monitoring].[value_decimal] IS NOT NULL THEN ROUND(([Model_Output].[actual]),[MST_Monitoring].[value_decimal])          

      ELSE ROUND([Model_Output].[actual],2)           

  END AS [actual],          

  [Model_Output].[polarity] as [state]---[Model_Output].[state] AS [state]          

  ,[MST_Monitoring].[value_decimal] AS 'valueDecimal' ,

  [Tag].pi_name AS piName

  INTO #Main

 FROM           

  [dbo].[MST_Monitoring] AS [MST_Monitoring] WITH (NOLOCK)          

 INNER JOIN           

 [Energy_Optimization].[dbo].[Tag] AS [Tag] WITH (NOLOCK)          

  ON           

  [MST_Monitoring].[tag_name_1] = [Tag].[tag_name]          

 INNER JOIN [Energy_Optimization].[dbo].model_tag AS [Model_Tag] WITH (NOLOCK)          

  ON [Tag].[tag_id] = [Model_Tag].[tag_id] and [Model_Tag].active=1  

  Left join [Energy_Optimization].[dbo].[unit_of_measurement] AS uom WITH (NOLOCK)   

 on [Model_tag].uom_id=uom.uom_id  

 LEFT JOIN       

  [Energy_Optimization].[dbo].[model_output] AS [Model_Output] WITH (NOLOCK)          

  ON           

  [Tag].[tag_id] = [Model_Output].[tag_id]  

  AND [Model_Output].[model_id] in (Select Model_id From #tempDM WITH (NOLOCK))          

  AND [Model_Output].[time_stamp] = @time

  AND [Model_Output].[source] = @source
  Left join [Energy_Optimization].dbo.inferred_details  WITH (NOLOCK)  

  on [Model_Tag].model_tag_id=inferred_details.model_tag_id

 --LEFT JOIN           

 -- [PE_Web_Dashboard].[dbo].[MST_Display_Info] AS [MST_Display_Info] WITH (NOLOCK)          

 -- ON           

 -- [MST_Display_Info].[tag_name] = [MST_Monitoring].[tag_name_1]          

 -- AND           

 -- [MST_Display_Info].[case_id] = [MST_Monitoring].[case_id]          

WHERE           

  [MST_Monitoring].[case_id] = @caseID          

  AND           

  [Tag].[active] = 1  

  AND 

  [MST_Monitoring].active=1

  AND    

  [Model_Tag].[model_id] in (Select Model_id From #tempDM WITH (NOLOCK))         

     AND( @searchField IS NULL OR[tag].[ui_display_name] like '%'+@searchField+'%') 

	AND (@category IS NULL OR[MST_Monitoring].[Category] in  (SELECT [value] FROM STRING_SPLIT(@category,','))) 	
		
			
			
			select @pageCount=COUNT(tagId) from #Main
			set @pageCount=@pageCount/@pageSize
	select @pageCount

	select * from #Main

	--ORDER BY #Main.tagName

	ORDER BY #Main.tagId desc

	OFFSET (@pageNumber-1) * @pageSize Rows

	FETCH NEXT @pageSize Rows only             

End Try           

Begin Catch          

            



DECLARE @server_name VARCHAR(100) = @@SERVERNAME -- Checkpoint

        INSERT INTO [dbo].[log_errors_tracker]

       ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity], [status_code], [created_by], [created_on])

        SELECT 'Energy_Optimization_SQL Server', @server_name, Error_Message(), Error_Number(), Error_Procedure(), Error_Severity(), Error_State(), 1, GETDATE();

   

End Catch          

               

End            

/*          

           

EXEC [usp_ui_get_monitoring_data]           

@caseID = 58,           

@time ='2024-01-31 21:00:00';          

          

*/
GO

-- ---------------------------------------------------------------------------
-- usp_eo_em_get_seec_trend
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_eo_em_get_seec_trend]

    @sDate DATETIME,

    @eDate DATETIME,

    @caseId INT,

    @groupBy VARCHAR(10),
    @source VARCHAR(20) = 'db'

as                              

Begin                                   

   

   --Declare @sDate DATETIME = '2025-03-12T00:00:00',

   -- @eDate DATETIME = '2025-03-13T23:59:59',

   -- @caseId INT = 1,

   -- @groupBy VARCHAR(10) = 'Date'; -- 'Date','Hour'

                         

 BEGIN TRY 

 

	set @sDate = DATEADD(DAY, 1, FORMAT(@sDate, 'yyyy-MM-dd 01:00:00'))

	set @eDate = DATEADD(DAY, -1, FORMAT(@eDate, 'yyyy-MM-dd 23:00:00'))

    -- Validate groupBy input

    IF @groupBy NOT IN ('Hour', 'Date')

    BEGIN

        RAISERROR ('Invalid groupBy parameter. Use "Hour" or "Date".', 16, 1);

        RETURN;

    END



    -- Aggregating Data Based on groupBy

   

  SELECT

        --CASE 

        --    WHEN @groupBy = 'Hour' THEN FORMAT(time_stamp, 'yyyy-MM-dd HH:00:00')

        --    WHEN @groupBy = 'Date' THEN FORMAT(time_stamp, 'yyyy-MM-dd')

        --END AS timeStamp,

		(CAST(DATEDIFF(s,'1970-01-01 00:00:00 -00:00', MIN(time_stamp)) AS BIGINT)*1000) AS [timeEpoch], 

        SUM(actual_gjph) AS actual,

        SUM(target_gjph) AS target,

        SUM(baseline_gjph) AS baseline,

        SUM(gain) AS seecGain,

        SUM(enpi) AS seecPotential

    FROM [Energy_Optimization].dbo.seu_output WITH(NOLOCK)

    WHERE time_stamp BETWEEN @sDate AND @eDate

        AND case_id = @caseId

    GROUP BY 

        CASE 

            WHEN @groupBy = 'Hour' THEN FORMAT(time_stamp, 'yyyy-MM-dd HH:00:00')

            WHEN @groupBy = 'Date' THEN FORMAT(time_stamp, 'yyyy-MM-dd')

        END

    ORDER BY timeEpoch; 



 -----old-

  --SELECT

  --      --CASE 

  --      --    WHEN @groupBy = 'Hour' THEN FORMAT(time_stamp, 'yyyy-MM-dd HH:00:00')

  --      --    WHEN @groupBy = 'Date' THEN FORMAT(time_stamp, 'yyyy-MM-dd')

  --      --END AS timeStamp,

		--(CAST(DATEDIFF(s,'1970-01-01 00:00:00 -00:00', MIN(seu_output.time_stamp)) AS BIGINT)*1000) AS [timeEpoch], 

  --      SUM(ISNULL(model_output.actual,0) * seu_output.actual) AS actual,

  --      SUM(ISNULL(model_output.optimum,0)*seu_output.[target]) AS target,

  --      SUM(ISNULL(model_output.actual,0) * baseline) AS baseline,

  --      SUM(gain) AS seecGain,

  --      SUM(enpi) AS seecPotential

  --  FROM [Energy_Optimization].dbo.seu_output WITH(NOLOCK)

  --JOIN [dbo].[mst_seu_process_flow_tag_mapping]

  --ON seu_output.seu_id=[mst_seu_process_flow_tag_mapping].seu_id

  --JOIN [Energy_Optimization].[dbo].[model_output]

  --ON [mst_seu_process_flow_tag_mapping].tag_id=[model_output].tag_id

  --and [model_output].time_stamp BETWEEN @sDate AND @eDate

  --and [model_output].time_stamp=seu_output.time_stamp

  --where mst_seu_process_flow_tag_mapping.active=1 

  --and seu_output.time_stamp BETWEEN @sDate AND @eDate

  --      AND case_id = @caseId

  --  GROUP BY 

  --      CASE 

  --          WHEN @groupBy = 'Hour' THEN FORMAT(seu_output.time_stamp, 'yyyy-MM-dd HH:00:00')

  --          WHEN @groupBy = 'Date' THEN FORMAT(seu_output.time_stamp, 'yyyy-MM-dd')

  --      END

  --  ORDER BY timeEpoch;   

 ----------------------------

                    

 END TRY                          

                          

 BEGIN CATCH                  

                          

	DECLARE @serverName VARCHAR(100) = ISNULL(@@servername,'SQL Server')        

		

	SELECT     

	ERROR_MESSAGE() AS 'Error_Message', ERROR_NUMBER() AS 'Error_Number',   

	ERROR_SEVERITY() AS 'Error_Severity'  

    

	Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'    

	INSERT INTO [dbo].[log_errors_tracker]  

	([application_name], [host_name], [error_message], [error_number], [stored_procedure],   

	[error_severity], [status_code], [created_by], [created_on])   

	SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()    

                              

                          

 END CATCH                        

 End                         

                          

--/*                          

--Exec [get_infra_monitoring_casewise] @caseIDList='1'           

--Exec [get_infra_monitoring_casewise] @caseIDList='1,2'               

                          

--*/
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_enegry_distribution
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_enegry_distribution]        

@caseID int ,@time datetime2(0),
    @source VARCHAR(20) = 'db'

as        

Begin         

        

SET NOCOUNT ON             

      

      

BEGIN TRY

	

	



 SELECT 

    case_plant_mapping.[plant_name] AS plantName,

    md.category,

    -- total_energy_tag_id

	--md.total_energy_tag_id AS totalEnergyTagID,

    te.actual AS totalEnergyActual,

    te.optimum AS totalEnergyOptimum,

 

    -- seu_energy_tag_id	



	 --md.seu_energy_tag_id AS seuEnergyTagID,

    seu.actual AS seuEnergyActual,

    seu.optimum AS seuEnergyOptimum,

 

    -- non_seu_tag_id



	--md.non_seu_tag_id AS nonSeuTagID,

	nonseu.actual AS nonSeuActual,

    nonseu.optimum AS nonSeuOptimum,

 

      ---per_contribution_seu_tag_id

	  percontributionseu.actual AS perContributionSeuActual,

	   percontributionseu.optimum AS perContributionSeuOptimum,



    -- seu_energy_reduction_tag_id

	--md.seu_energy_reduction_tag_id AS seuEnergyReductionTagID,

    seured.actual AS seuEnergyReductionActual,

	--seured.optimum AS seuEnergyReductionOptimum,

 

    -- total_energy_reduction_tag_id

	 --md.total_energy_reduction_tag_id AS totalEnergyReductionTagID,

	 totalred.actual AS totalEnergyReductionActual,

	 --totalred.optimum AS totalEnergyReductionOptimum,



	-- per_energy_reduction_tag_id

	perenergyreduction.actual AS perEnergyReductionActual,

	--perenergyreduction.optimum AS perenergyreductionOptimum,



    --per_contribution_energy_type_tag_id	

	perontributionenergytype.actual AS perContributionEnergyTypeActual,

  	perontributionenergytype.optimum AS perContributionEnergyTypeOptimum



  FROM [Energy_Optimization_WebUI].[dbo].[mst_enegry_distribution] md WITH(NOLOCK)

  INNER JOIN [Energy_Optimization].dbo.case_plant_mapping  WITH(NOLOCK)

  ON case_plant_mapping.plant_id=md.plant_id

  INNER JOIN [Energy_Optimization].dbo.case_info  WITH(NOLOCK)

  ON case_plant_mapping.case_id=case_info.case_id



  LEFT JOIN [Energy_Optimization].[dbo].[model_output] te WITH(NOLOCK)

  ON te.tag_id = md.total_energy_tag_id AND te.time_stamp=@time



    AND [te].[source] = @source
  LEFT JOIN [Energy_Optimization].[dbo].[model_output] seu WITH(NOLOCK)

  ON seu.tag_id = md.seu_energy_tag_id AND seu.time_stamp=@time



    AND [seu].[source] = @source
  LEFT JOIN [Energy_Optimization].[dbo].[model_output] nonseu WITH(NOLOCK)

  ON nonseu.tag_id = md.non_seu_tag_id AND nonseu.time_stamp=@time



    AND [nonseu].[source] = @source
  LEFT JOIN [Energy_Optimization].[dbo].[model_output] percontributionseu WITH(NOLOCK)

  ON percontributionseu.tag_id = md.non_seu_tag_id AND percontributionseu.time_stamp=@time



    AND [percontributionseu].[source] = @source
  LEFT JOIN [Energy_Optimization].[dbo].[model_output] seured WITH(NOLOCK)

  ON seured.tag_id = md.seu_energy_reduction_tag_id AND seured.time_stamp=@time



    AND [seured].[source] = @source
  LEFT JOIN [Energy_Optimization].[dbo].[model_output] totalred WITH(NOLOCK)

  ON totalred.tag_id = md.total_energy_reduction_tag_id AND totalred.time_stamp=@time



    AND [totalred].[source] = @source
    LEFT JOIN [Energy_Optimization].[dbo].[model_output] perenergyreduction WITH(NOLOCK)

  ON perenergyreduction.tag_id = md.total_energy_reduction_tag_id AND perenergyreduction.time_stamp=@time



    AND [perenergyreduction].[source] = @source
      LEFT JOIN [Energy_Optimization].[dbo].[model_output] perontributionenergytype WITH(NOLOCK)

  ON perontributionenergytype.tag_id = md.total_energy_reduction_tag_id AND perontributionenergytype.time_stamp=@time

    AND [perontributionenergytype].[source] = @source
  where case_info.case_id=@caseID

 

  

END TRY        

BEGIN CATCH             

       

        

Declare @serverName varchar(100)=ISNULL(@@servername,'SQL server')            

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'             

          

insert into [dbo].[log_errors_tracker] ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity],[status_code], [created_by], [created_on])         

SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()             

          

END CATCH             

   END
GO

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_kevs_output
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_kevs_output]        

@caseID INT =NULL, @time datetime=NULL,
    @source VARCHAR(20) = 'db'

        

AS        

BEGIN        

    SET NOCOUNT ON;        

             

 BEGIN TRY     

	--DECLARE @caseID INT=1, @time datetime2(0)= '2025-02-11T07:00:00'



	SELECT 

		[PLANT].[name] AS [plant],

		[mst_kevs_details].[category],

		[mst_kevs_details].[equipment] AS [equipmentName],

		[mst_kevs_details].[parameter],

		[mst_kevs_details].[uom],

		ROUND([model_output].[actual], COALESCE([mst_kevs_details].[value_decimal], 2)) AS [actual],

		ROUND([model_output].[optimum], COALESCE([mst_kevs_details].[value_decimal], 2)) AS [optimum],

		[model_output].[polarity] as [state]

	FROM [dbo].[mst_kevs_details] With(NOLOCK)

	--INNER JOIN [Energy_Optimization].[dbo].[case_plant_mapping] With(NOLOCK)

	--ON [mst_kevs_details].[case_plant_id] = [case_plant_mapping].[case_plant_id]

	INNER JOIN [case_plants] With(NOLOCK) 

	ON [case_plants].[case_plant_id] = [mst_kevs_details].[case_plant_id]

	INNER JOIN [PLANT] With(NOLOCK)

	ON [PLANT].[plant_id] = [case_plants].[plant_id]

	LEFT JOIN [Energy_Optimization].[dbo].[model_output] With(NOLOCK)

	ON [model_output].[tag_id] = [mst_kevs_details].[tag_seu_id]

    AND [model_output].[source] = @source
	LEFT JOIN [Energy_Optimization].[dbo].[model] With(NOLOCK)

	ON [model].[model_id] = [model_output].[model_id]

	WHERE UPPER([mst_kevs_details].[tag_seu_type]) = 'TAG'

	AND [model_output].[time_stamp] = @time

	AND [model].[case_id] = @caseID

	AND [mst_kevs_details].active =1



	UNION



	SELECT 

		[PLANT].[name] AS [plant],

		[mst_kevs_details].[category],

		[mst_kevs_details].[equipment] AS [equipmentName],

		[mst_kevs_details].[parameter],

		[mst_kevs_details].[uom],

		ROUND([seu_output].[actual], COALESCE([mst_kevs_details].[value_decimal], 2)) AS [actual],

		ROUND([seu_output].[target], COALESCE([mst_kevs_details].[value_decimal], 2)) AS [optimum],

		CASE

			WHEN ROUND([seu_output].[actual], COALESCE([mst_kevs_details].[value_decimal], 2)) > ROUND([seu_output].[target], COALESCE([mst_kevs_details].[value_decimal], 2)) THEN 1

			ELSE 0 

		END AS [state]

		--NULL as [state]

	FROM [dbo].[mst_kevs_details] With(NOLOCK)

	--INNER JOIN [Energy_Optimization].[dbo].[case_plant_mapping] With(NOLOCK)

	--ON [mst_kevs_details].[case_plant_id] = [case_plant_mapping].[case_plant_id]

	INNER JOIN [case_plants] With(NOLOCK) 

	ON [case_plants].[case_plant_id] = [mst_kevs_details].[case_plant_id]

	INNER JOIN [PLANT] With(NOLOCK)

	ON [PLANT].[plant_id] = [case_plants].[plant_id]

	LEFT JOIN [Energy_Optimization].[dbo].[seu_output] With(NOLOCK)

	ON [seu_output].[seu_id] = [mst_kevs_details].[tag_seu_id]

    AND [seu_output].[source] = @source
	WHERE UPPER([mst_kevs_details].[tag_seu_type]) = 'SEU'

	AND [seu_output].[time_stamp] = @time

	AND [seu_output].[case_id] = @caseID

	AND [mst_kevs_details].active =1





 END TRY      

 BEGIN CATCH        

  DECLARE @serverName VARCHAR(100) = ISNULL(@@servername,'SQL Server')          

    

  SELECT       

  ERROR_MESSAGE() AS 'Error_Message', ERROR_NUMBER() AS 'Error_Number',     

  ERROR_SEVERITY() AS 'Error_Severity'    

      

  Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'      

  INSERT INTO [dbo].[log_errors_tracker]    

  ([application_name], [host_name], [error_message], [error_number], [stored_procedure],     

  [error_severity], [status_code], [created_by], [created_on])     

  SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()      

      

 END CATCH       

             

END
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_ods_overview_by_case_id_time
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_ods_overview_by_case_id_time]                                  

@caseID INT = NULL,                                  

@time DATETIME2(0) = NULL,
    @source VARCHAR(20) = 'db'

                                 

AS                                  

BEGIN                                  

 SET NOCOUNT ON;                  

 BEGIN TRY  

	

	DECLARE @model_id INT  

  

	SELECT @model_id = operation_decision_support.model_id  

	FROM [Energy_Optimization].[dbo].Model With(NOLOCK)  

	INNER JOIN [Energy_Optimization].dbo.operation_decision_support  With(NOLOCK)   

	ON model.model_id=operation_decision_support.model_id  

	WHERE case_id = @caseID                 

                

 DROP TABLE IF EXISTS #case_cause_id    

 CREATE TABLE #case_cause_id (model_id INT, operation_decision_support_id INT, cause_id INT,    

 effect_id INT,message_info_id int,active int,effect_description varchar(4000),     

 [cause_description] varchar(4000) ,ods_cause_monitoring_tag_id INT ,Effect_monitoring_tag_id int)    

 INSERT INTO #case_cause_id  (model_id,operation_decision_support_id,cause_id,effect_id,message_info_id,active,  

 effect_description,[cause_description],ods_cause_monitoring_tag_id,Effect_monitoring_tag_id)  

 SELECT [operation_decision_support].[model_id],     

        [operation_decision_support].[operation_decision_support_id],    

  [operation_decision_support].[cause_id],    

  [operation_decision_support].[effect_id],    

  [cause].[message_info_id],    

  [operation_decision_support].[active],    

  [effect].[effect_description],    

  [cause].[cause_description],  

  [cause].[monitoring_tag_id] ,

  [effect].[monitoring_tag_id]

 FROM [Energy_Optimization].[dbo].[operation_decision_support] WITH (NOLOCK)    

 INNER JOIN [Energy_Optimization].[dbo].[operation_decision_support_output] WITH (NOLOCK)     

 ON [operation_decision_support].[operation_decision_support_id] =     

 [operation_decision_support_output].[operation_decision_support_id]    

  AND    

    [operation_decision_support].[model_id] = @model_id    

 --AND    

 --[operation_decision_support].[active] = 1     

 AND     

 [operation_decision_support_output].[time_stamp] =@time  

  AND [operation_decision_support_output].[source] = @source
    INNER JOIN [Energy_Optimization].[dbo].[cause] AS [cause]WITH(NOLOCK)    

    ON [cause].[cause_id]=[operation_decision_support].[cause_id]    

    INNER JOIN [Energy_Optimization].[dbo].[effect] AS [effect] WITH(NOLOCK)    

    ON [effect].[effect_id]=[operation_decision_support].[effect_id]    

 --SELECT * FROM #case_cause_id --checkpoint    

 --order by ods_cause_tag_id    

    

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                  

                                  

 DROP TABLE IF EXISTS #ods_cause_monitoring_value                                 

 CREATE TABLE #ods_cause_monitoring_value(ods_id INT, --cause_uom VARCHAR(50),   

 cause_value_actual FLOAT, cause_value_optimum FLOAT)                  

                 

 --Create nonclustered index idx_case_id_ods_id on #ods_cause_monitoring(ods_id,case_id)             

                

	INSERT INTO #ods_cause_monitoring_value                                 

	SELECT DISTINCT    

	#case_cause_id.[operation_decision_support_id],    

	[model_output].[actual],                     

	[model_output].[optimum] 

	FROM #case_cause_id     

	LEFT JOIN [Energy_Optimization].[dbo].[model_output] AS [model_output] WITH (NOLOCK)                                  

	ON #case_cause_id.[ods_cause_monitoring_tag_id] = [model_output].[tag_id]    

	AND     

	[model_output].[time_stamp] = @time

	

                                  

--SELECT * from #ods_cause_monitoring_value --checkpoint     

--order by ods_id    

    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     

                                    

                                  

	AND [model_output].[source] = @source
 DROP TABLE IF EXISTS #ods_effect_monitoring_value                                 

 CREATE TABLE #ods_effect_monitoring_value(ods_id INT, --cause_uom VARCHAR(50),   

 effect_value_actual FLOAT, effect_value_optimum FLOAT)                  

                 

 --Create nonclustered index idx_case_id_ods_id on #ods_cause_monitoring(ods_id,case_id)             

                

	INSERT INTO #ods_effect_monitoring_value                                 

	SELECT DISTINCT    

	#case_cause_id.[operation_decision_support_id],    

	[Effect_model_output].[actual],                     

	[Effect_model_output].[optimum] 

	FROM #case_cause_id     

	LEFT JOIN [Energy_Optimization].[dbo].[model_output] AS [Effect_model_output] WITH (NOLOCK)                                  

	ON #case_cause_id.[Effect_monitoring_tag_id] = [Effect_model_output].[tag_id]    

	AND     

	[Effect_model_output].[time_stamp] = @time

                                

                                  

--SELECT * from #ods_cause_monitoring_value --checkpoint     

--order by ods_id    

    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ 



	AND [Effect_model_output].[source] = @source
	 SELECT    distinct

	 #case_cause_id.operation_decision_support_id AS odsID,  

	 #case_cause_id.cause_id AS causeID,  

	 #case_cause_id.[cause_description] AS [causeMessage],  

	 #case_cause_id.effect_id AS effectID,  

	 #case_cause_id.[effect_description] AS [effectMessage],    

	 #ods_cause_monitoring_value.[cause_value_actual] AS [causeValueActual],    

	 #ods_cause_monitoring_value.[cause_value_optimum] AS [causeValueOptimum],    

	 COALESCE([TRN_ODS_Suggestion].[Suggestion],[Message].[message]) AS [suggestion],

	 [Message].[message] AS [suggestion], --added by Shankhadeep

	 --NULL AS [suggestion],

	 trn_peods.request_id AS [requestID],

	 --NULL AS [requestID],

	 [case_plant_mapping].plant_name as plantName,  

	 [seu_details].[seu_id] as seuID,[seu_details].seu_name as [seuName],    

	 [seu_details].seu_category as seuCategory, [seu_details].seu_display_name as [seuDisplayName],    

	 [seu_details].energy_source as energySource,  

	 'Internal' as 'solution', 

	 ((effect_value_actual)-(effect_value_optimum)) as 'effectAbsoluteDiff',
[LOG_PEODS_MuteAlertsLog].mute_till AS [mutedTill],
[LOG_PEODS_MuteAlertsLog].created_on AS [mutedOn],
[MST_PEODS_Roles].role AS [mutedByRole],
REPLACE([view_employee_role_info].employee_name, ',', ' ') AS [mutedBy],
MST_WF_Handling_Reason.reason AS reason,
[LOG_PEODS_MuteAlertsLog].comment AS comment

	 FROM #case_cause_id WITH (NOLOCK)     

	 INNER JOIN #ods_cause_monitoring_value WITH (NOLOCK)                                  

	 ON #case_cause_id.[operation_decision_support_id] = #ods_cause_monitoring_value.[ods_id]

	  INNER JOIN #ods_effect_monitoring_value WITH (NOLOCK)                                  

	 ON #case_cause_id.[operation_decision_support_id] = #ods_effect_monitoring_value.[ods_id]

	 INNER JOIN [Energy_Optimization].[dbo].[message_info] AS [Message] WITH (NOLOCK)                                  

	 ON #case_cause_id.[message_info_id] = [message].[message_info_id]                                  

	 LEFT JOIN [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[trn_eoods] as [trn_peods] WITH (NOLOCK)                                  

	 ON #case_cause_id.[cause_id] = [trn_peods].[cause_id]  --and trn_peods.active=1    

	 AND  @time BETWEEN [trn_peods].[deviation_timestamp] AND [trn_peods].[last_occurrence]                               

	 LEFT JOIN [dbo].[trn_ods_suggestion]       

	 ON #case_cause_id.[cause_id] = [trn_ods_suggestion].cause_id    

	 AND [trn_ods_suggestion].[active] = 1    

	 left join [Energy_Optimization].[dbo].[seu_suggestions_mapping] With(nolock)    

	 on [seu_suggestions_mapping].operation_decision_support_id=#case_cause_id.[operation_decision_support_id]   

	 left join [Energy_Optimization].[dbo].[seu_details] With(nolock)    

	 on [seu_details].[seu_id]=[seu_suggestions_mapping].[seu_id]  

	 Left join [Energy_Optimization].[dbo].[case_plant_mapping] With(nolock)  

	 on [seu_details].[case_plant_id]=[case_plant_mapping].[case_plant_id] 

	left join  [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[trn_wf_logic] WITH (NOLOCK) 
ON #case_cause_id.operation_decision_support_id=[trn_wf_logic].ods_id --AND  [trn_wf_logic].[time_stamp]=@time

	 LEFT JOIN  [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[log_eoods_mute_alerts_log] [LOG_PEODS_MuteAlertsLog] WITH (NOLOCK)
ON [TRN_Wf_LOGIC].[mute_alert_id]= [LOG_PEODS_MuteAlertsLog].[mute_alert_id] --AND [LOG_PEODS_MuteAlertsLog].active=1
LEFT JOIN  [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[mst_wf_handling_reason]  WITH (NOLOCK)
ON [mst_wf_handling_reason].reason_id=[LOG_PEODS_MuteAlertsLog].reason_id --AND [LOG_PEODS_MuteAlertsLog].active=1
LEFT JOIN [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].MST_WorkflowUserRoles [MST_PEODS_Roles] WITH (NOLOCK)
on [LOG_PEODS_MuteAlertsLog].role_id=[MST_PEODS_Roles].role_id
LEFT JOIN [dbo].[view_employee_role_info] WITH (NOLOCK)
on [LOG_PEODS_MuteAlertsLog].created_by=[view_employee_role_info].LoginID

	 order by (effect_value_actual-effect_value_optimum) desc 

       

END TRY                       

                  

BEGIN CATCH                     

                  

DECLARE @server_name VARCHAR(100) = @@SERVERNAME -- Checkpoint    

        INSERT INTO [dbo].[log_errors_tracker]    

       ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity], [status_code], [created_by], [created_on])    

        SELECT 'Energy_Optimization_SQL Server', @server_name, Error_Message(), Error_Number(), Error_Procedure(), Error_Severity(), Error_State(), 1, GETDATE();    

       

END CATCH                     

                  

END
GO

-- ---------------------------------------------------------------------------
-- usp_get_peeo_ods_ids_by_caseid_time
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_get_peeo_ods_ids_by_caseid_time]  

 @caseid int=NULL, @timestamp datetime=NULL,
    @source VARCHAR(20) = 'db'

AS        

BEGIN        

    SET NOCOUNT ON;        

     

 Begin Try     

  

 Select case_info.case_id as [caseID],  

 Model.model_id as modelId,[peeo_ods_info].peeo_ods_id  as peOdsId,  

 @timestamp as [odsTimeStamp], [case_plant_mapping].plant_name as plantName, 

 [seu_details].[seu_id] as seuId,[seu_details].seu_name as [seuName],  

 [seu_details].seu_category as seuCategory, [seu_details].seu_display_name as [seuDisplayName],  

 [seu_details].energy_source as energySource,[seu_suggestions_mapping].solution_source as solution  

 from [Energy_Optimization].[dbo].case_info With(nolock)  

 Join [Energy_Optimization].[dbo].Model With(nolock)  

 on case_info.case_id=model.case_id  

 join [Energy_Optimization].[dbo].[peeo_ods_output] With(nolock)  

 on [peeo_ods_output].model_id=model.model_id  

    AND [peeo_ods_output].[source] = @source
 join [Energy_Optimization].[dbo].[peeo_ods_info] With(nolock)  

 on [peeo_ods_info].[peeo_ods_info_id]=[peeo_ods_output].[peeo_ods_info_id]  

 join [Energy_Optimization].[dbo].[seu_suggestions_mapping] With(nolock)  

 on [seu_suggestions_mapping].operation_decision_support_id=[peeo_ods_info].peeo_ods_id   

 join [Energy_Optimization].[dbo].[seu_details] With(nolock)  

 on [seu_details].[seu_id]=[seu_suggestions_mapping].[seu_id] 

 join [Energy_Optimization].[dbo].[case_plant_mapping] With(nolock)  

 on [seu_details].[case_plant_id]=[case_plant_mapping].[case_plant_id] 

 Where case_info.case_id=@caseid  

 and solution_source='external'  

 and time_stamp=@timestamp  

  

  

END TRY      

       

 Begin Catch      

  Declare @serverName varchar(100)=@@servername      

      

  Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'    

  INSERT INTO [dbo].[log_errors_tracker]  

  ([application_name], [host_name], [error_message], [error_number], [stored_procedure],   

  [error_severity], [status_code], [created_by], [created_on])   

  SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()    

    

 End Catch      

             

END
GO

-- !!! SP not found in schema dump: usp_ui_get_ods_details_by_odsidlist_time — skipped. Add it manually if needed.

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_optimizer_output
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_optimizer_output]        

@caseid int=NULL  ,@time datetime2(0),
    @source VARCHAR(20) = 'db'

as        

Begin         

        

SET NOCOUNT ON             

      

BEGIN TRY         

      

 drop table if exists #status_tag  

create table #status_tag (id int, status_model_tag_id int, status_actual float, status_optimum float)  

insert into #status_tag  

select [mst_output_mapping].Id,

[mst_output_mapping].[status_model_tag_id],

[status_model_output].[actual],  

[status_model_output].[optimum] as [statusoptimum]   

from [dbo].[mst_output_mapping] With(NOLOCK)  

join [Energy_Optimization].[dbo].model_tag With(NOLOCK)

on [mst_output_mapping].status_model_tag_id=model_tag.model_tag_id

join [Energy_Optimization].[dbo].[Tag] With(NOLOCK)

on model_tag.tag_id=tag.tag_id

Join [Energy_Optimization].[dbo].[model_output] [status_model_output] With(NOLOCK)      

on  [status_model_output].tag_id=tag.tag_id    

    AND [status_model_output].[source] = @source
Where [mst_output_mapping].case_id=@caseid and [status_model_output].time_stamp=@time

  

--select * from #status_tag  



drop table if exists #benefit_tag  

create table #benefit_tag (id int,benefit_model_tag_id int, benefit_actual float, polarityBenefit INT)  

insert into #benefit_tag  

select [mst_output_mapping].Id, 

[mst_output_mapping].benefit_model_tag_id,

[benefit_model_output].[actual],  

[benefit_model_output].[polarity] AS polarityBenefit 

from [dbo].[mst_output_mapping] With(NOLOCK)

join [Energy_Optimization].[dbo].model_tag With(NOLOCK)

on [mst_output_mapping].benefit_model_tag_id=model_tag.model_tag_id

join [Energy_Optimization].[dbo].[Tag] With(NOLOCK)

on model_tag.tag_id=tag.tag_id

Join [Energy_Optimization].[dbo].[model_output] [benefit_model_output] With(NOLOCK)      

on  [benefit_model_output].tag_id=[tag].tag_id    

    AND [benefit_model_output].[source] = @source
Where [mst_output_mapping].case_id=@caseid and [benefit_model_output].time_stamp=@time



--select * from #benefit_tag 

   

select [mst_output_mapping].case_id as caseId,[mst_output_mapping].sort_id as sortId,    

category, [tag].ui_display_name as uiDisplayName,tag.tag_name as tagName,tag.tag_id as tagId, [actual_model_tag].model_tag_id as modelTagId, uom.uom_name as uomName,    

ROUND([actual_model_output].[actual],ISNULL([mst_output_mapping].value_decimal,2)) as [actual] ,  

ROUND([actual_model_output].[optimum],ISNULL([mst_output_mapping].value_decimal,2)) as [optimum] , 

[actual_model_output].[polarity] AS polarityActual,

#status_tag.status_model_tag_id AS statusModelTagId,

ISNULL(#status_tag.[status_actual],NULL) as [statusActual] ,  

ISNULL (#status_tag.[status_optimum],NULL) as [statusOptimum] , 

#benefit_tag.benefit_model_tag_id as benefitModelTagId,

ISNULL(ROUND(#benefit_tag.benefit_actual,ISNULL([mst_output_mapping].value_decimal,2)), NULL) as [benefitActual],

#benefit_tag.polarityBenefit,

[mst_output_mapping].[flag_aggregation] as flagAggregation    

from [dbo].[mst_output_mapping] With(NOLOCK)      

Join [Energy_Optimization].[dbo].model_tag as [actual_model_tag] With(NOLOCK)        

On [actual_model_tag].[model_tag_id]=[mst_output_mapping].[actual_model_tag_id]     

-- Join [Energy_Optimization].[dbo].model_tag as [status_model_tag] With(NOLOCK)        

--On [status_model_tag].[model_tag_id]=[mst_output_mapping].[status_model_tag_id]    

Join [Energy_Optimization].[dbo].[Tag]  With(NOLOCK)    

on tag.tag_id=[actual_model_tag].tag_id   

Left Join [Energy_Optimization].[dbo].[model_output] [actual_model_output] With(NOLOCK)      

on [actual_model_output].model_id=[actual_model_tag].model_id      

and [actual_model_output].tag_id=[actual_model_tag].tag_id  

and [actual_model_output].time_stamp=@time

    AND [actual_model_output].[source] = @source
left join [Energy_Optimization].[dbo].[unit_of_measurement] AS uom With(NOLOCK)    

on uom.uom_id=[actual_model_tag].uom_id    

left join #status_tag With(NOLOCK)  

on #status_tag.id=mst_output_mapping.Id  

left join #benefit_tag  with (NOLOCK)

ON #benefit_tag.id=mst_output_mapping.Id

Where [mst_output_mapping].case_id=@caseid

and [mst_output_mapping].active=1

order by sort_id  

      

      

END TRY               

          

BEGIN CATCH             

       

        

Declare @serverName varchar(100)=ISNULL(@@servername,'SQL server')            

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'             

          

insert into [dbo].[log_errors_tracker] ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity],[status_code], [created_by], [created_on])         

SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()             

          

END CATCH             

          

END
GO

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_demand
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_demand]      

@caseid int=NULL ,@time datetime2(0),
    @source VARCHAR(20) = 'db'

as      

Begin       

      

SET NOCOUNT ON           

    

Create table #plantloaddetails(id int identity(1,1),case_id int, PlantName varchar(100),model_tag_id int)    

    

BEGIN TRY       

    

	select case_id as caseId,Plant.[name] as plantName,    

  [utility_type].energy_category as 'energyCategory',[utility_type].[type],  

  [tag].tag_name as tagName,[demand].reference_bias as referenceBias, [model_tag].[model_tag_id] as modelTagId,round(model_output.[actual],2) as [actual],

  round(model_output.optimum,2) as adjustedValue

  from [Energy_Optimization_WebUI].[dbo].[case_plants] With(NOLOCK)    

  join Plant With(NOLOCK)    

  On Plant.plant_id=[case_plants].plant_id    

  join [Energy_Optimization_WebUI].[dbo].[demand]  With(NOLOCK)    

  on [demand].case_plant_id=[case_plants].case_plant_id    

  join [Energy_Optimization_WebUI].[dbo].[utility_type] With(NOLOCK)    

  on [utility_type].utility_type_id=[demand].utility_type_id    

  Join [Energy_Optimization].[dbo].model_tag  With(NOLOCK)  

  On [model_tag].[model_tag_id]=[demand].[model_tag_id]    

  join[Energy_Optimization].[dbo].[Tag] With(NOLOCK)  

  on [model_tag].tag_id =[tag].tag_id  

  Left Join [Energy_Optimization].[dbo].[model_output]  With(NOLOCK)    

  on model_output.model_id=model_tag.model_id    

  and model_output.tag_id=model_tag.tag_id    

  and model_output.time_stamp=@time

  AND [model_output].[source] = @source
  Where case_id=@caseid

 and [demand].active=1

 order by energyCategory 

     

  --select case_id as caseId,Plant.[name] as plantName,    

  --[utility_type].energy_category as 'energyCategory',[utility_type].[type],  

  --[tag].tag_name as tagName,[model_tag].[model_tag_id] as modelTagId,round(model_output.[actual],2) as [actual]    

  --from [dbo].[case_plant_load] With(NOLOCK)    

  --join Plant With(NOLOCK)    

  --On Plant.plant_id=[case_plant_load].plant_id    

  --join [dbo].[demand]  With(NOLOCK)    

  --on [demand].case_plant_load_id=[case_plant_load].case_plant_load_id    

  --join [dbo].[utility_type] With(NOLOCK)    

  --on [utility_type].utility_type_id=[demand].utility_type_id    

  --Join [Energy_Optimization].[dbo].model_tag  With(NOLOCK)  

  --On [model_tag].[model_tag_id]=[demand].[model_tag_id]    

  --join[Energy_Optimization].[dbo].[Tag] With(NOLOCK)  

  --on [model_tag].tag_id =[tag].tag_id  

  --Left Join [Energy_Optimization].[dbo].[model_output]  With(NOLOCK)    

  --on model_output.model_id=model_tag.model_id    

  --and model_output.tag_id=model_tag.tag_id    

  --and model_output.time_stamp= @time

  --Where case_id=@caseid   

    

  

  --select case_id as caseId,Plant.[name] as plantname,    

  --[utility_type].energy_category as 'energycategory',[utility_type].[type],  

  --[tag].tag_name,model_output.[actual] as [actual]   

  --from [dbo].[case_plant_load] With(NOLOCK)   

  --Cross join [dbo].[utility_type] With(NOLOCK)    

  --Left join [dbo].[demand]  With(NOLOCK)    

  --on [demand].case_plant_load_id=[case_plant_load].case_plant_load_id   

  --and [demand].utility_type_id=[utility_type].utility_type_id  

  --Left Join [Energy_Optimization].[dbo].model_tag  With(NOLOCK)  

  --On [model_tag].[model_tag_id]=[demand].[model_tag_id]    

  --Left join[Energy_Optimization].[dbo].[Tag] With(NOLOCK)  

  --on [model_tag].tag_id =[tag].tag_id  

  --LEft Join [Energy_Optimization].[dbo].[model_output]  With(NOLOCK)    

  --on model_output.model_id=model_tag.model_id    

  --and model_output.tag_id=model_tag.tag_id  and model_output.time_stamp=@time  

  --Left join Plant With(NOLOCK)    

  --On Plant.plant_id=[case_plant_load].plant_id   

  --Where case_id= @caseid  

  --and demand_id is NOT NULL  

  --and [model_tag].[model_tag_id] is NOT NULL  

  --and [tag].tag_id is NOT NULL  

  

END TRY             

        

BEGIN CATCH           

     

      

Declare @serverName varchar(100)=ISNULL(@@servername,'SQL server')          

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'           

        

insert into [dbo].[log_errors_tracker] ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity],[status_code], [created_by], [created_on])       

SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()           

        

END CATCH           

        

END
GO

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_equipment_availability
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_equipment_availability]  

@caseid int=NULL ,@time datetime2(0),
    @source VARCHAR(20) = 'db'

as  

Begin   

  

SET NOCOUNT ON       



BEGIN TRY   



Drop table IF exists #equipment_availability_timestamp

Create table #equipment_availability_timestamp(equipment_availability_id int,equipment_id int,[availability] bit,must_run bit)



Insert into #equipment_availability_timestamp(equipment_availability_id,equipment_id,[availability],must_run)

Select [equipment_availability].equipment_availability_id,

[equipment_availability].equipment_id,

[equipment_availability].[availability],

[equipment_availability].must_run

from [Energy_Optimization].[dbo].[equipment_availability_history] With(NOLOCK) 

join [Energy_Optimization].[dbo].[equipment_availability]

on [equipment_availability].equipment_availability_id=[equipment_availability_history].equipment_availability_id

Where time_stamp=@time and case_id=@caseid

	

 select model.case_id as caseId,       

 [equipment_category].equipment_category as equipmentCategory,

 [equipment_availability].equipment_availability_id as equipmentAvailabilityId,

 [equipment_details].equipment_id as equipmentId,

 [equipment_category].equipment_type as 'equipmentType',    

 [equipment_details].equipment_name as equipmentName,

 [equipment_availability].[availability],  

 [equipment_availability].[must_run] as mustRun,  

 [model].model_id as modelId,

 [model_tag].model_tag_id as modelTagId,

 [model_output].[actual] as [actual]   

 From[Energy_Optimization].[dbo].[equipment_category] With(NOLOCK)    

 Join [Energy_Optimization].[dbo].[equipment_details] With(NOLOCK)    

 on [equipment_category].equipment_category_id=[equipment_details].equipment_category_id   

 Join [Energy_Optimization].[dbo].model_tag With(NOLOCK)    

 on model_tag.model_tag_id=[equipment_details].[status_model_tag_id]

 join [Energy_Optimization].[dbo].Model With(NOLOCK) on    

 model.model_id=model_tag.model_id   

 join[Energy_Optimization].[dbo].[Tag] With(NOLOCK) on    

 tag.tag_id =model_tag.tag_id  

 Left join #equipment_availability_timestamp as [equipment_availability] With(NOLOCK)

 on [equipment_availability].equipment_id=[equipment_details].equipment_id

 Left Join [Energy_Optimization].[dbo].[model_output]  With(NOLOCK)    

 on model_output.model_id=model_tag.model_id    

 and model_output.tag_id=model_tag.tag_id and model_output.time_stamp=@time  

 AND [model_output].[source] = @source
 Where model.case_id=@caseid  

 and [equipment_details].active=1

 and [equipment_category].active=1



END TRY         

    

BEGIN CATCH       

 

  

Declare @serverName varchar(100)=ISNULL(@@servername,'SQL server')      

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'       

    

insert into [dbo].[log_errors_tracker] ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity],[status_code], [created_by], [created_on])   

SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()       

    

END CATCH       

    

END
GO

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_plant_load
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_plant_load]      

@caseid int=NULL  ,@time datetime2(0),
    @source VARCHAR(20) = 'db'

as      

Begin       

      

SET NOCOUNT ON           

   

Drop table IF EXISTS  #plantloaddetails  

Create table #plantloaddetails(id int identity(1,1),plantid int, case_id int, PlantName varchar(100),model_tag_id int)    

    

BEGIN TRY       

    

 Insert into #plantloaddetails(case_id,plantid,PlantName,model_tag_id)    

 select case_id,Plant.plant_id, Plant.[name],model_tag_id    

 from [dbo].[case_plant_load] With(NOLOCK)    

 Left join Plant With(NOLOCK)    

 On Plant.plant_id=[case_plant_load].plant_id    

 Where case_id=@caseid    

    

 -------------plant load --------------------    

 Select plantid AS plantId,[plantname] AS plantName,  

 round([actual],0) as [actual],tag.tag_name AS tagName, NULL as 'input'    

 from #plantloaddetails With(NOLOCK)    

 Join [Energy_Optimization].[dbo].model_tag With(NOLOCK)    

 on model_tag.model_tag_id=#plantloaddetails.model_tag_id 

Join [Energy_Optimization].[dbo].[Tag]  With(NOLOCK)   

 on tag.tag_id=model_tag.tag_id  

 Left Join [Energy_Optimization].[dbo].[model_output]  With(NOLOCK)   

 on model_output.model_id=model_tag.model_id    

 and model_output.tag_id=model_tag.tag_id

   and model_output.time_stamp=@time 

 AND [model_output].[source] = @source
 Where plantname is not NULL  

    

 --------------Other Load section ---------------    

 Select plantid AS plantId,tag.ui_display_name as 'process',  

 round([actual],0) as [actual] ,tag.tag_name AS tagName,NULL as 'input'      

 from #plantloaddetails With(NOLOCK) 

  Join [Energy_Optimization].[dbo].model_tag With(NOLOCK)    

 on model_tag.model_tag_id=#plantloaddetails.model_tag_id 

  join [Energy_Optimization].[dbo].[Tag]  With(NOLOCK)   

 on tag.tag_id=model_tag.tag_id    

 Left Join [Energy_Optimization].[dbo].[model_output]  With(NOLOCK)   

 on model_output.model_id=model_tag.model_id    

 and model_output.tag_id=model_tag.tag_id    

 and model_output.time_stamp=@time 

 AND [model_output].[source] = @source
 Where plantname is NULL   

    

    

END TRY             

        

BEGIN CATCH           

     

      

Declare @serverName varchar(100)=ISNULL(@@servername,'SQL server')          

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'           

        

insert into [dbo].[log_errors_tracker] ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity],[status_code], [created_by], [created_on])       

SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()           

        

END CATCH           

        

END
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_actualoptimum_trend
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_actualoptimum_trend]    

 @caseID INT,    

 @sTime DATETIME2(0),    

 @eTime DATETIME2(0),    

 @tagList VARCHAR(MAX),    

 @roundFactor INT,
    @source VARCHAR(20) = 'db'

AS    

BEGIN    

 -- SET NOCOUNT ON added to prevent extra result sets from    

 SET NOCOUNT ON;    

  BEGIN TRY  

    

 /*    

 DECLARE @caseID INT = 37; --Checkpoint    

 DECLARE @sTime DATETIME2(0) = '2024-01-29 18:00:00'; --Checkpoint    

 DECLARE @eTime DATETIME2(0) = '2024-02-05 18:00:00';--Checkpoint    

 DECLARE @tagList VARCHAR(MAX) = 'S44_Selectivity,S44_Selectivity_Forecast'; --Checkpoint    

 DECLARE @roundFactor INT = 2; --Checkpoint    

 */    

    

 -- Inserting all the tags from tagList into a temp table    

    

 DROP TABLE IF EXISTS #temp1    

 CREATE TABLE #temp1 (tag_name_short VARCHAR(100))    

 INSERT INTO #temp1    

 SELECT [value] FROM STRING_SPLIT(@tagList, ',')    

    

 -- SELECT * FROM #temp1 --checkpoint    

    

 /*-----------------------------------------------------------------------*/    

    

 -- Inserting value of all the tags which are present in LBM_Output OR Model_Output into a temp table    

 DROP TABLE IF EXISTS #value_from_LBM_DM    

 CREATE TABLE #value_from_LBM_DM([name_short] VARCHAR(200),    

         actualValue FLOAT,    

         optimumValue FLOAT,    

         [time] DATETIME2(0),    

         timeEpoch BIGINT,    

         tagID INT,    

         runDay FLOAT)    

 --INSERT INTO #value_from_LBM_DM    

   

	IF(@tagList='seec_gain' OR @tagList='seec_enpi')

	BEGIN

	 INSERT INTO #value_from_LBM_DM   

	 SELECT    

  [seec_kpi].seec_kpi_name AS [tag_name],    

  ROUND([seec_kpi_output].seec_kpi_value, @roundFactor) AS [actualValue],    

  --ROUND([model_Output].[optimum], @roundFactor) AS [optimumValue],  

  NULL AS [optimumValue],  

  [seec_kpi_output].[time_stamp] AS [time],    

  (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',[seec_kpi_output].[time_stamp])AS BIGINT)*1000) AS [timeEpoch], -- epoch in milliseconds    

  [seec_kpi].seec_kpi_id AS [tagId],    

  NULL AS [runDay]    

 FROM [Energy_Optimization].[dbo].[seec_kpi] WITH (NOLOCK)    

 INNER JOIN Energy_Optimization.[dbo].[seec_kpi_output] WITH (NOLOCK)     

  ON [seec_kpi_output].seec_kpi_id = [seec_kpi].seec_kpi_id    

 INNER JOIN #temp1     

  ON [seec_kpi].seec_kpi_name = #temp1.tag_name_short    

 

 WHERE     

  [seec_kpi].[case_id] = @caseID    

  AND     

  [seec_kpi_output].[time_stamp] >= @sTime     

  AND     

  [seec_kpi_output].[time_stamp] <= @eTime    

  AND    

  [seec_kpi].[active] = 1    

  ORDER BY [time_stamp] ASC  

  END

  ELSE

  BEGIN

   INSERT INTO #value_from_LBM_DM   

 -- Selecting from [LBM_Output] table    

 SELECT    

  [Tag].[tag_name],    

  ROUND([model_Output].[actual], @roundFactor) AS [actualValue],    

  ROUND([model_Output].[optimum], @roundFactor) AS [optimumValue],    

  [model_Output].[time_stamp] AS [time],    

  (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',[model_Output].[time_stamp])AS BIGINT)*1000) AS [timeEpoch], -- epoch in milliseconds    

  [model_Output].[tag_id] AS [tagId],    

  NULL AS [runDay]    

 FROM [Energy_Optimization].[dbo].[model_output] AS [model_Output] WITH (NOLOCK)    

 INNER JOIN[Energy_Optimization].[dbo].[Tag] AS [Tag] WITH (NOLOCK)     

  ON [model_Output].[tag_id] = [Tag].[tag_id]    

 INNER JOIN #temp1     

  ON [Tag].[tag_name] = #temp1.tag_name_short    

 INNER JOIN [Energy_Optimization].[dbo].[model] AS [Model] WITH (NOLOCK)     

  ON [model_Output].[model_id] = [Model].[model_id]    

 WHERE     

  [Model].[case_id] = @caseID    

  AND     

  [model_Output].[time_stamp] >= @sTime     

  AND     

  [model_Output].[time_stamp] <= @eTime 

  AND    

  [Tag].[active] = 1    

  ORDER BY [time] ASC  

    END



	

 -- Selecting from [Model_Output] table    

 --UNION ALL    

 -- SELECT    

 -- [Tag].[name_short],    

 -- ROUND([Model_Output].[value], @roundFactor) AS [actualValue],    

 -- NULL AS [optimumValue],    

 -- [Model_Output].[time_stamp] AS [time],    

 -- (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',[Model_Output].[time_stamp] )AS BIGINT)*1000) AS [timeEpoch], -- epoch in milliseconds    

 -- [Model_Output].[tag_id] AS [tagID],    

 -- NULL AS [runDay]    

 --FROM [Unified_PE].[Energy_Optimization].[dbo].[model_output] AS [Model_Output] WITH (NOLOCK)    

 --INNER JOIN [Unified_PE].[dbo].[Tag] AS [Tag] WITH (NOLOCK)     

 -- ON [Model_Output].[tag_id] = [Tag].[tag_id]    

 --INNER JOIN #temp1     

 -- ON [Tag].[name_short] = #temp1.tag_name_short    

 --INNER JOIN [Unified_PE].[Energy_Optimization].[dbo].[model] AS [Model] WITH (NOLOCK)     

 --ON [Model_Output].[model_id] = [Model].[model_id]    

 --WHERE     

 -- [Model].[case_id] = @caseID    

 -- AND     

 -- [Model_Output].[time_stamp]  > @sTime     

 -- AND     

 -- [Model_Output].[time_stamp] <= @eTime    

 -- AND    

 -- [Tag].[active] = 1    

 -- AND    

 -- ([Model_Output].[skip_status_type] != 'skip_data_insufficient'  OR [Model_Output].[skip_status_type] IS NULL)    

    

 ---- SELECT * FROM #value_from_LBM_DM --checkpoint    

    

 /*-----------------------------------------------------------------------*/    

    

 -- Inserting those tags which are not in LBM_Output and Model_Output into a temp table    

 DROP TABLE IF EXISTS #temp2    

  CREATE TABLE #temp2 (tag_name_short VARCHAR(100))    

  INSERT INTO #temp2    

    

  SELECT tag_name_short    

  FROM #temp1    

  EXCEPT     

  SELECT DISTINCT([name_short])    

  FROM #value_from_LBM_DM    

    

  -- SELECT * FROM #temp2 --checkpoint    

    

     /*-----------------------------------------------------------------------*/    

    

  SELECT    

  [name_short] AS [name],    

  [actualValue],    

  [optimumValue],    

  [time],    

  [timeEpoch],    

  [tagID] AS tagId,    

  [runDay]    

 FROM #value_from_LBM_DM    

 Order by [time] asc

 --UNION     

    

 --SELECT    

 -- [Tag].[name_short] AS [name],    

 -- ROUND([Model_Output_Trend].[value], @roundFactor) AS [actualValue],    

 -- NULL AS [optimumValue],    

 -- [Model_Output_Trend].[time_stamp] AS [time],    

 -- (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',[Model_Output_Trend].[time_stamp] )AS BIGINT)*1000) AS [timeEpoch], -- epoch in milliseconds    

 -- [Model_Output_Trend].[tag_id] AS [tagID],    

 -- [Model_Output_Trend].[run_day] AS [runDay]    

 --FROM [ds].[Model_Output_Trend] AS [Model_Output_Trend] WITH (NOLOCK)    

 --INNER JOIN [ds].[Tag] AS [Tag] WITH (NOLOCK)     

 -- ON [Model_Output_Trend].[tag_id] = [Tag].[tag_id]    

 --INNER JOIN #temp2    

 -- ON [Tag].[tag_name] = #temp2.[tag_name_short]    

 --INNER JOIN [ds].[Model] AS [Model] WITH (NOLOCK)     

 --ON [Model_Output_Trend].[model_id] = [Model].[model_id]    

 --WHERE     

 -- [Model].[case_id] = @caseID    

 -- AND    

 -- [Model_Output_Trend].[time_stamp]  > @sTime     

 -- AND     

 -- [Model_Output_Trend].[time_stamp] <= @eTime    

 -- AND    

 -- [Tag].[active] = 1    

 --ORDER BY [time] ASC    

    

 DROP TABLE IF EXISTS #value_from_LBM_DM     

 DROP TABLE IF EXISTS #temp1    

 DROP TABLE IF EXISTS #temp2    

  END TRY  

                                     

BEGIN CATCH                                       

                                  

Declare @serverName varchar(100)=@@servername                                       

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'                                       

                                    

 INSERT INTO [dbo].[log_errors_tracker]  

       ([application_name], [host_name], [error_message], [error_number], [stored_procedure],   

    [error_severity], [status_code], [created_by], [created_on])  

  SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()      

                              

END CATCH    

END    

/*    

EXEC [dbo].[usp_ui_get_actualoptimum_trend]     

@caseID = 1,    

@sTime = '2024-12-05T00:00:00',    

@eTime = '2024-12-12T23:59:59',    

@tagList = 'EOEG_1_HPS_Demand',    

@roundFactor = 2; --Checkpoint    

*/
GO

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_what_if_plant_parameters
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_what_if_plant_parameters] @caseid int=NULL,@timestamp Datetime=NULL,
    @source VARCHAR(20) = 'db'

As    

Begin    

    

 SET NOCOUNT ON      

   

   drop table IF exists #PlantDetails

   Create table #PlantDetails(plant_id int, [name] varchar(100))



   Insert into #PlantDetails(plant_Id,[name])

   Select plant_id,[name] from plant

   Union

   Select 0,'Others' 



   --Select * from #PlantDetails

 Begin try  

  

  

  Select [case_plants].case_id as caseId,

  model_tag.model_id as modelId,

  plant.[name] as plantName,

  [model_tag].model_tag_id as modelTagId,

  tag.tag_id tagId,  

  tag.tag_name as tagName,  

  ui_display_name as tagUidisplayName, 

  [unit_of_measurement].uom_name as uomName,

  ROUND(actual,2) as actual,  

  optimum,  

  [what_if_user_inputs].reference_max AS referenceMax,

  --NULL AS referenceMax,

 [what_if_user_inputs].reference_min AS referenceMin,

 --NULL AS referenceMin,

  [unit_of_measurement].uom_name as uomName,   

  [what_if_user_inputs].flag_show_ui AS flagShowUi

 --NULL AS flagShowUi

  from [dbo].[case_plants] With(NOLOCK)  

  join [dbo].[what_if_user_inputs] With(NOLOCK)  

  on [case_plants].case_plant_id=[what_if_user_inputs].[case_plant_id]  

  Join [Energy_Optimization].[dbo].model_tag With(NOLOCK)  

  on [model_tag].model_tag_id=[what_if_user_inputs].model_tag_id  

  Join [Energy_Optimization].[dbo].[model_output] With(NOLOCK)  

  on [model_output].model_id=[model_tag].model_id  

  and [model_tag].tag_id=[model_output].[tag_id]   

  AND [model_output].[source] = @source
  join #PlantDetails PLANT With(NOLOCK)  

  on PLANT.plant_id=[case_plants].plant_id  

  join[Energy_Optimization].[dbo].[Tag] With(NOLOCK)  

  on tag.tag_id=[model_output].[tag_id]  

  join [Energy_Optimization].[dbo].[unit_of_measurement] With(NOLOCK)  

  on [unit_of_measurement].uom_id=model_tag.uom_id  

  Where [case_plants].case_id=@caseid  

  and [model_output].time_stamp=@timestamp

  and [what_if_user_inputs].active=1

  order by [case_plants].plant_id  desc

  

End try   

BEGIN CATCH  

  

Declare @serverName varchar(100)=ISNULL(@@servername,'SQL server')          

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'           

        

insert into [dbo].[log_errors_tracker] ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity],[status_code], [created_by], [created_on])       

SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()     

  

END CATCH  

   

END
GO

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_datamodelskip
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_datamodelskip]  

@caseId INT,@sTime DATETIME2(0),@eTime DATETIME2(0),@dayDiff INT,
    @source VARCHAR(20) = 'db'

  

AS  

  

BEGIN  

BEGIN TRY  

--DECLARE @caseId INT =1  

--DECLARE @sTime DATETIME2(0)='2024-12-10T01:00:00'  

--DECLARE @eTime DATETIME2(0)= '2024-12-10T06:00:00'  

--DECLARE @dayDiff INT = 7; --Checkpoint      

--DECLARE @pageNumber INT = 1; --Checkpoint     

--DECLARE @pageSize INT = 20; --Checkpoint     

--DECLARE @pageCount INT = 0;     

  

      DECLARE @start DATETIME2(0) = @sTime,@end DATETIME2(0) = @eTime, @DiffDays INT=@dayDiff    

  IF @sTime IS NULL AND @eTime IS NULL      

   BEGIN     

    SET @end  = (      

     SELECT     

      MAX([Run_Info].[last_run_time])      

     FROM     

      [Energy_Optimization].[dbo].[Run_info] AS [Run_Info] WITH (NOLOCK)      

     INNER JOIN [Energy_Optimization].[dbo].[model] AS [Model] WITH (NOLOCK)      

      ON [Model].[model_id] = [Run_info].[model_id])      

    SET @start = DATEADD(DAY, -@DiffDays, @end)      

   END      

  IF @sTime IS NULL AND @eTime IS NOT NULL      

   BEGIN      

    SET @end = @eTime    

    SET @start   = DATEADD(DAY, -@DiffDays, @end)      

   END  

  

--SELECT @pageCount  

DROP TABLE IF EXISTS #ccp_info   

CREATE TABLE #ccp_info ([ccp_info_id] int, [parameter] varchar(100), [logic] varchar(100), [active] int, [description] varchar(200), [show_warning] int, [show_alert] int)  

INSERT INTO #ccp_info  

SELECT [ccp_info_id]  

      ,[parameter]  

      ,[logic]  

      ,[active]  

      ,[description]  

      ,[show_warning]  

      ,[show_alert]  

  FROM [Energy_Optimization].[dbo].[case_configuration_portal_info] WITH (NOLOCK)

  where ([show_warning] != 0 or [show_alert] !=0)

  

--SELECT * FROM #ccp_info --Checkpoint  





   DROP TABLE IF EXISTS #switchconfig 

CREATE TABLE #switchconfig ([switch_configuration_id] int, [parameter] varchar(100), [logic] varchar(100), [active] int, [description] varchar(200), [show_warning] int, [show_alert] int)  

INSERT INTO #switchconfig  

SELECT switch_configuration_id  

      ,[parameter]  

      ,[logic]  

      ,[active]  

      ,[description]  

      ,[show_warning]  

      ,[show_alert]  

  FROM [Energy_Optimization].[dbo].[switch_configuration] WITH (NOLOCK)

  where ([show_warning] != 0 or [show_alert] !=0)

  

--SELECT * FROM #switchconfig --Checkpoint 

  

DROP TABLE IF EXISTS #model_status  

CREATE TABLE #model_status (model_id int,model_status varchar(100),last_run_time datetime2(0)  

)  

INSERT INTO #model_status   

SELECT run_info.model_id, model_status, last_run_time 

FROM [Energy_Optimization].[dbo].[Run_info] WITH (NOLOCK) 

JOIN [Energy_Optimization].[dbo].Model as Model WITH (NOLOCK) 

on Model.model_id=run_info.model_id   

where Model.case_id=@caseId  

and run_info.last_run_time between @sTime and @eTime  

and run_info.model_status !='on'  

  

--select * from #model_status  --checkpoint  

   

DROP TABLE IF EXISTS #model_ouput_current_actual  

create table #model_ouput_current_actual (model_id int,model_status varchar(100),last_run_time datetime2(0),[current] float , actual float , tag_id int, [min] float , [max]  float , logic varchar(200) , [description] varchar (250), case_id int, [timeStamp] datetime2(0), modelName varchar(50), [rawValue] float 

)  

  

insert into  #model_ouput_current_actual  

select distinct #model_status.model_id,  

#model_status.model_status,  

#model_status.last_run_time,  

model_output.[actual],  

model_output.[current],  

model_alert_output.tag_id,

ccp.lolo AS [min],

ccp.hihi AS [max],  

CASE WHEN model_alert_output.ccp_info_id IS NULL and model_alert_output.switch_configuration_id IS NOT NULL

THEN #switchconfig.logic ELSE ccp_info.logic END AS logic,



 CASE WHEN model_alert_output.ccp_info_id IS NULL and model_alert_output.switch_configuration_id IS NOT NULL

THEN #switchconfig.[description] ELSE ccp_info.[description] END AS[description],



model.case_id,

model_alert_output.time_stamp AS timeStamp,

model.model_name AS modelName,

model_alert_output.raw_value AS rawValue

from #model_status WITH (NOLOCK) 

join [Energy_Optimization].[dbo].[model_output] as model_output WITH (NOLOCK) on  

#model_status.model_id=model_output.model_id  

    AND [model_output].[source] = @source
join [Energy_Optimization].[dbo].model_alert_output WITH (NOLOCK) on  

model_output.tag_id=model_alert_output.tag_id  

and model_output.time_stamp=model_alert_output.time_stamp  

AND #model_status.last_run_time = model_alert_output.time_stamp

JOIN #ccp_info AS ccp_info WITH (NOLOCK)  

ON model_alert_output.ccp_info_id=ccp_info.ccp_info_id

 LEFT JOIN #switchconfig WITH(NOLOCK)

ON #switchconfig.switch_configuration_id=model_alert_output.switch_configuration_id

JOIN [Energy_Optimization].[dbo].Model AS Model WITH (NOLOCK) 

ON model_alert_output.model_id=Model.model_id  

LEFT JOIN [Energy_Optimization].[dbo].[case_configuration_portal] AS ccp WITH (NOLOCK) 

ON  model_alert_output.ccp_id=ccp.ccp_id  

 

where model.case_id=@caseId   

and model_alert_output.time_stamp between @sTime AND @eTime  

and #model_status.model_status !='off_opt_nf'  

  

--select * from #model_ouput_current_actual  --checkpoint  

  

DROP TABLE IF EXISTS #model_status_temp  

CREATE TABLE #model_status_temp (modelId int,[timeStamp] datetime2(0),[timeEpoch] bigint ,modelName varchar(50) , [status] varchar(50) ,  

tagId int  ,piName varchar(100),tagName varchar(100),uiDisplayName varchar(100),tagType varchar(20), [rawValue] float,  

[actual] float,[current] float,[min] float , [max]  float , logic varchar(200) , [description] varchar (250) )  

   

INSERT INTO #model_status_temp  

   

SELECT distinct   

       #model_ouput_current_actual.model_id AS modelId,  

    #model_ouput_current_actual.[timeStamp],  

    (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',#model_ouput_current_actual.[timeStamp]) AS BIGINT)*1000) AS [timeEpoch],  

    #model_ouput_current_actual.modelName,  

    #model_ouput_current_actual.model_status AS [status],  

    Tag.tag_id AS tagId,  

    Tag.pi_name AS piName,  

    Tag.tag_name AS tagName,  

    Tag.ui_display_name AS uiDisplayName,  

    Tag.tag_type AS tagType,  

    ROUND(#model_ouput_current_actual.[rawValue],2) AS [rawValue],  

    ROUND(#model_ouput_current_actual.[current],2) AS [current],  

    ROUND(#model_ouput_current_actual.[actual],2) AS [actual],  

    #model_ouput_current_actual.[min]

	,#model_ouput_current_actual.[max],  

    #model_ouput_current_actual.logic,  

       #model_ouput_current_actual.[description]    

FROM #model_ouput_current_actual WITH (NOLOCK) 

JOIN [Energy_Optimization].[dbo].model_tag AS model_tag WITH (NOLOCK)  

ON model_tag.tag_id=#model_ouput_current_actual.tag_id  

JOIN [Energy_Optimization].[dbo].[Tag] AS Tag WITH (NOLOCK) 

on Tag.tag_id=#model_ouput_current_actual.tag_id     

WHERE #model_ouput_current_actual.case_id=@caseId 

AND #model_ouput_current_actual.[timeStamp] BETWEEN @sTime AND @eTime  

  

Union   

  

SELECT distinct   

       #model_status.model_id AS modelId,  

    #model_status.last_run_time AS [timeStamp],  

    (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',#model_status.last_run_time) AS BIGINT)*1000) AS [timeEpoch],  

    Model.model_name AS modelName,  

    #model_status.model_status AS [status],  

    null AS tagId,null AS piName, null AS tagName, null AS uiDisplayName, null AS tagType, null AS [rawValue], null AS [current], null AS [actual], null AS [min], null AS [max], null AS logic,  

 CASE WHEN #model_status.model_status = 'off_opt_nf' THEN 'OPTIMUM NOT FOUND'   

 ELSE NULL   

 END AS[description]  

FROM #model_status WITH (NOLOCK) 

JOIN [Energy_Optimization].[dbo].Model AS Model WITH (NOLOCK) 

ON #model_status.model_id=Model.model_id  

WHERE Model.case_id=@caseId  

AND #model_status.last_run_time BETWEEN @sTime AND @eTime  

AND #model_status.model_status in ('off_opt_nf')  

  

--select * from #model_status_temp   --checkpoint   

   

Select modelId, [timeStamp], [timeEpoch], modelName, [status], tagId, piName,  

     tagName, uiDisplayName, tagType, [rawValue], [actual], [current], [min], [max],  

     logic, [description] from #model_status_temp WITH (NOLOCK) 



	  DROP TABLE IF EXISTS #switchconfig 

DROP TABLE IF EXISTS #ccp_info 

DROP TABLE IF EXISTS #model_status 

DROP TABLE IF EXISTS #model_ouput_current_actual 

DROP TABLE IF EXISTS #model_status_temp  

	

  

END TRY  

  

BEGIN CATCH           

     

      

Declare @serverName varchar(100)=ISNULL(@@servername,'SQL server')          

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'           

        

insert into [dbo].[log_errors_tracker] ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity],[status_code], [created_by], [created_on])   

SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()           

        

END CATCH  

  

END
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_ods_data_by_case_id_list_time_range_req_id
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_ods_data_by_case_id_list_time_range_req_id]                                

@caseIDList VARCHAR(250),                                

@sTime DATETIME2(0),                                

@eTime DATETIME2(0),
    @source VARCHAR(20) = 'db'

                               

AS                                

BEGIN                                

 SET NOCOUNT ON;                

 BEGIN TRY               

 --DECLARE @caseIDList VARCHAR(250) = '1'       

 --DECLARE @sTime DATETIME2(0) = ''                             

 --DECLARE @eTime DATETIME2(0) = ''     

 --DECLARE @sTime DATETIME2(0) = '2024-10-10 08:00:00'                             

 --DECLARE @eTime DATETIME2(0) = '2024-10-22 08:00:00'                           

                 

                           

 Drop table IF EXISTS #tempCaseID                                  

 CREATE TABLE #tempCaseID(CaseID INT)   

  Drop table IF EXISTS #tempCaseIDModelID                                  

 CREATE TABLE #tempCaseIDModelID(CaseID INT,model_id int)   

                                  

 INSERT INTO #tempCaseID(CaseID )                                  

 SELECT [value] FROM STRING_SPLIT(@caseIDList,',')                                  

                                  

 IF EXISTS (SELECT 1 FROM #tempCaseID WHERE [CaseID] = 71)                                  

 BEGIN                                   

  INSERT INTO #tempCaseID VALUES (102)                                  

 END    

 

 --SELECT * FROM #tempCaseID --checkpoint 

 Insert into #tempCaseIDModelID  

 Select Case_id,model_id  

 From #tempCaseID  

 join [Energy_Optimization].[dbo].[model]

 on #tempCaseID.Caseid=[model].Case_id  

 --Where model_type='LBM'   

  --SELECT * FROM #tempCaseIDModelID  

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                         

 /* IF @sTime and @eTime not given */                                  

                                  

 IF @sTime = '' AND @eTime = ''                                  

 BEGIN                                  

  SET @eTime = (SELECT MAX(time_stamp)                                   

  FROM [Energy_Optimization].[dbo].[operation_decision_support_output] With(NOLOCK)                                 

  JOIN [Energy_Optimization].[dbo].[model] WITH (NOLOCK)

  ON [model].model_id = [operation_decision_support_output].model_id

  WHERE case_id IN (SELECT [CaseID] FROM #tempCaseID))                                  

                                    

  SET @sTime = DATEADD(DAY,-1,@eTime)                                  

                                 

 END                                           

 /* IF @eTime is given but @sTime is not given */                                  

                                  

 IF @eTime IS NOT NULL AND @sTime = ''                                  

 BEGIN                                  

  SET @sTime = DATEADD(DAY,-1,@eTime)                                          

 END                  

 --SELECT @sTime, @eTime             

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     

 DROP TABLE IF EXISTS #case_cause_id    

 CREATE TABLE #case_cause_id (case_id INT, model_id INT, ods_id INT, cause_id INT,    

 effect_id INT,message_info_id int,active int,effect_description varchar(4000),[cause_description] varchar(4000) 

 ,ods_cause_monitoring_tag_id INT ,Effect_monitoring_tag_id int,

 LastOccurrence DATETIME2(0), RequestID INT, AssignedTo VARCHAR(50), StageID INT,                        

 DeviationTimeStamp DATETIME2(0), TargetDate BIGINT, [Status] VARCHAR(50), BpmInitiated BIT, AffiliateName VARCHAR(50), CumulativeLostOpportunity FLOAT)    



 ;with CTEtest as(

 SELECT DISTINCT  #tempCaseIDModelID.[CaseID] AS [case_id],[operation_decision_support].[model_id],     

        [operation_decision_support].[operation_decision_support_id] AS [ods_id],    

  [operation_decision_support].[cause_id],    

  [operation_decision_support].[effect_id],    

  [cause].[message_info_id],    

  [operation_decision_support].[active],    

  [effect].[effect_description],    

  [cause].[cause_description],  

  [cause].[monitoring_tag_id] AS cause_monitoring_tag_id,

  [effect].[monitoring_tag_id] AS effect_monitoring_tag_id,

  [operation_decision_support_output].[time_stamp] as [last_occurrence],

  [TRN_EOODS].[request_id],    

  [TRN_EOODS].[assigned_to],    

  [TRN_EOODS].[stage_id],    

  [TRN_EOODS].[deviation_timestamp],    

  [TRN_EOODS].[target_date],    

  [TRN_EOODS].[status],    

  [TRN_EOODS].[bpmInitiated], 

  [TRN_EOODS].[affiliate_name], 

  [TRN_EOODS].[cumulative_lost_opportunity],

  ROW_NUMBER() over (partition by [operation_decision_support_output].[Operation_Decision_Support_id] order by [operation_decision_support_output].[time_stamp] desc) as rnk

 FROM [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[TRN_EOODS] WITH(NOLOCK)

 INNER JOIN #tempCaseIDModelID WITH(NOLOCK)

 ON [TRN_EOODS].[case_id] = #tempCaseIDModelID.[CaseID]

 INNER JOIN [Energy_Optimization].[dbo].[operation_decision_support] WITH (NOLOCK)   

 ON [TRN_EOODS].[cause_id] = [operation_decision_support].[cause_id] 

AND #tempCaseIDModelID.[model_id] = [operation_decision_support].model_id 

 INNER JOIN [Energy_Optimization].[dbo].[operation_decision_support_output] WITH (NOLOCK)     

 ON [operation_decision_support].[operation_decision_support_id] = [operation_decision_support_output].[operation_decision_support_id]

  AND [operation_decision_support_output].[time_stamp] Between [TRN_EOODS].[deviation_timestamp] and  [TRN_EOODS].[last_occurrence]

 --AND[operation_decision_support].[active] = 1     

  AND [operation_decision_support_output].[source] = @source
INNER JOIN [Energy_Optimization].[dbo].[cause] AS [cause]WITH(NOLOCK)    

ON [cause].[cause_id]=[operation_decision_support].[cause_id]    

INNER JOIN [Energy_Optimization].[dbo].[effect] AS [effect] WITH(NOLOCK)    

ON [effect].[effect_id]=[operation_decision_support].[effect_id]

AND  

 [TRN_EOODS].[deviation_timestamp] <= @eTime AND [TRN_EOODS].[last_occurrence] >= @sTime   

)



INSERT INTO #case_cause_id 

SELECT DISTINCT [case_id],[model_id],[ods_id],[cause_id],    

[effect_id],[message_info_id],[active],[effect_description],[cause_description],[cause_monitoring_tag_id],[effect_monitoring_tag_id],

[last_occurrence],[request_id],[assigned_to],[stage_id],    

[deviation_timestamp],[target_date],[status],[BpmInitiated],[affiliate_name],[cumulative_lost_opportunity]

from CTEtest

Where rnk=1

 --SELECT * FROM #case_cause_id --checkpoint    

 --order by ods_cause_tag_id      

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@    

                                  

 DROP TABLE IF EXISTS #ods_cause                                  

 CREATE TABLE #ods_cause(ods_id INT,case_id INT, model_id int,ods_cause_tag_id INT, ods_cause_tag_name VARCHAR(255), cause_message VARCHAR(255),message_id INT)                                  

 INSERT INTO #ods_cause                                  

 SELECT DISTINCT    

     #case_cause_id.ods_id,                                  

     #case_cause_id.[case_id],  

     #case_cause_id.[model_id],  

     #case_cause_id.ods_cause_monitoring_tag_id,                                  

     [Tag].tag_name AS [name_short],                                  

     cause.cause_description,                                  

     #case_cause_id.message_info_id     

 FROM #case_cause_id    

 INNER JOIN[Energy_Optimization].[dbo].[Tag] AS [Tag] WITH (NOLOCK)    

 ON #case_cause_id.ods_cause_monitoring_tag_id = [Tag].[tag_id] 

 INNER JOIN [Energy_Optimization].[dbo].cause AS cause WITH (NOLOCK)    

 ON #case_cause_id.cause_id = cause.cause_id 

                                   

 --SELECT  * FROM #ods_cause --checkpoint     

 --order by ods_cause_tag_id    

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                  

                                  

 DROP TABLE IF EXISTS #ods_effect                                  

 CREATE TABLE #ods_effect(ods_id INT,case_id INT, model_id int,ods_effect_tag_name VARCHAR(255), effect_message VARCHAR(255), category VARCHAR(50))                                  

 INSERT INTO #ods_effect                                  

 SELECT DISTINCT    

     #case_cause_id.ods_id,                                  

     #case_cause_id.[case_id],   

     #case_cause_id.[model_id],  

     [Tag].tag_name AS [name_short],                                  

     effect.effect_description,                                  

     effect.category AS[category]    

 FROM #case_cause_id    

 INNER JOIN[Energy_Optimization].[dbo].[Tag] AS [Tag] WITH (NOLOCK)    

 ON #case_cause_id.Effect_monitoring_tag_id = [Tag].[tag_id] 

 INNER JOIN [Energy_Optimization].[dbo].effect AS effect WITH (NOLOCK)    

 ON #case_cause_id.effect_id = effect.effect_id   

                                  

 --SELECT  * FROM #ods_effect  --checkpoint     

 --order by ods_id       

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                  

                                  

 DROP TABLE IF EXISTS #ods_cause_monitoring                                  

 CREATE TABLE #ods_cause_monitoring(ods_id INT,case_id INT,model_id int, ods_cause_monitoring_tag_id INT,

 uom VARCHAR(255),LastOccurrence DATETIME2(0))                  

                 

 Create nonclustered index idx_case_id_ods_id on #ods_cause_monitoring(ods_id,case_id)             

                

 INSERT INTO #ods_cause_monitoring                                  

 SELECT DISTINCT    

 #case_cause_id.ods_id,                                  

 #case_cause_id.[case_id],    

 #case_cause_id.[model_id],  

 #case_cause_id.[ods_cause_monitoring_tag_id],                                  

 unit_of_measurement.uom_name AS uom,          

 #case_cause_id.[LastOccurrence]

 FROM #case_cause_id    

 INNER JOIN [Energy_Optimization].[dbo].[Tag] AS [Tag] WITH (NOLOCK)    

 ON #case_cause_id.[ods_cause_monitoring_tag_id] = [Tag].[tag_id] 

  INNER JOIN [Energy_Optimization].[dbo].model_tag AS model_tag WITH (NOLOCK)    

 ON model_tag.[tag_id] = [Tag].[tag_id] 

    INNER JOIN [Energy_Optimization].[dbo].[unit_of_measurement] AS unit_of_measurement WITH (NOLOCK)    

 ON model_tag.uom_id = unit_of_measurement.uom_id                                

--SELECT * from #ods_cause_monitoring --checkpoint     

--order by ods_id    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                  

                

                

 DROP TABLE IF EXISTS #ods_cause_monitoring_value                                  

 CREATE TABLE #ods_cause_monitoring_value(ods_id INT,case_id INT, time_stamp DATETIME, cause_value_actual FLOAT, cause_value_optimum FLOAT, cause_uom VARCHAR(100))                                  

                         

 INSERT INTO #ods_cause_monitoring_value                                 

 SELECT  Distinct 

 #ods_cause_monitoring.[ods_id],                                  

 #ods_cause_monitoring.[case_id],     

 [model_output].time_stamp,

 [model_output].[actual],                                  

 [model_output].[optimum],                                 

 #ods_cause_monitoring.[uom]                                  

 From #ods_cause_monitoring WITH (NOLOCK)    

 INNER JOIN [Energy_Optimization].[dbo].[model_output] WITH (NOLOCK)                                  

 ON #ods_cause_monitoring.[ods_cause_monitoring_tag_id] = [model_output].[tag_id]  

    AND     

    #ods_cause_monitoring.[LastOccurrence] = [model_output].[time_stamp]    

    AND #ods_cause_monitoring.model_id=[model_output].[model_id]

                        

--Select * From #ods_cause_monitoring_value     

--order by ods_id    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     

    

-- Getting PM and system Admin ID and role.    

    

    AND [model_output].[source] = @source
 DECLARE @affiliateId INT = (SELECT top 1 affiliate_code  

                         FROM #tempCaseID     

       INNER JOIN [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[trn_eoods] WITH (NOLOCK)    

       ON #tempCaseID.[CaseID] = [trn_eoods].[case_id])    

    

 DECLARE @tempName VARCHAR(100) = (SELECT TOP 1 employee_name + ' (' + 'SUSTAINABILITY FOCAL POINT' + ')'    

          FROM [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[adm_userrolepositioncodemapping_eoai] adm_peods_user_rolemapping WITH (NOLOCK)    

          INNER JOIN  

		  [dbo].[view_employee_role_info] WITH (NOLOCK)    

          ON adm_peods_user_rolemapping.EmployeeID = [view_employee_role_info].[LoginID]    

          where     

           [adm_peods_user_rolemapping].AffiliateCode = @affiliateId 

           AND    

           adm_peods_user_rolemapping.RoleID = 1    

           AND     

           adm_peods_user_rolemapping.IsActive = 1)    

    

 --SELECT @affiliateId AS plantID, @tempName AS PM  --checkpoint    

    

 IF @tempName IS NULL    

 BEGIN    

 SET @tempName = (SELECT TOP 1 [employee_name] + ' (' + 'System Administrator' + ')'     

      FROM [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[MST_Configurations_EOAI] [MST_Configurations] WITH (NOLOCK)   

      INNER JOIN  [dbo].[view_employee_role_info] WITH (NOLOCK)  

      ON [MST_Configurations].configuration_value = [view_employee_role_info].[LoginID]    

      AND     

      [configuration_name] = 'System Administrator' AND mst_configurations.active = 1)    

 END     

 --SELECT @tempName AS Sysadmin --checkpoint    

    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     

      

DROP TABLE IF EXISTS #tempLastLog      

      

SELECT [RequestID],      

       [lastActionTakenBy],      

       [comments],    

    [currentAssignee],   

    [stage_name] AS [StageName]    

INTO #tempLastLog      

FROM       

(      

SELECT #case_cause_id.[RequestID],      

       CASE WHEN [emp_1].[employee_name] IS NULL AND [s1].stage_id = 0 THEN 'Generated By System'     

         WHEN [emp_1].[employee_name] IS NULL AND [s1].stage_id != 0 THEN '-'     

            ELSE [emp_1].[employee_name] + ' (' + [r1].[Role] + ')'      

       END AS lastActionTakenBy,      

    CASE WHEN [emp_1].[employee_name] IS NULL THEN '-'       

         ELSE [Comments]      

    END AS [comments],      

    CASE WHEN [emp_2].[employee_name] IS NULL THEN @tempName      

         ELSE [emp_2].[employee_name] + ' (' + [r2].[Role] + ')'      

    END AS [currentAssignee],    

    [s2].[stage_name],    

    ROW_NUMBER() OVER(PARTITION BY #case_cause_id.[RequestID] ORDER BY [log_eoods_action_log].[created_on] DESC) AS Rn      

FROM #case_cause_id WITH (NOLOCK)      

INNER JOIN [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].log_eoods_action_log WITH (NOLOCK)      

ON #case_cause_id.[RequestID] = [log_eoods_action_log].request_id      

   AND     

   [log_eoods_action_log].active = 1       

INNER JOIN [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[ADM_WorkflowStages_Checks_EOAI] s1 WITH (NOLOCK)      

ON [log_eoods_action_log].stage_id = [s1].stage_id      

LEFT JOIN [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[MST_WorkflowUserRoles] r1 WITH (NOLOCK)      

ON [s1].stage_id = [r1].stage_id      

LEFT JOIN  [dbo].[view_employee_role_info] emp_1 WITH (NOLOCK)    

ON [log_eoods_action_log].created_by = [emp_1].[LoginID]    

    

INNER JOIN [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[ADM_WorkflowStages_Checks_EOAI] s2 WITH (NOLOCK)      

ON #case_cause_id.[StageID] = [s2].stage_id      

INNER JOIN [SABIC_DT_MFG_EnergyOptimizer_WF].[dbo].[MST_WorkflowUserRoles] r2 WITH (NOLOCK)      

ON [s2].stage_id = [r2].stage_id      

LEFT JOIN [dbo].[view_employee_role_info] emp_2 WITH (NOLOCK)    

ON #case_cause_id.[AssignedTo] = [emp_2].[LoginID]) Q1      

WHERE Rn = 1      

      

--SELECT * FROM #tempLastLog --checkpoint      

      

-------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@      

      

 SELECT distinct              

 #case_cause_id.[RequestID] AS [requestID], 

 #ods_cause_monitoring_value.[ods_id] AS [odsID],                                  

 #ods_cause.[case_id] AS [caseID],                                  

 [case_info].[case_name] AS [system],                                  

 [#case_cause_id].AffiliateName AS [affiliate],                                                              

 CASE WHEN #tempLastLog.[currentAssignee] IS NULL THEN '-' ELSE #tempLastLog.[currentAssignee] END AS [currentAssignee],

 #case_cause_id.[DeviationTimestamp] AS [deviationTimestamp],

 #case_cause_id.[LastOccurrence],    

 (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',#case_cause_id.[DeviationTimestamp])AS BIGINT)*1000) AS [deviationTimestampEpoch],

 (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',#case_cause_id.[LastOccurrence])AS BIGINT)*1000) AS [lastOccurencetimeEpoch],

 #case_cause_id.[status] AS [deviationStatus], 

 #ods_cause.[ods_cause_tag_id] AS [odsCauseTagID],                                  

 #ods_cause.[ods_cause_tag_name] AS [odsCauseTagName],       

 COALESCE([TRN_ODS_Suggestion].[Description], #ods_cause.[cause_message]) AS [causeMessage],                                

 #ods_cause_monitoring_value.[cause_value_actual] AS [causeValueActual],                                  

 #ods_cause_monitoring_value.[cause_value_optimum] AS [causeValueOptimum],                                  

 #ods_cause_monitoring_value.[cause_uom] AS [causeUom],                                  

 REPLACE(UPPER(#ods_effect.category),'PROCESS','PRODUCTION') AS [category],                                 

 #ods_effect.[ods_effect_tag_name] AS [effactCauseTagName],                                  

 #ods_effect.[effect_message] AS [effectMessage],                  

 COALESCE([TRN_ODS_Suggestion].[Suggestion],[Message].[message]) AS [suggestion],     

 ABS(#ods_cause_monitoring_value.[cause_value_actual]-#ods_cause_monitoring_value.[cause_value_optimum]) AS [gap],                                  

 #ods_cause_monitoring_value.[time_stamp] AS [timeStamp],                                  

 (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',#ods_cause_monitoring_value.[time_stamp])AS BIGINT)*1000) AS [timeEpoch], -- epoch in milliseconds                                  

 (#case_cause_id.[TargetDate]*1000) AS [dueDateEpoch],

 DATEADD(hh,3,CAST(DATEADD(ss,#case_cause_id.[TargetDate],'1970-01-01 00:00:00') AS DATETIME2(0))) AS [dueDate],

 #case_cause_id.[StageID] AS [stageID],   

 #tempLastLog.[StageName] AS [stageName],            

 (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',@sTime)AS BIGINT)*1000) AS [sTimeEpoch],      

 (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',@eTime)AS BIGINT)*1000) AS [eTimeEpoch],                                  

 NULL AS [actionUrl],      

 CASE WHEN #tempLastLog.lastActionTakenBy IS NULL THEN '-' ELSE #tempLastLog.lastActionTakenBy END AS [lastActionTakenBy],

 CASE WHEN #tempLastLog.comments IS NULL THEN '-' ELSE #tempLastLog.comments END AS [comments],

 #case_cause_id.CumulativeLostOpportunity AS cumulativeLostOpportunity

 FROM #ods_cause WITH (NOLOCK)                                  

 INNER JOIN #ods_effect WITH (NOLOCK)                                  

 ON #ods_cause.[case_id] = #ods_effect.[case_id]                                  

 AND #ods_cause.[ods_id] = #ods_effect.[ods_id]                                  

 INNER JOIN #ods_cause_monitoring_value WITH (NOLOCK)                                  

 ON #ods_cause.[case_id] = #ods_cause_monitoring_value.[case_id]                                  

 AND #ods_cause.[ods_id] = #ods_cause_monitoring_value.[ods_id]                                                                  

 INNER JOIN [Energy_Optimization].[dbo].[message_info] AS [Message] WITH (NOLOCK)                                  

 ON #ods_cause.[message_id] = [message].message_info_id                                  

 INNER JOIN #case_cause_id WITH (NOLOCK)                                  

 ON #ods_cause.[ods_id] = #case_cause_id.[ods_id]     

 AND #ods_cause_monitoring_value.[time_stamp] = #case_cause_id.[LastOccurrence]  

 INNER JOIN [Energy_Optimization].[dbo].[case_info] WITH (NOLOCK)

 ON #case_cause_id.[case_id] = [case_info].[case_id]

 LEFT JOIN #tempLastLog WITH (NOLOCK)       

 ON #case_cause_id.[RequestID] = #tempLastLog.[RequestID]                                

 LEFT JOIN  [dbo].[TRN_ODS_Suggestion]    WITH (NOLOCK)    

 ON #ods_cause.ods_cause_tag_id = [TRN_ODS_Suggestion].cause_id AND [TRN_ODS_Suggestion].active = 1   

 

      

END TRY                     

                

BEGIN CATCH                   

                

DECLARE @serverName VARCHAR(100) = ISNULL(@@servername,'SQL Server')        

		

		SELECT     

		ERROR_MESSAGE() AS 'Error_Message', ERROR_NUMBER() AS 'Error_Number',   

		ERROR_SEVERITY() AS 'Error_Severity'  

    

		Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'    

		INSERT INTO [dbo].[log_errors_tracker]  

		([application_name], [host_name], [error_message], [error_number], [stored_procedure],   

		[error_severity], [status_code], [created_by], [created_on])   

		SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()                       

    

END CATCH                   

                

END                                 

/*                                

EXEC [usp_ui_get_ods_data_by_case_id_list_time_range_req_id] @caseIDList = '15', @sTime='2024-09-04 09:00:00', @eTime = '2024-09-15 09:00:00'                                

EXEC [usp_ui_get_ods_data_by_case_id_list_time_range_req_id] @caseIDList = '1,2,3', @sTime='2024-10-10 08:00:00', @eTime = '2025-02-03 20:00:00';   

    

*/                                

 DROP TABLE IF EXISTS #ods_cause                                

 DROP TABLE IF EXISTS #ods_effect                                

 DROP TABLE IF EXISTS #ods_cause_monitoring                                

 DROP TABLE IF EXISTS #ods_cause_monitoring_value     

 DROP TABLE IF EXISTS #tempLastLog    

 DROP TABLE IF EXISTS #tempCaseID 

 DROP TABLE IF EXISTS #tempCaseIDModelID
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_ods_data_by_case_id_list_time_range_req_id_bk_pe
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_ods_data_by_case_id_list_time_range_req_id_bk_pe]                                

@caseIDList VARCHAR(250),                                

@sTime DATETIME2(0),                                

@eTime DATETIME2(0),
    @source VARCHAR(20) = 'db'

                               

AS                                

BEGIN                                

 SET NOCOUNT ON;                

 BEGIN TRY               

 --DECLARE @caseIDList VARCHAR(250) = '54,55,56'       

 --DECLARE @sTime DATETIME2(0) = ''                             

 --DECLARE @eTime DATETIME2(0) = ''     

 --DECLARE @sTime DATETIME2(0) = '2024-10-10 08:00:00'                             

 --DECLARE @eTime DATETIME2(0) = '2024-10-22 08:00:00'                           

                 

                 

            

  Drop table IF EXISTS #tempCaseID                                  

 CREATE TABLE #tempCaseID(CaseID INT)   

  Drop table IF EXISTS #tempCaseIDModelID                                  

 CREATE TABLE #tempCaseIDModelID(CaseID INT,model_id int)   

                                  

 INSERT INTO #tempCaseID(CaseID )                                  

 SELECT [value] FROM STRING_SPLIT(@caseIDList,',')                                  

                                  

 IF EXISTS (SELECT 1 FROM #tempCaseID WHERE [CaseID] = 71)                                  

 BEGIN                                   

  INSERT INTO #tempCaseID VALUES (102)                                  

 END       

 Insert into #tempCaseIDModelID  

 Select Case_id,model_id  

 From #tempCaseID  

 join [Energy_Optimization].[dbo].[model]  

 on #tempCaseID.Caseid=[model].Case_id  

 --Where model_type='LBM'  

       

 --SELECT * FROM #tempCaseID --checkpoint      

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                         

 /* IF @sTime and @eTime not given */                                  

                                  

 IF @sTime = '' AND @eTime = ''                                  

 BEGIN                                  

  SET @eTime = (SELECT MAX(time_stamp)                                   

  FROM [Energy_Optimization].[dbo].[Operation_Decision_Support_Output] With(NOLOCK)                                 

  JOIN [Energy_Optimization].[dbo].[model] WITH (NOLOCK)

  ON [model].model_id = [operation_decision_support_output].model_id

  WHERE case_id IN (SELECT [CaseID] FROM #tempCaseID))                                  

                                    

  SET @sTime = DATEADD(DAY,-1,@eTime)                                  

                                 

 END                                           

 /* IF @eTime is given but @sTime is not given */                                  

                                  

 IF @eTime IS NOT NULL AND @sTime = ''                                  

 BEGIN                                  

  SET @sTime = DATEADD(DAY,-1,@eTime)                                          

 END                  

               

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     

 DROP TABLE IF EXISTS #case_cause_id    

 CREATE TABLE #case_cause_id (model_id INT, operation_decision_support_id INT, cause_id INT,    

 effect_id INT,message_info_id int,active int,effect_description varchar(4000),[cause_description] varchar(4000) ,ods_cause_monitoring_tag_id INT ,Effect_monitoring_tag_id int,case_id INT)    

 INSERT INTO #case_cause_id (model_id,operation_decision_support_id,cause_id,effect_id,message_info_id,active,effect_description

 ,cause_description,ods_cause_monitoring_tag_id,Effect_monitoring_tag_id,case_id)

 SELECT distinct [operation_decision_support].[model_id],     

        [operation_decision_support].[operation_decision_support_id],    

  [operation_decision_support].[cause_id],    

  [operation_decision_support].[effect_id],    

  [cause].[message_info_id],    

  [operation_decision_support].[active],    

  [effect].[effect_description],    

  [cause].[cause_description],  

  [cause].[monitoring_tag_id],

  [effect].[monitoring_tag_id],

  model.case_id

 FROM [Energy_Optimization].[dbo].[operation_decision_support] WITH (NOLOCK)    

 INNER JOIN [Energy_Optimization].[dbo].[operation_decision_support_output] WITH (NOLOCK)     

 ON [operation_decision_support].[operation_decision_support_id] =     

 [operation_decision_support_output].[operation_decision_support_id]    

   

 --AND    

 --[operation_decision_support].[active] = 1     

 AND     

 [operation_decision_support_output].[time_stamp]  BETWEEN @sTime AND @eTime  

 AND [operation_decision_support_output].[source] = @source
    INNER JOIN [Energy_Optimization].[dbo].[cause] AS [cause]WITH(NOLOCK)    

    ON [cause].[cause_id]=[operation_decision_support].[cause_id]    

    INNER JOIN [Energy_Optimization].[dbo].[effect] AS [effect] WITH(NOLOCK)    

    ON [effect].[effect_id]=[operation_decision_support].[effect_id]

	INNER JOIN [Energy_Optimization].[dbo].Model AS model WITH(NOLOCK)    

    ON model.model_id=[operation_decision_support].model_id 

	where  model.case_id  IN (SELECT [CaseID] FROM #tempCaseID) 

 --SELECT * FROM #case_cause_id --checkpoint    

 --order by ods_cause_tag_id      

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@    

                                  

 DROP TABLE IF EXISTS #ods_cause                                  

 CREATE TABLE #ods_cause(ods_id INT,case_id INT, model_id int,ods_cause_tag_id INT, ods_cause_tag_name VARCHAR(255), cause_message VARCHAR(255),message_id INT)                                  

 INSERT INTO #ods_cause                                  

 SELECT DISTINCT    

     #case_cause_id.operation_decision_support_id,                                  

     #case_cause_id.[case_id],  

  #case_cause_id.[model_id],  

     #case_cause_id.ods_cause_monitoring_tag_id,                                  

     [Tag].tag_name AS [name_short],                                  

     cause.cause_description,                                  

     #case_cause_id.message_info_id     

 FROM #case_cause_id    

 INNER JOIN[Energy_Optimization].[dbo].[Tag] AS [Tag] WITH (NOLOCK)    

 ON #case_cause_id.ods_cause_monitoring_tag_id = [Tag].[tag_id] 

 INNER JOIN [Energy_Optimization].[dbo].cause AS cause WITH (NOLOCK)    

 ON #case_cause_id.cause_id = cause.cause_id 

                                   

 --SELECT  * FROM #ods_cause --checkpoint     

 --order by ods_cause_tag_id    

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                  

                                  

 DROP TABLE IF EXISTS #ods_effect                                  

 CREATE TABLE #ods_effect(ods_id INT,case_id INT, model_id int,ods_effect_tag_name VARCHAR(255), effect_message VARCHAR(255), category VARCHAR(50))                                  

 INSERT INTO #ods_effect                                  

 SELECT DISTINCT    

     #case_cause_id.operation_decision_support_id,                                  

     #case_cause_id.[case_id],   

  #case_cause_id.[model_id],  

   [Tag].tag_name AS [name_short],                                  

     effect.effect_description,                                  

     NULL AS[category]    

 FROM #case_cause_id    

 INNER JOIN[Energy_Optimization].[dbo].[Tag] AS [Tag] WITH (NOLOCK)    

 ON #case_cause_id.Effect_monitoring_tag_id = [Tag].[tag_id] 

 INNER JOIN [Energy_Optimization].[dbo].effect AS effect WITH (NOLOCK)    

 ON #case_cause_id.effect_id = effect.effect_id   

                                  

 --SELECT  * FROM #ods_effect  --checkpoint     

 --order by ods_id       

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                  

                                  

 DROP TABLE IF EXISTS #ods_cause_monitoring                                  

 CREATE TABLE #ods_cause_monitoring(ods_id INT,case_id INT,model_id int, ods_cause_monitoring_tag_id INT,

 uom VARCHAR(255),LastOccurrence DATETIME2(0))                  

                 

 Create nonclustered index idx_case_id_ods_id on #ods_cause_monitoring(ods_id,case_id)             

                

 INSERT INTO #ods_cause_monitoring                                  

 SELECT DISTINCT    

 #case_cause_id.operation_decision_support_id AS ods_id,                                  

 #case_cause_id.[case_id],    

 #case_cause_id.[model_id],  

 #case_cause_id.[ods_cause_monitoring_tag_id],                                  

 unit_of_measurement.uom_name AS uom,          

 --#case_cause_id AS [LastOccurrence].

 NULL AS [LastOccurrence]

 FROM #case_cause_id    

 INNER JOIN[Energy_Optimization].[dbo].[Tag] AS [Tag] WITH (NOLOCK)    

 ON #case_cause_id.[ods_cause_monitoring_tag_id] = [Tag].[tag_id] 

  INNER JOIN [Energy_Optimization].[dbo].model_tag AS model_tag WITH (NOLOCK)    

 ON model_tag.[tag_id] = [Tag].[tag_id] 

    INNER JOIN [Energy_Optimization].[dbo].[unit_of_measurement] AS unit_of_measurement WITH (NOLOCK)    

 ON model_tag.uom_id = unit_of_measurement.uom_id                                

--SELECT * from #ods_cause_monitoring --checkpoint     

--order by ods_id    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                                  

                

                

 DROP TABLE IF EXISTS #ods_cause_monitoring_value                                  

 CREATE TABLE #ods_cause_monitoring_value(ods_id INT,case_id INT, time_stamp DATETIME, cause_value_actual FLOAT, cause_value_optimum FLOAT, cause_uom VARCHAR(100))                                  

                         

 INSERT INTO #ods_cause_monitoring_value                                 

 SELECT  Distinct 

 #ods_cause_monitoring.[ods_id],                                  

 #ods_cause_monitoring.[case_id],                                  

--#ods_cause_monitoring.[LastOccurrence],

 [LBM_Output].time_stamp,

 [LBM_Output].[actual],                                  

 [LBM_Output].[optimum],                                 

 #ods_cause_monitoring.[uom]                                  

 From #ods_cause_monitoring WITH (NOLOCK)    

 INNER JOIN [Energy_Optimization].[dbo].[model_output] AS [LBM_Output] WITH (NOLOCK)                                  

 ON #ods_cause_monitoring.[ods_cause_monitoring_tag_id] = [LBM_Output].tag_id    

    --AND     

   -- #ods_cause_monitoring.[LastOccurrence] = [LBM_Output].[time_stamp]    

 AND #ods_cause_monitoring.model_id=[LBM_Output].model_id

 AND [LBM_Output].[source] = @source
 JOIN [Energy_Optimization].[dbo].model_tag WITH (NOLOCK) 

 ON model_tag.tag_id=[LBM_Output].[tag_id]  

 INNER JOIN [Energy_Optimization].[dbo].[operation_decision_support_output] WITH (NOLOCK)     

 ON model_tag.model_id =[operation_decision_support_output].model_id    

    and  [LBM_Output].time_stamp=[operation_decision_support_output].time_stamp

 AND     

 [operation_decision_support_output].[time_stamp]  BETWEEN @sTime AND @eTime  

                        

--Select * From #ods_cause_monitoring_value     

--order by ods_id    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     

    

-- Getting PM and system Admin ID and role.    

    

    AND [operation_decision_support_output].[source] = @source
 DECLARE @affiliateId INT = (SELECT top 1 affiliate_id     

                         FROM #tempCaseID     

       INNER JOIN [Energy_Optimization].[dbo].[case_info] WITH (NOLOCK)    

       ON #tempCaseID.[CaseID] = [case_info].[case_id])    

    

 DECLARE @tempName VARCHAR(100) = (SELECT TOP 1 employee_name + ' (' + 'Process Manager' + ')'    

                                  FROM 

								  --[workflow].adm_peods_user_rolemapping WITH (NOLOCK)    

          --INNER JOIN  

		  [dbo].[view_employee_role_info] WITH (NOLOCK)    

          --ON adm_peods_user_rolemapping.Employee_id = [view_employee_role_info].[LoginID]    

              where     

           [view_employee_role_info].affiliate_id = @affiliateId )   

           --AND    

           --adm_peods_user_rolemapping.role_id = 1    

           --AND     

           --adm_peods_user_rolemapping.active = 1)    

    

 --SELECT @affiliateId AS plantID, @tempName AS PM  --checkpoint    

    

 IF @tempName IS NULL    

 BEGIN    

 SET @tempName = (SELECT TOP 1 [employee_name] + ' (' + 'System Administrator' + ')'     

                   --[workflow].mst_configurations WITH (NOLOCK)    

      FROM  [dbo].[view_employee_role_info] WITH (NOLOCK)   ) 

      --ON [MST_Configurations].configuration_value = [view_employee_role_info].[LoginID]    

        --  AND     

      --[configuration_name] = 'System Administrator' AND mst_configurations.active = 1)    

 END    

    

 --SELECT @tempName AS Sysadmin --checkpoint    

    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     

      

--DROP TABLE IF EXISTS #tempLastLog      

      

--SELECT NULL AS [RequestID],      

--       [lastActionTakenBy],      

--       [comments],    

--    [currentAssignee],   

--    [stage_name] AS [StageName]    

--INTO #tempLastLog      

--FROM       

--(      

--SELECT --#case_cause_id.[RequestID],      

--       CASE WHEN [emp_1].[employee_name] IS NULL AND [s1].stage_id = 0 THEN 'Generated By System'     

--         WHEN [emp_1].[employee_name] IS NULL AND [s1].stage_id != 0 THEN '-'     

--            ELSE [emp_1].[employee_name] + ' (' + [r1].[Role] + ')'      

--       END AS lastActionTakenBy,      

--    CASE WHEN [emp_1].[employee_name] IS NULL THEN '-'       

--         ELSE [Comments]      

--    END AS [comments],      

--    CASE WHEN [emp_2].[employee_name] IS NULL THEN @tempName      

--         ELSE [emp_2].[employee_name] + ' (' + [r2].[Role] + ')'      

--    END AS [currentAssignee],    

--    [s2].[stage_name],    

--    ROW_NUMBER() OVER(PARTITION BY #case_cause_id.[RequestID] ORDER BY [LOG_PEODS_ActionLog].[created_on] DESC) AS Rn      

--FROM #case_cause_id WITH (NOLOCK)      

--INNER JOIN workflow.log_peods_actionlog AS [LOG_PEODS_ActionLog] WITH (NOLOCK)      

--ON #case_cause_id.[RequestID] = [LOG_PEODS_ActionLog].request_id      

--   AND     

--   [LOG_PEODS_ActionLog].active = 1       

--INNER JOIN workflow.[MST_PEODS_Stages] s1 WITH (NOLOCK)      

--ON [LOG_PEODS_ActionLog].stage_id = [s1].stage_id      

--LEFT JOIN workflow.[MST_PEODS_Roles] r1 WITH (NOLOCK)      

--ON [s1].stage_id = [r1].stage_id      

--LEFT JOIN  [dbo].[view_employee_role_info] emp_1 WITH (NOLOCK)    

--ON [LOG_PEODS_ActionLog].created_by = [emp_1].[LoginID]    

    

--INNER JOIN workflow.[MST_PEODS_Stages] s2 WITH (NOLOCK)      

--ON #case_cause_id.[StageID] = [s2].stage_id      

--INNER JOIN workflow.[MST_PEODS_Roles] r2 WITH (NOLOCK)      

--ON [s2].stage_id = [r2].stage_id      

--LEFT JOIN [dbo].[view_employee_role_info] emp_2 WITH (NOLOCK)    

--ON #case_cause_id.[AssignedTo] = [emp_2].[LoginID]) Q1      

--WHERE Rn = 1      

      

--SELECT * FROM #tempLastLog --checkpoint      

      

-------@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@      

      

 SELECT    distinct              

 --#case_cause_id.[RequestID] AS [requestID], 

 NULL AS requestID,

 #ods_cause_monitoring_value.[ods_id] AS [odsID],                                  

 [case].[case_id] AS [caseID],                                  

 [case].[system_name] AS [system],                                  

 [case].affiliate_name AS [affiliate],                                                              

-- CASE WHEN #tempLastLog.[currentAssignee] IS NULL THEN '-' ELSE #tempLastLog.[currentAssignee] END AS [currentAssignee], 

 null AS [currentAssignee], 

 --#case_cause_id.[DeviationTimestamp] AS [deviationTimestamp],

 NULL AS deviationTimestamp,

 --#case_cause_id.[LastOccurrence]

 NULL AS [lastOccurencetime],      

--(CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',#case_cause_id.[DeviationTimestamp])AS INT)*1000) AS [deviationTimestampEpoch],

NULL AS [deviationTimestampEpoch],

--(CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',#case_cause_id.[LastOccurrence])AS INT)*1000) AS [lastOccurencetimeEpoch],

NULL AS [lastOccurencetimeEpoch],

 --#case_cause_id.[Status] AS [deviationStatus],

-null AS [deviationStatus], 

 #ods_cause.ods_cause_tag_id AS [odsCauseTagID],                                  

 #ods_cause.[ods_cause_tag_name] AS [odsCauseTagName],       

 COALESCE([TRN_ODS_Suggestion].[Description], #ods_cause.[cause_message]) AS [causeMessage],                                

 #ods_cause_monitoring_value.[cause_value_actual] AS [causeValueActual],                                  

 #ods_cause_monitoring_value.[cause_value_optimum] AS [causeValueOptimum],                                  

 #ods_cause_monitoring_value.[cause_uom] AS [causeUom],                                  

 REPLACE(UPPER(#ods_effect.category),'PROCESS','PRODUCTION') AS [category],                                 

 #ods_effect.[ods_effect_tag_name] AS [effactCauseTagName],                                  

 #ods_effect.[effect_message] AS [effectMessage],                  

 COALESCE([TRN_ODS_Suggestion].[Suggestion],[Message].[message]) AS [suggestion],     

 ABS(#ods_cause_monitoring_value.[cause_value_actual]-#ods_cause_monitoring_value.[cause_value_optimum]) AS [gap],                                  

 #ods_cause_monitoring_value.[time_stamp] AS [timeStamp],                                  

 (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',#ods_cause_monitoring_value.[time_stamp])AS BIGINT)*1000) AS [timeEpoch], -- epoch in milliseconds                                  

 --(trn_peods.[target_date]*1000) AS [dueDateEpoch],

 NULL AS [dueDateEpoch], 

 --DATEADD(hh,3,CAST(DATEADD(ss,trn_peods.[target_date],'1970-01-01 00:00:00') AS DATETIME2(0))) AS [dueDate],

 NULL AS [dueDate],

 --trn_peods.[stage_id],  

 NULL AS [stage_id],  

NULL AS [stageName],            

 (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',@sTime)AS BIGINT)*1000) AS [sTimeEpoch],      

 (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',@eTime)AS BIGINT)*1000) AS [eTimeEpoch],                                  

 NULL AS [actionUrl],      

 --CASE WHEN #tempLastLog.lastActionTakenBy IS NULL THEN '-' ELSE #tempLastLog.lastActionTakenBy END

 NULL AS [lastActionTakenBy],      

 --CASE WHEN #tempLastLog.comments IS NULL THEN '-' ELSE #tempLastLog.comments END 

 NULL AS [comments]     

,[TRN_EOODS].cumulative_lost_opportunity AS cumulativeLostOpportunity

  FROM #ods_cause WITH (NOLOCK)                                  

 LEFT JOIN #ods_effect WITH (NOLOCK)                                  

 ON #ods_cause.[case_id] = #ods_effect.[case_id]                                  

 AND #ods_cause.[ods_id] = #ods_effect.[ods_id]                                  

 INNER JOIN #ods_cause_monitoring_value WITH (NOLOCK)                                  

 ON #ods_cause.[case_id] = #ods_cause_monitoring_value.[case_id]                                  

 AND #ods_cause.[ods_id] = #ods_cause_monitoring_value.[ods_id]                                  

 INNER JOIN [dbo].[view_landing_case_data] AS [case] WITH (NOLOCK)                                  

 ON #ods_cause.[case_id] = [case].[case_id]                                  

 INNER JOIN [Energy_Optimization].[dbo].[message_info] AS [Message] WITH (NOLOCK)                                  

 ON #ods_cause.[message_id] = [message].message_info_id                                  

 INNER JOIN #case_cause_id WITH (NOLOCK)                                  

 ON #ods_cause.[ods_id] = #case_cause_id.operation_decision_support_id     

 --AND #ods_cause_monitoring_value.[time_stamp] = #case_cause_id.[LastOccurrence]    

 --LEFT JOIN select * from  #tempLastLog WITH (NOLOCK)       

 --ON #case_cause_id.[RequestID] = #tempLastLog.id                                

 LEFT JOIN  [dbo].[TRN_ODS_Suggestion]    WITH (NOLOCK)    

 ON #ods_cause.ods_cause_tag_id = [TRN_ODS_Suggestion].cause_id AND [TRN_ODS_Suggestion].active = 1  

 LEFT JOIN [SABIC_DT_MFG_EnergyOptimizer_WF].dbo.trn_eoods WITH (NOLOCK) 

 ON trn_eoods.cause_id=#case_cause_id.cause_id   

        

     --select * from dbo.trn_eoods 

      

     

END TRY                     

                

BEGIN CATCH                   

                

DECLARE @serverName VARCHAR(100) = ISNULL(@@servername,'SQL Server')        

		

		SELECT     

		ERROR_MESSAGE() AS 'Error_Message', ERROR_NUMBER() AS 'Error_Number',   

		ERROR_SEVERITY() AS 'Error_Severity'  

    

		Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'    

		INSERT INTO [dbo].[log_errors_tracker]  

		([application_name], [host_name], [error_message], [error_number], [stored_procedure],   

		[error_severity], [status_code], [created_by], [created_on])   

		SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()                       

    

END CATCH                   

                

END                                 

/*                                

EXEC [usp_ui_get_ods_data_by_case_id_list_time_range_req_id] @caseIDList = '15', @sTime='2024-09-04 09:00:00', @eTime = '2024-09-15 09:00:00'                                

EXEC [usp_ui_get_ods_data_by_case_id_list_time_range_req_id] @caseIDList = '1,2,3', @sTime='2024-10-10 08:00:00', @eTime = '2025-02-03 20:00:00';   

    

*/                                

 DROP TABLE IF EXISTS #ods_cause                                

 DROP TABLE IF EXISTS #ods_effect                                

 DROP TABLE IF EXISTS #ods_cause_monitoring                                

 DROP TABLE IF EXISTS #ods_cause_monitoring_value     

 DROP TABLE IF EXISTS #tempLastLog    

 DROP TABLE IF EXISTS #tempCaseID
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_ods_trend_data_by_request_id
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_ods_trend_data_by_request_id]                                  

@RequestID int=NULL,                                  

@sTime DATETIME2(0),                                  

@eTime DATETIME2(0),
    @source VARCHAR(20) = 'db'

                                 

AS                                  

BEGIN                                  

 SET NOCOUNT ON;      

  

  /* IF @sTime and @eTime not given */                                  

                                  

 IF @sTime = '' AND @eTime = ''                                  

 BEGIN                                  

  SET @eTime = (SELECT MAX(time_stamp)                                   

  FROM [Energy_Optimization].[dbo].[Operation_Decision_Support_Output] With(NOLOCK) )                                                           

                                    

  SET @sTime = DATEADD(DAY,-1,@eTime)                                  

                                 

 END                                           

 /* IF @eTime is given but @sTime is not given */                                  

                                  

 IF @eTime IS NOT NULL AND @sTime = ''                                  

 BEGIN                                  

  SET @sTime = DATEADD(DAY,-1,@eTime)                                          

 END                  

 -- Select * from #temp                

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@       

  

--declare   

--@RequestID int=805,  

--@sTime  DATETIME2(0)='2024-08-09 00:00:00',        

--@eTime   DATETIME2(0)= '2024-09-11 00:00:00'   

Begin try  

  



 SELECT     distinct                       

 [actual] AS causeValueActual,                                  

 [optimum] AS causeValueOptimum,                                  

 ABS([actual]-[optimum]) AS gap,                                  

 [LBM_Output].[time_stamp] AS [timeStamp],                                  

 (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',[LBM_Output].[time_stamp])AS BIGINT)*1000) AS [timeEpoch] -- epoch in milliseconds                                                                                                               

 FROM [Energy_Optimization].dbo.operation_decision_support AS [Operation_Decision_Support] WITH (NOLOCK)                                  

 INNER JOIN [Energy_Optimization].[dbo].cause AS cause WITH (NOLOCK)                                  

 ON [Operation_Decision_Support].cause_id  = cause.cause_id

  INNER JOIN [Energy_Optimization].[dbo].[Operation_Decision_Support_Output] AS [Operation_Decision_Support_Output] WITH (NOLOCK)                                  

 --ON [Operation_Decision_Support].case_id = [Operation_Decision_Support_Output].case_id 

 ON [Operation_Decision_Support].operation_decision_support_id = [Operation_Decision_Support_Output].operation_decision_support_id  

 

 INNER JOIN [Energy_Optimization].[dbo].Model WITH (NOLOCK)                

 on [Operation_Decision_Support_Output].model_id=model.model_id and model.active=1--  and model.model_type='LBM'    

 



 LEFT JOIN [Energy_Optimization].[dbo].[model_output] AS [LBM_Output] WITH (NOLOCK)                                  

 ON [model].model_id=[LBM_Output].model_id                

-- And [Tag].[tag_id] = [LBM_Output].[tag_id]                    

 AND [Operation_Decision_Support_Output].[time_stamp] = [LBM_Output].[time_stamp] 

 

 --INNER JOIN .[dbo].trn_peods WITH (NOLOCK)                                  

 --ON [Operation_Decision_Support].cause_id = trn_peods.cause_id  --and trn_peods.active=1



 AND [LBM_Output].[source] = @source
 Where [Operation_Decision_Support_Output].[time_stamp] between @sTime and @eTime   

 --and [TRN_PEODS].request_id=@RequestID    --and [Operation_Decision_Support].active=1 

    --and [Operation_Decision_Support].active=1 

  

END TRY                       

                  





 BEGIN CATCH  

  

  Declare @serverName varchar(100)=@@servername  

  

  Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'  

  INSERT INTO [dbo].[log_errors_tracker]

       ([application_name], [host_name], [error_message], [error_number], [stored_procedure], 

	   [error_severity], [status_code], [created_by], [created_on]) 

  SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()  

  

 END CATCH                     

                  

END
GO

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_all_tags_data_by_case_id
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_all_tags_data_by_case_id]              

 @caseID INT=NULL,@time datetime=NULL,
    @source VARCHAR(20) = 'db'

              

AS              

BEGIN              

 -- SET NOCOUNT ON added to prevent extra result sets from              

 SET NOCOUNT ON;              

      

Begin Try           

          

 SELECT   time_stamp as timeStamp,                  

 tag.tag_id as tagId,            

 LOWER([tag_name]) AS [tagName],              

 [ui_display_name] as uiDisplayName,           

 [uom].[uom_name] as uom,        

 [Energy_Optimization].[dbo].[model].[model_id] as modelId,      

 actual,      

 optimum,      

 design,      

 NULL as [state]      

 FROM              

 [Energy_Optimization].[dbo].[case_info] WITH (NOLOCK)         

 left join [Energy_Optimization].[dbo].[model]   WITH (NOLOCK)      

 on [Model].[case_id]=[case_info].[case_id]        

 left join [Energy_Optimization].[dbo].model_tag  WITH (NOLOCK)       

 on [Model_tag].[model_id]=[model].[model_id]        

 Left join[Energy_Optimization].[dbo].[Tag] WITH (NOLOCK)       

 on [tag].tag_id=model_tag.tag_id         

 Left join [Energy_Optimization].[dbo].[unit_of_measurement] AS[uom] WITH (NOLOCK)       

 on [Model_tag].uom_id=uom.uom_id      

 Left join [Energy_Optimization].[dbo].[model_output] WITH (NOLOCK)       

 on [model_output].tag_id=tag.tag_id       

 and [model_output].model_id=[model_tag].[model_id]      

 AND [model_output].[source] = @source
 Where  [case_info].[active] = 1              

 And [case_info].[case_id] =@caseID            

 And [time_stamp]=@time  OR [time_stamp] IS NULL   

     

End Try               

Begin Catch              

DECLARE @server_name VARCHAR(100) = @@SERVERNAME -- Checkpoint  

        INSERT INTO [dbo].[log_errors_tracker]  

       ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity], [status_code], [created_by], [created_on])  

        SELECT 'Energy_Optimization_SQL Server', @server_name, Error_Message(), Error_Number(), Error_Procedure(), Error_Severity(), Error_State(), 1, GETDATE();  

           

End Catch              

                   

End              

              

/*               

            

EXEC [dbo].[usp_ui_eo_get_all_tags_data_by_case_id] @caseID = 1 , @time = '2024-12-01T00:00:00'              

            

*/
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_casewise_download_data
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_casewise_download_data]  

@tagIdList Varchar(1200),  

@caseId Int,  

@sTime datetime,  

@eTime datetime,
    @source VARCHAR(20) = 'db'

as

BEGIN

SET NOCOUNT ON;  



DROP TABLE IF EXISTS #TagList;  

CREATE TABLE #TagList (  

    tag_id INT  

);  



INSERT INTO #TagList (tag_id)  

SELECT CAST([value] AS INT)  

FROM STRING_SPLIT(@tagIdList, ',');  -- Split the string by commas 



--SELECT * FROM #TagList --checkpoint

BEGIN TRY 

	select distinct 

	[AFFILIATE].name  as affiliateName

	--,[PLANT].name as plantName

	,[case].case_name as systemName,

	[mst_monitoring].[tag_name_1] as tagName

	,t.tag_id as tagId,

	L.time_stamp as timeStamp

	,[model].model_id as modelId,

	t.pi_name as piName,

	--CASE           

	--   WHEN [MST_Display_Info].[display_uom] IS  NULL AND uom.uom_name IS NULL THEN '-'          

	--   WHEN [MST_Display_Info].[display_uom] IS  NULL AND uom.uom_name IS NOT NULL THEN uom.uom_name          

	--   ELSE [MST_Display_Info].[display_uom]          

	--END as uom,

	--t.[uom] AS [uom],

	unit_of_measurement.uom_name AS uom,

	L.actual as [actual],

	L.optimum as [optimum]

FROM[Energy_Optimization].[dbo].[Tag] t with(NOLOCK)

JOIN #TagList tl with(NOLOCK) ON t.tag_id = tl.tag_id 

JOIN  [dbo].[mst_monitoring] With(NOLOCK) ON [mst_monitoring].tag_name_1=t.tag_name  

--JOIN [dbo].[MST_Display_Info] AS [MST_Display_Info]With(NOLOCK)ON [mst_monitoring].[tag_name_1]=[MST_Display_Info].tag_name and [mst_monitoring].case_id=[MST_Display_Info].case_id

JOIN [Energy_Optimization].[dbo].model_tag [model_tag] With(NOLOCK) ON model_tag.tag_id=tl.tag_id 

JOIN [Energy_Optimization].[dbo].[unit_of_measurement] With(NOLOCK) ON model_tag.uom_id=unit_of_measurement.uom_id 

JOIN [Energy_Optimization].[dbo].[case_info]  AS [case]  With(NOLOCK) ON  [mst_monitoring].case_id=[case].case_id 

JOIN [Energy_Optimization].[dbo].[model] [model] With(NOLOCK) ON [model].case_id=[case].case_id and model.model_id=model_tag.model_id

JOIN #TagList TagNames With(NOLOCK) On t.[tag_id]=TagNames.tag_id 

JOIN [Energy_Optimization].[dbo].[model_output] as L With(NOLOCK) ON L.tag_id =Tagnames.tag_id 

--JOIN [PLANT] [PLANT] With(NOLOCK) ON [PLANT].[plant_id]=[case_info].[plant_id]  

    AND [L].[source] = @source
JOIN [AFFILIATE] With(NOLOCK) ON [AFFILIATE].[affiliate_id]=[case].[affiliate_id]

where [case].case_id=@caseId  and L.time_stamp between @sTime and @eTime

--order by Tag.tag_id



DROP TABLE IF EXISTS #TagList; 



END TRY   

  

 BEGIN CATCH  

  

    Declare @serverName varchar(100)=@@servername  

  

 Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'  

 INSERT INTO [dbo].[log_errors_tracker]

       ([application_name], [host_name], [error_message], [error_number], [stored_procedure], 

	   [error_severity], [status_code], [created_by], [created_on]) 

	SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()  

  

 END CATCH  

end
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_ods_alert_statistics_download_data
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_ods_alert_statistics_download_data]          

 @CaseIDList VARCHAR(400),

 @fromDate DateTime,
    @source VARCHAR(20) = 'db'

AS          

BEGIN          

 SET NOCOUNT ON;          

         

        

 BEGIN TRY       

     

 --DECLARE @caseIDList VARCHAR(400) = '1,2,3'  --checkpoint     

    

 Drop table IF EXISTS #temp                                  

 Create table #temp(caseid Int)                                  

                                  

 Insert into #temp(caseid)                                  

 SELECT [value] FROM STRING_SPLIT(@caseIDList,',')                                  

                                  

 IF EXISTS (Select 1 from #temp Where caseID=71)                                  

 Begin                                   

  Insert into #temp Values (102)                                  

 End    

    

 --SELECT * FROM #temp    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     

 DROP TABLE IF EXISTS #case_cause_id    

 CREATE TABLE #case_cause_id (case_id INT, ods_cause_Tag_id INT, ods_cause_monitoring_tag_id INT, LastOccurrence DATETIME2(0), RequestID INT,    

                               AssignedTo VARCHAR(50), DeviationTimestamp DATETIME2(0),

							   TargetDate BIGINT, StageID INT, [Status] VARCHAR(50), [message_id] BIGINT,cumulativeLostOpportunity INT)    

 INSERT INTO #case_cause_id    

 SELECT DISTINCT     

 [TRN_PEODS].[case_id],        

 cause.cause_id,    

 cause.monitoring_tag_id,    

 last_occurrence,    

 request_id,    

 assigned_to,    

 deviation_timestamp,    

 Case when target_date=0 Then NULL ELSE target_date End as [TargetDate],    

 stage_id,    

 [Status],    

 cause.message_info_id,

 [TRN_PEODS].cumulative_lost_opportunity AS cumulativeLostOpportunity

 FROM SABIC_DT_MFG_EnergyOptimizer_WF.dbo.trn_eoods as [TRN_PEODS] WITH(NOLOCK)    

 --INNER JOIN [Energy_Optimization].dbo.operation_decision_support AS [Operation_Decision_Support] WITH (NOLOCK)     

 --ON [TRN_PEODS].cause_id = [Operation_Decision_Support].cause_id  

 --join [Energy_Optimization].[dbo].operation_decision_support_output  WITH(NOLOCK)

 --ON operation_decision_support_output.operation_decision_support_id=[Operation_Decision_Support].operation_decision_support_id

 --join [Energy_Optimization].dbo.Model  WITH(NOLOCK)

 --ON model.model_id=operation_decision_support_output.model_id

 join [Energy_Optimization].dbo.cause

 ON [TRN_PEODS].cause_id=cause.cause_id

 AND     

 [TRN_PEODS].[case_id] IN (SELECT caseId FROM #temp)

 where      [TRN_PEODS].last_occurrence Between  @fromDate AND getdate()

 --AND [Operation_Decision_Support].[active] = 1 and trn_peods.active=1  --changed

    

    

 --SELECT * FROM #case_cause_id --checkpoint    

 --order by ods_cause_Tag_id    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@    

            

 DROP TABLE IF EXISTS #ods_cause          

 CREATE TABLE #ods_cause(case_id INT, ods_cause_tag_id INT, ods_cause_tag_name VARCHAR(255), cause_message VARCHAR(255),message_id BigInt)          

     

 INSERT INTO #ods_cause          

 SELECT           

 #case_cause_id.[case_id],          

 [#case_cause_id].[ods_cause_tag_id],          

 cause.cause_name,          

 cause.cause_description,          

 #case_cause_id.[message_id]     

 FROM #case_cause_id     

 INNER JOIN  [Energy_Optimization].dbo.cause AS cause WITH (NOLOCK)    

 ON #case_cause_id.[ods_cause_tag_id] = cause.cause_id    

    

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@          

 --Effect         

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@          

          

 DROP TABLE IF EXISTS #ods_cause_monitoring          

 CREATE TABLE #ods_cause_monitoring(case_id INT, ods_cause_tag_id INT, ods_cause_monitoring_tag_id INT, uom VARCHAR(255), LastOccurrence DATETIME2(0))          

     

 INSERT INTO #ods_cause_monitoring          

 SELECT          

 #case_cause_id.[case_id],    

 #case_cause_id.[ods_cause_tag_id],    

 #case_cause_id.[ods_cause_monitoring_tag_id],          

 --[Tag].[uom], 

 NULL AS uom,

 #case_cause_id.[LastOccurrence]    

 FROM #case_cause_id     

 INNER JOIN [Energy_Optimization].dbo.cause AS cause WITH (NOLOCK)    

 ON #case_cause_id.ods_cause_Tag_id = cause.cause_id    

     

 --@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@          

            

 DROP TABLE IF EXISTS #ods_cause_monitoring_value          

 CREATE TABLE #ods_cause_monitoring_value(case_id INT,ods_cause_tag_id INT , time_stamp DATETIME2(0), cause_value_actual FLOAT, cause_value_optimum FLOAT, cause_uom VARCHAR(100))          

 INSERT INTO #ods_cause_monitoring_value          

 SELECT           

 #ods_cause_monitoring.[case_id],    

 #ods_cause_monitoring.[ods_cause_tag_id],    

 #ods_cause_monitoring.[LastOccurrence],         

 [LBM_Output].[actual],          

 [LBM_Output].[optimum],          

 #ods_cause_monitoring.[uom]          

 FROM #ods_cause_monitoring WITH (NOLOCK)        

 LEFT JOIN [Energy_Optimization].[dbo].[model_output] AS [LBM_Output] WITH (NOLOCK)          

 ON #ods_cause_monitoring.[ods_cause_monitoring_tag_id] = [LBM_Output].[tag_id]          

 AND    

 #ods_cause_monitoring.[LastOccurrence] = [LBM_Output].[time_stamp]    

           

 --SELECT * from #ods_cause_monitoring_value --checkpoint         

 --ORDER BY ods_cause_tag_id       

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@          

---Effect          

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@          

     

 AND [LBM_Output].[source] = @source
DROP TABLE IF EXISTS #tempLastLog      

      

SELECT RequestID,      

       [lastActionTakenBy],      

       [comment],    

    [currentAssignee]    

INTO #tempLastLog      

FROM       

(      

SELECT #case_cause_id.[RequestID],      

       CASE WHEN [emp_1].employee_name IS NULL THEN 'Generated By System'      

       ELSE [emp_1].employee_name       

       END AS [lastActionTakenBy],      

       CASE WHEN [emp_1].employee_name IS NULL THEN '-'       

       ELSE [Comments]      

       END AS [comment],    

       CASE WHEN [emp_2].employee_name IS NULL THEN '-'      

       ELSE [emp_2].employee_name      

       END AS [currentAssignee],        

       ROW_NUMBER() OVER(PARTITION BY #case_cause_id.[RequestID] ORDER BY [LOG_PEODS_ActionLog].created_on DESC) AS Rn      

FROM #case_cause_id WITH (NOLOCK)      

INNER JOIN SABIC_DT_MFG_EnergyOptimizer_WF.dbo.log_eoods_action_log AS [LOG_PEODS_ActionLog] WITH (NOLOCK)      

ON #case_cause_id.[RequestID] = [LOG_PEODS_ActionLog].request_id      

   AND     

   [LOG_PEODS_ActionLog].active = 1        

LEFT JOIN [dbo].[view_employee_role_info] emp_1 WITH (NOLOCK)      

ON [LOG_PEODS_ActionLog].created_by = [emp_1].[LoginID]     

LEFT JOIN [dbo].[view_employee_role_info] emp_2 WITH (NOLOCK)    

ON #case_cause_id.[AssignedTo] = [emp_2].[LoginID]     

) Q1      

WHERE Rn = 1     

    

--SELECT * FROM #tempLastLog --checkpoint    

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     

     

 SELECT DISTINCT     

        #case_cause_id.[requestID],     

  [view_landing_case_data].[system_name] AS [systemName],               

  COALESCE([TRN_ODS_Suggestion].[Description], #ods_cause.[cause_message]) AS [causeMessage],                

  #ods_cause_monitoring_value.[cause_value_actual] AS [causeValueActual],          

  #ods_cause_monitoring_value.[cause_value_optimum] AS [causeValueOptimum],             

  COALESCE([TRN_ODS_Suggestion].[Suggestion],[Message].[message]) AS [suggestion],          

  ABS(#ods_cause_monitoring_value.[cause_value_actual]-#ods_cause_monitoring_value.[cause_value_optimum]) AS [gap],          

  #case_cause_id.[LastOccurrence] AS [lastOccurrence],         

  #case_cause_id.[DeviationTimestamp] AS [deviationTime],    

  #case_cause_id.[Status] AS [status],    

  DATEADD(hh,3,CAST(DATEADD(ss,#case_cause_id.[TargetDate],'1970-01-01 00:00:00') AS DATETIME2(0))) AS [dueDate],    

  #case_cause_id.[StageID] AS [stageID],    

  #tempLastLog.[currentAssignee] AS [currentAssignee],    

  #tempLastLog.[lastActionTakenBy] AS [lastActionTakenBy],    

  #tempLastLog.[comment] AS [comments],    

  #ods_cause_monitoring_value.[cause_uom] AS [causeUom] ,    

  #ods_cause.[ods_cause_tag_name] AS [odsCauseTagName],    

  #ods_cause.ods_cause_tag_id AS [odsCauseTagID],

  #case_cause_id.cumulativeLostOpportunity

FROM #ods_cause WITH (NOLOCK)           

INNER JOIN #ods_cause_monitoring_value WITH (NOLOCK)     

ON #ods_cause.[ods_cause_tag_id] = #ods_cause_monitoring_value.[ods_cause_tag_id]    

INNER JOIN [dbo].[view_landing_case_data] WITH (NOLOCK)          

ON #ods_cause.[case_id] = [view_landing_case_data].[case_id]          

INNER JOIN [Energy_Optimization].[dbo].message_info AS [Message] WITH (NOLOCK)          

ON #ods_cause.[message_id] = [message].message_info_id          

INNER JOIN #case_cause_id WITH (NOLOCK)         

ON #case_cause_id.[ods_cause_Tag_id] = #ods_cause.[ods_cause_tag_id]    

AND #case_cause_id.[LastOccurrence] = #ods_cause_monitoring_value.[time_stamp]    

LEFT JOIN #tempLastLog WITH (NOLOCK)      

ON #case_cause_id.[RequestID] = #tempLastLog.[RequestID]    

LEFT JOIN [dbo].[TRN_ODS_Suggestion]        

ON #ods_cause.[ods_cause_tag_id] = [trn_ods_suggestion].cause_id AND [trn_ods_suggestion].active = 1       

where #case_cause_id.[Status]!='New'    

Exec [dbo].[usp_ui_get_ods_alert_statistics_download_data_comments]  @CaseIDList=@CaseIDList,@fromDate=@fromDate   

END TRY         

 BEGIN CATCH  

  

  Declare @serverName varchar(100)=@@servername  

  

  Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'  

  INSERT INTO [dbo].[log_errors_tracker]

       ([application_name], [host_name], [error_message], [error_number], [stored_procedure], 

	   [error_severity], [status_code], [created_by], [created_on]) 

  SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()  

  

 END CATCH      

        

End          

/*          

          

--EXEC [usp_ui_get_ods_alert_statistics_download_data] @caseIDList = '1,2,3,151'       

          

*/          

        

 DROP TABLE IF EXISTS #ods_cause        

 DROP TABLE IF EXISTS #ods_cause_monitoring          

 DROP TABLE IF EXISTS #ods_cause_monitoring_value          

 DROP TABLE IF EXISTS #ods_effect_monitoring          

 DROP TABLE IF EXISTS #ods_effect_monitoring_value      

 DROP TABLE IF EXISTS #case_cause_id    

 DROP TABLE IF EXISTS #tempLastLog    

 DROP TABLE IF EXISTS #temp
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_seu_output_data_targetenergy
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_seu_output_data_targetenergy]      

@caseId INT =NULL, @sTime datetime=NULL, @eTime datetime=NULL,
    @source VARCHAR(20) = 'db'

--@timestamp datetime=NULL  

      

AS      

BEGIN      

    SET NOCOUNT ON;      

           

	Begin Try   



	;with CTEseutemp

as

	(select

	    [actual] as 'energyConsumed',

	[target] as 'targetEnergy',

	[baseline] as 'baselineEnergy',

	[gain] as 'seecGain',enpi as 'enpi',

	[seu_id],

	time_stamp AS timestamp

	from [Energy_Optimization].[dbo].[seu_output] With(NOLOCK)

	where case_id=@caseId

	and time_stamp BETWEEN @sTime AND @eTime )



	--select * from  CTEseutemp



	    select

	timestamp,

	plant.[name] as 'plantName',

	seu_display_name as equipment,

	targetEnergy

	FROM[Energy_Optimization].[dbo].[seu_details] With(NOLOCK)

	left join CTEseutemp With(NOLOCK)

	on CTEseutemp.seu_id=seu_details.seu_id

	join [Energy_Optimization].[dbo].[case_plant_mapping] With(NOLOCK)

	on [seu_details].case_plant_id= [case_plant_mapping].case_plant_id

	join plant With(NOLOCK) on [case_plant_mapping].plant_id=plant.plant_id

	where [case_plant_mapping].case_id=@caseId

	and [seu_details].active=1



	END TRY    

BEGIN CATCH      

		DECLARE @serverName VARCHAR(100) = ISNULL(@@servername,'SQL Server')        

		

		SELECT     

		ERROR_MESSAGE() AS 'Error_Message', ERROR_NUMBER() AS 'Error_Number',   

		ERROR_SEVERITY() AS 'Error_Severity'  

    

		Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'    

		INSERT INTO [dbo].[log_errors_tracker]  

		([application_name], [host_name], [error_message], [error_number], [stored_procedure],   

		[error_severity], [status_code], [created_by], [created_on])   

		SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()    

    

	END CATCH     

           

END 



--select top 5 * FROM [Energy_Optimization].[dbo].[seu_output] 

--

--Select top 5 * from [dbo].[seu_detail] With(NOLOCK)
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_all_vc_span_by_caseid
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_all_vc_span_by_caseid]  

@caseID int,   

@Category varchar(400),  

@stime datetime,    

@etime datetime,
    @source VARCHAR(20) = 'db'

    

As    

Begin     

   

SET NOCOUNT ON    

    

Drop table IF EXISTS #tempCalcdata    

CREATE TABLE #tempCalcdata ([vc_span_id] INT,    

       [caseId] INT,    

       [TagName] VARCHAR(255),    

       [time_Stamp] DATETIME2(0),    

       [actualObjFuntion] FLOAT,    

       [optimumObjFuntion] FLOAT,    

       [BaseObjFuntion] FLOAT,    

       [Realized_Value] FLOAT,    

       [Lost_Value] FLOAT,  

    [vc_case_info_id] Int)    

    

Drop table IF EXISTS #TotalSpansIds    

    

Create table #TotalSpansIds(id int identity(1,1),SpanId int)    

Declare @j int, @i int=1    

    

Insert into #TotalSpansIds(SpanId)    

SELECT [vc_span_id] FROM [dbo].[trn_vc_span] With(NOLOCK)    

Where case_id = @caseID and [active]=1  

    

Select @j=count(*) from #TotalSpansIds With(NOLOCK)    

--Select * from #TotalSpansIds    

  Begin Try  

While (@i<=@j)    

Begin    

    

    Drop table IF EXISTS #tempXValue  

  

    Select time_stamp,[mst_vc_case_info].vc_case_info_id,LBM_Output.actual as XTagvalue  

  Into #tempXValue  

  FROM [dbo].[trn_vc_span] AS [Span] WITH (NOLOCK)    

  INNER Join #TotalSpansIds As TotalSpansIds WITH (NOLOCK)    

  ON Span.[vc_span_id] = [TotalSpansIds].SpanId    

  Inner join [dbo].[mst_vc_case_info]     

  ON Span.case_id= [dbo].[mst_vc_case_info].case_id   

  And [mst_vc_case_info].category=@Category And [mst_vc_case_info].vc_case_info_id=[Span].vc_case_info_id   

  Inner JOIN [Energy_Optimization].[dbo].[Tag] AS[Tag] WITH (NOLOCK)    

  ON mst_vc_case_info.X_tag = [Tag].tag_name   

  Inner join [Energy_Optimization].[dbo].model_tag mt  WITH (NOLOCK)  on [Tag].tag_id=mt.tag_id    

  Inner join [Energy_Optimization].[dbo].Model m WITH (NOLOCK) on m.model_id=mt.model_id --  And m.model_type='LBM'   

  Inner JOIN [Energy_Optimization].[dbo].[model_output] AS [LBM_Output] WITH (NOLOCK)   

  ON [Tag].[tag_id] = [LBM_Output].[tag_id]   

    AND [LBM_Output].[source] = @source
  WHERE TotalSpansIds.Id=@i and M.case_id=@caseID  

  And [Span].active=1  

  AND ([LBM_Output].time_stamp BETWEEN [span].[stime] AND [span].[etime])  

  

INSERT INTO #tempCalcdata    

  SELECT    

  [Span].vc_span_id,    

  [Span].case_id,    

  [mst_vc_case_info].obj_Fn as 'TagName',    

  [LBM_Output].time_stamp as 'time_stamp',    

  ROUND(LBM_Output.actual,5) AS 'actualObjFuntion',    

  ROUND(LBM_Output.optimum,5) AS 'optimumObjFuntion',    

  [Span].base_line_objFn AS 'BaseObjFuntion',    

  ((Sign([Span].base_line_objFn-LBM_Output.actual)*(Power(ABS([Span].base_line_objFn-LBM_Output.actual),ISNUll([C],1))*(factor_Realized))*(ISNULL(XTagvalue,1)))+ISNULL([B],0)) as 'Realized_Value',  

  ((Sign([LBM_Output].optimum-LBM_Output.actual)*(Power(ABS([LBM_Output].optimum-LBM_Output.actual),ISNUll([C],1))*(factor_Lost))*(ISNULL(XTagvalue,1)))+ISNULL([B],0)) as 'Lost_Value',  

  [Span].vc_case_info_id  

  FROM [dbo].[trn_vc_span] AS [Span] WITH (NOLOCK)    

  INNER Join #TotalSpansIds As TotalSpansIds WITH (NOLOCK)    

  ON Span.[vc_span_id] = [TotalSpansIds].SpanId    

  Inner join [dbo].[mst_vc_case_info]    

  ON Span.case_id= [dbo].[mst_vc_case_info].case_id   

  And [mst_vc_case_info].vc_case_info_id=[Span].[vc_case_info_id] And [mst_vc_case_info].Category=@Category    

  Inner JOIN[Energy_Optimization].[dbo].[Tag] WITH (NOLOCK)    

  ON mst_vc_case_info.Obj_Fn = [Tag].tag_name   

  Inner join [Energy_Optimization].[dbo].model_tag mt WITH (NOLOCK)   on [Tag].tag_id=mt.tag_id    

  Inner join [Energy_Optimization].[dbo].Model m WITH (NOLOCK) on m.model_id=mt.model_id  And m.model_type='LBM'  

  Inner JOIN [Energy_Optimization].[dbo].[model_output] AS [LBM_Output] WITH (NOLOCK)     

  ON [Tag].[tag_id] = [LBM_Output].[tag_id] AND ([LBM_Output].time_stamp BETWEEN  [span].[stime] AND [span].[etime])   

    AND [LBM_Output].[source] = @source
  Left Join #tempXValue On [LBM_Output].time_stamp=#tempXValue.time_stamp  

  And [mst_vc_case_info].vc_case_info_id=#tempXValue.vc_case_info_id  

  WHERE TotalSpansIds.Id=@i and m.case_id=@caseID And [Span].active=1 And Span.Case_id=@caseID  

  

   SET @i = @i + 1    

  END    

  --Select * from #tempCalcdata  

 CREATE TABLE #tempFinaldata ([vc_span_id] INT,    

       [caseId] INT,    

    [BaseLineObjFn] VARCHAR(255),  

       [TagName] VARCHAR(255),    

       [StartTime] DATETIME2(0),  

    [EndTime] DATETIME2(0),  

       [Realized_Value] FLOAT,     

       [Lost_Value] FLOAT,   

       [VCActionID] VARCHAR(800),    

       [ActionTitle] VARCHAR(800),  

    [ActionDescription] VARCHAR(800),  

    [PotentialPeriod] VARCHAR(100),  

    [vc_case_info_id] Int)   

      

 Insert into #tempFinaldata  

    SELECT  Tc.vc_span_id,Tc.caseid,BaseObjFuntion,Tc.TagName,[trn_vc_span].stime ,[trn_vc_span].etime ,  

 CASE WHEN ISNUll([Realized_Value],0)<=0 THEN 0 ELSE Round(([Realized_Value]),5) END as 'Realized_Value',  

 CASE WHEN ISNUll([Lost_Value],0)<=0 THEN 0 ELSE Round(([Lost_Value]),5) END as 'Lost_Value',    

 mst_vc_action.vc_action_id,action_title,action_description,potentialPeriod,TC.vc_case_info_id  

    FROM #tempCalcdata Tc WITH (NOLOCK)   

 INNER Join [dbo].[trn_vc_span] With(NOLOCK)   

 On [trn_vc_span].[vc_span_id]=tc.vc_span_id and [trn_vc_span].Case_id=@caseID  

 Left Join [dbo].[trn_vc_span_action] AS [trn_vc_span_action] With(NOLOCK)    

 On [trn_vc_span].vc_span_id=[trn_vc_span_action].[VCSpanID]  and [trn_vc_span_action].active=1  

 Left Join [dbo].mst_vc_action With(NOLOCK)    

 On [trn_vc_span_action].[vc_action_id]=mst_vc_action.vc_action_id and mst_vc_action.active=1  

 Where tc.time_stamp between @stime and @etime   

  

  

 SELECT  Tc.vc_span_id as [vc_span_id],Tc.caseid as [CaseID],BaseLineObjFn as [BaseLineObjFn],@Category as [Category], Tc.TagName as [TagName],  

 tag.ui_display_name as [DisplayName],unit_of_measurement.uom_name as [DisplayUom],  

 StartTime as 'StartTime',EndTime as 'EndTime',  

 Round(SUM([Realized_Value]),5) as 'RealizedValue',  

 Round(SUM([Lost_Value]),5) as 'LostValue',Tc.vc_case_info_id as VCCaseInfoID,   

 VCActionID,ActionTitle,ActionDescription,PotentialPeriod  

    FROM #tempFinaldata Tc WITH (NOLOCK)   

 INNER Join [Energy_Optimization].[dbo].[Tag] With(NOLOCK)    

 on tag.[tag_name]=TC.[TagName] 

  INNER Join [Energy_Optimization].[dbo].model_tag With(NOLOCK)    

 on tag.tag_id=model_tag.tag_id 

   INNER Join [Energy_Optimization].[dbo].Model With(NOLOCK)    

 on model.model_id=model_tag.model_id  and model.case_id=@caseID 

  INNER Join [Energy_Optimization].[dbo].[unit_of_measurement] With(NOLOCK)    

 on unit_of_measurement.uom_id=model_tag.uom_id 

 GROUP BY Tc.vc_span_id,Tc.caseid,BaseLineObjFn,Tc.TagName,  

 tag.ui_display_name,unit_of_measurement.uom_name,  

 StartTime,[EndTime],VCActionID,ActionTitle,ActionDescription,PotentialPeriod,Tc.vc_case_info_id  

 order by  Tc.vc_span_id  

   End Try  



BEGIN CATCH                  

                          

	DECLARE @serverName VARCHAR(100) = ISNULL(@@servername,'SQL Server')        

	

    

	Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'    

	INSERT INTO [dbo].[log_errors_tracker]  

	([application_name], [host_name], [error_message], [error_number], [stored_procedure],   

	[error_severity], [status_code], [created_by], [created_on])   

	SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()    

                              

                          

 END CATCH 

       

  

/*  

  

Exec [dbo].[usp_ui_get_all_vc_span_by_caseid] @caseid=96,@category='production',@stime='2023-01-01',@etime='2024-03-08'  

  

*/  

End
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_vc_by_case_Id_list
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_vc_by_case_Id_list]      

@caseIDList Varchar(1200),      

@stime datetime,      

@etime datetime,
    @source VARCHAR(20) = 'db'

      

As      

Begin       

      

SET NOCOUNT ON      

--declare  @caseidlist varchar(100)='39,64',@stime datetime='2024-01-25',@etime datetime='2024-02-16'  

    

Drop table IF EXISTS #CaseId_List     

Drop table IF EXISTS #FinalResult     

Drop table IF EXISTS #tempCalcdata     

Drop table IF Exists #tempCalcdataFinal  

Drop table IF Exists #tempXValue  

Drop table IF EXISTS #TotalSpansIds   

  

CREATE TABLE #CaseId_List(id Int identity(1,1),caseId Int)     

  

CREATE TABLE #FinalResult(Caseid Int,CaseName Varchar(100),Category  Varchar(300),RealizedValue Float,LostValue float)    

CREATE TABLE #tempCalcdata ([caseId] INT,[Realized_value] FLOAT,[lost_value] FLOAT,[Timestamp] datetime,    

       [Category] varchar(300), [Case_name] varchar(800))    

  

Insert into #CaseId_List(caseId)      

SELECT [value] FROM STRING_SPLIT(@caseIDList,',')      

   

 --Select * from #CaseId_List  

Create table #TotalSpansIds(id int identity(1,1),SpanId int,caseId Int)    

Declare @j int=0, @i int=1    

   

Insert into #TotalSpansIds(SpanId,caseId)    

SELECT vc_span_id,case_id FROM [dbo].trn_vc_span With(NOLOCK)    

Where case_id in (Select caseId from #CaseId_List)  

And active=1  

   

--Select * from #TotalSpansIds  

  

Select @j=count(*) from #TotalSpansIds With(NOLOCK)    

--Select @j  

Begin TRY  

While (@i<=@j)    

Begin    

    Drop table IF EXISTS #tempXValue  

  

  Select time_stamp,[MST_VC_CaseInfo].vc_case_info_id,[MST_VC_CaseInfo].Category,  

  LBM_Output.actual as XTagvalue,Span.case_id  

  Into #tempXValue  

  FROM [dbo].trn_vc_span AS [Span] WITH (NOLOCK)    

  INNER Join #TotalSpansIds As TotalSpansIds WITH (NOLOCK)    

  ON Span.vc_span_id = [TotalSpansIds].SpanId    

  And [Span].case_id= [TotalSpansIds].caseId  

  Inner join [dbo].mst_vc_case_info   [MST_VC_CaseInfo]  WITH (NOLOCK)

  ON [MST_VC_CaseInfo].vc_case_info_id=[Span].vc_case_info_id    

  And Span.case_id= [MST_VC_CaseInfo].case_id   

  Inner JOIN[Energy_Optimization].[dbo].[Tag] WITH (NOLOCK)    

  ON MST_VC_CaseInfo.X_tag = [Tag].tag_name   

  Inner join [Energy_Optimization].[dbo].model_tag mt on [Tag].tag_id=mt.tag_id    

  Inner join [Energy_Optimization].[dbo].Model m on m.model_id=mt.model_id -- And m.model_type='LBM'   

  Inner JOIN [Energy_Optimization].[dbo].[model_output] AS [LBM_Output] WITH (NOLOCK)   

  ON [Tag].[tag_id] = [LBM_Output].[tag_id]   

    AND [LBM_Output].[source] = @source
  WHERE TotalSpansIds.Id=@i and M.case_id=TotalSpansIds.caseId --in (Select caseID from #TotalSpansIds)  

  And [Span].active=1  

  AND ([LBM_Output].time_stamp BETWEEN [span].[sTime] AND [span].[eTime])  

    

  --Select * from #tempXValue  

  

 INSERT INTO #tempCalcdata    

  SELECT   

  [Span].case_id,    

  ((Sign([Span].base_line_objFn-LBM_Output.actual)*(Power(ABS([Span].base_line_objFn-LBM_Output.actual),ISNUll([C],1))*(Factor_Realized))*(ISNULL(XTagvalue,1)))+ISNULL([B],0)) as 'Realized_Value',  

  ((Sign([LBM_Output].optimum-LBM_Output.actual)*(Power(ABS([LBM_Output].optimum-LBM_Output.actual),ISNUll([C],1))*(Factor_Lost))*(ISNULL(XTagvalue,1)))+ISNULL([B],0)) as 'Lost_Value',  

   [LBM_Output].Time_stamp,      

   [MST_VC_CaseInfo].[Category],      

  [Case].case_name AS name      

        FROM [dbo].trn_vc_span AS [Span] WITH (NOLOCK)    

  INNER Join #TotalSpansIds As TotalSpansIds WITH (NOLOCK)    

  ON Span.vc_span_id = [TotalSpansIds].SpanId   

  And TotalSpansIds.caseId=[Span].case_id  

  Inner join [dbo].mst_vc_case_info  as [MST_VC_CaseInfo]   WITH (NOLOCK)    

  ON Span.case_id= [MST_VC_CaseInfo].case_id   

  And [MST_VC_CaseInfo].vc_case_info_id=[Span].vc_case_info_id   

  And TotalSpansIds.caseId=[MST_VC_CaseInfo].case_id  

  Inner JOIN[Energy_Optimization].[dbo].[Tag] WITH (NOLOCK)    

  ON [MST_VC_CaseInfo].Obj_Fn = [Tag].tag_name   

  Inner join [Energy_Optimization].[dbo].model_tag mt on [Tag].tag_id=mt.tag_id    

  Inner join [Energy_Optimization].[dbo].Model m on m.model_id=mt.model_id --And m.model_type='LBM'   

  Inner JOIN [Energy_Optimization].[dbo].[model_output] AS [LBM_Output] WITH (NOLOCK)   

  ON [Tag].[tag_id] = [LBM_Output].[tag_id]   

    AND [LBM_Output].[source] = @source
  Left Join #tempXValue  

  On [LBM_Output].time_stamp=#tempXValue.time_stamp  

  And [MST_VC_CaseInfo].vc_case_info_id=#tempXValue.vc_case_info_id  

  and #tempXValue.Category=[MST_VC_CaseInfo].Category  

  INNER join [dbo].case_info  as [Case] WITH (NOLOCK)  

  on [Case].case_id=[Span].case_id   

  WHERE TotalSpansIds.Id=@i and m.case_id=TotalSpansIds.caseID  

  And [Span].active=1  

  AND ([LBM_Output].time_stamp BETWEEN [span].[sTime] AND [span].[eTime])  

    

   SET @i = @i + 1  

  

 END  

  

 --Select * from #tempCalcdata  

  

   SELECT TempData.CaseId,TempData.[Category],[Case_name],      

   CASE WHEN ISNUll([Realized_value],0)<=0 THEN 0 ELSE Round([Realized_value],5) END as 'Realized_value',      

   CASE WHEN ISNULL([lost_value],0)<=0 THEN 0 ELSE Round([lost_value],5) END as 'lost_value'      

   into #tempCalcdataFinal      

   FROM #tempCalcdata TempData       

   Where (Timestamp between @stime and @etime)      

         

  Insert Into #FinalResult(Caseid,CaseName,Category,RealizedValue,LostValue)    

   Select FinalData.caseid as [Caseid],[Case].case_name as [CaseName],[Category],      

   Round(Sum(Realized_value),2) as 'Realizedvalue',      

   Round(Sum(lost_value),2) as 'Lostvalue'      

   FROM #tempCalcdataFinal FinalData      

   join [dbo].case_info as [Case] on [Case].case_id=FinalData.caseId      

   group by FinalData.CaseId,[Case].case_name,[Category]      

         

   Union       

    

   Select [MST_VC_CaseInfo].case_id as [Caseid],[Case].case_name as [CaseName],      

   [MST_VC_CaseInfo].[Category],NULL,NULL      

   FROM #CaseId_List As TotalCaseIds WITH (NOLOCK)    

   Left join [dbo].mst_vc_case_info as [MST_VC_CaseInfo]  WITH (NOLOCK)      

   ON TotalCaseIds.caseID= [MST_VC_CaseInfo].case_id   

   Left Join [dbo].[TRN_VC_Span] AS [Span] WITH (NOLOCK)      

   ON Span.case_id = [TotalCaseIds].CaseID      

   INNER join [dbo].case_info [Case] WITH (NOLOCK)  

   on [Case].case_id=[MST_VC_CaseInfo].case_id      

      

   order by FinalData.caseid      

    

   ;With CTEFinal as (    

   Select Caseid,CaseName,Category,RealizedValue,LostValue,    

   Row_number() Over(Partition by Caseid,CaseName,Category Order by RealizedValue desc)as RNK    

   From #FinalResult    

   )    

   Select Caseid,CaseName,Category,RealizedValue,LostValue    

   From CTEFinal    

   Where Rnk=1    

    

    End Try   



BEGIN CATCH                  

                          

	DECLARE @serverName VARCHAR(100) = ISNULL(@@servername,'SQL Server')        

	

    

	Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'    

	INSERT INTO [dbo].[log_errors_tracker]  

	([application_name], [host_name], [error_message], [error_number], [stored_procedure],   

	[error_severity], [status_code], [created_by], [created_on])   

	SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()    

                              

                          

 END CATCH  

       

End         

      

/*      

      

Exec [dbo].[usp_ui_get_vc_by_case_Id_list] @caseidlist='39,79,64',@stime='2024-01-25',@etime='2024-02-16'  

  

exec [dbo].[usp_ui_get_vc_calc_timeseries] @caseid=79,@category='production',@stime='2024-01-25',@etime='2024-02-10'  

    

*/
GO

-- ---------------------------------------------------------------------------
-- usp_ui_get_vc_calc_timeseries
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_get_vc_calc_timeseries]    

@Case_id int,    

@Category varchar(40),    

@stime datetime,    

@etime datetime,
    @source VARCHAR(20) = 'db'

    

As    

Begin     

    

SET NOCOUNT ON    

    

Drop table IF EXISTS #tempCalcdata    

CREATE TABLE #tempCalcdata ([VCSpanId] INT,    

       [Case_id] INT,    

       [TagName] VARCHAR(255),    

       [time_Stamp] DATETIME2(0),    

       [actualObjFuntion] FLOAT,    

       [optimumObjFuntion] FLOAT,    

       [BaseObjFuntion] FLOAT,    

       [Realized_Value] FLOAT,    

       [Lost_Value] FLOAT)    

    

Drop table IF EXISTS #TotalSpansIds    

    

Create table #TotalSpansIds(id int identity(1,1),SpanId int)    

Declare @j int, @i int=1    

    

Insert into #TotalSpansIds(SpanId)    

SELECT vc_span_id FROM [dbo].trn_vc_span With(NOLOCK)    

Where case_id = @Case_id  

    

Select @j=count(*) from #TotalSpansIds With(NOLOCK)    

  

  Declare @TagValue Float  

  

Begin try  

While (@i<=@j)    

Begin    

    Drop table IF EXISTS #tempXValue  

  

  Select time_stamp,mst_vc_case_info.vc_case_info_id,LBM_Output.actual as XTagvalue  

  Into #tempXValue  

  FROM [dbo].trn_vc_span AS [Span] WITH (NOLOCK)    

  INNER Join #TotalSpansIds As TotalSpansIds WITH (NOLOCK)    

  ON Span.vc_span_id = [TotalSpansIds].SpanId    

  Inner join [dbo].mst_vc_case_info   WITH (NOLOCK)    

  ON Span.case_id= mst_vc_case_info.case_id   

  And mst_vc_case_info.Category=@Category And mst_vc_case_info.vc_case_info_id=[Span].vc_case_info_id   

  Inner JOIN[Energy_Optimization].[dbo].[Tag] WITH (NOLOCK)    

  ON mst_vc_case_info.X_tag = [Tag].tag_name   

  Inner join [Energy_Optimization].[dbo].model_tag mt on [Tag].tag_id=mt.tag_id    

  Inner join [Energy_Optimization].[dbo].Model m on m.model_id=mt.model_id  And m.model_type='LBM'  

  Inner JOIN [Energy_Optimization].[dbo].[model_output] AS [LBM_Output] WITH (NOLOCK)   

  ON [Tag].[tag_id] = [LBM_Output].[tag_id]   

    AND [LBM_Output].[source] = @source
  WHERE TotalSpansIds.Id=@i and M.case_id=@Case_id  

  And [Span].active=1  

  AND ([LBM_Output].time_stamp BETWEEN [span].[sTime] AND [span].[eTime])  

    

  

 INSERT INTO #tempCalcdata    

  SELECT    

  [Span].vc_span_id,    

  [Span].Case_id,    

  mst_vc_case_info.Obj_Fn as 'TagName',    

  [LBM_Output].time_stamp as 'time_stamp',    

  ROUND(LBM_Output.actual,5) AS 'actualObjFuntion',    

  ROUND(LBM_Output.optimum,5) AS 'optimumObjFuntion',    

  [Span].base_line_objFn AS 'BaseObjFuntion',   

  ((Sign([Span].base_line_objFn-LBM_Output.actual)*(Power(ABS([Span].base_line_objFn-LBM_Output.actual),ISNUll([C],1))*(Factor_Realized))*(ISNULL(XTagvalue,1)))+ISNULL([B],0)) as 'Realized_Value',  

  ((Sign([LBM_Output].optimum-LBM_Output.actual)*(Power(ABS([LBM_Output].optimum-LBM_Output.actual),ISNUll([C],1))*(Factor_Lost))*(ISNULL(XTagvalue,1)))+ISNULL([B],0)) as 'Lost_Value'  

  FROM [dbo].[TRN_VC_Span] AS [Span] WITH (NOLOCK)    

  INNER Join #TotalSpansIds As TotalSpansIds WITH (NOLOCK)    

  ON Span.vc_span_id = [TotalSpansIds].SpanId    

  Inner join [dbo].mst_vc_case_info    

  ON Span.Case_id= [dbo].mst_vc_case_info.Case_id   

  And mst_vc_case_info.category=@Category And mst_vc_case_info.vc_case_info_id=[Span].[vc_case_info_id]   

  Inner JOIN[Energy_Optimization].[dbo].[Tag] WITH (NOLOCK)    

  ON mst_vc_case_info.obj_Fn = [Tag].tag_name   

  Inner join [Energy_Optimization].[dbo].model_tag mt on [Tag].tag_id=mt.tag_id    

  Inner join [Energy_Optimization].[dbo].Model m on m.model_id=mt.model_id --And m.model_type='LBM'  

  Inner JOIN [Energy_Optimization].[dbo].[model_output] AS [LBM_Output] WITH (NOLOCK)   

  ON [Tag].[tag_id] = [LBM_Output].[tag_id]   

    AND [LBM_Output].[source] = @source
  Left Join #tempXValue  

  On [LBM_Output].time_stamp=#tempXValue.time_stamp  

  And mst_vc_case_info.vc_case_info_id=#tempXValue.vc_case_info_id  

  WHERE TotalSpansIds.Id=@i and m.case_id=@Case_id  

  And [Span].active=1  

  AND ([LBM_Output].time_stamp BETWEEN [span].[sTime] AND [span].[eTime])  

    

   SET @i = @i + 1  

 END  

  

  

  SELECT  VCSpanID as [VCSpanID],Case_id as [Case_id],TagName,time_stamp AS [StartTime],Dateadd(hour,1,time_stamp) AS [EndTime],  

  (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',time_stamp)AS BIGINT)*1000) AS [StartTimeEpoch],  

  (CAST(DATEDIFF(s,'1970-01-01 00:00:00-03:00',Dateadd(hour,1,time_stamp)) AS BIGINT)*1000) AS [EndTimeEpoch],  

  CASE WHEN [Realized_Value]<0 THEN 0 ELSE Round([Realized_Value],5) END as 'RealizedValue',  

  CASE WHEN [Lost_Value]<0 THEN 0 ELSE Round([Lost_Value],5) END as 'LostValue'    

  FROM #tempCalcdata WITH (NOLOCK)  

  Where time_stamp between @stime and @etime  

  order by time_stamp  

      

  End Try   

    



BEGIN CATCH                  

                          

	DECLARE @serverName VARCHAR(100) = ISNULL(@@servername,'SQL Server')        

	

    

	Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'    

	INSERT INTO [dbo].[log_errors_tracker]  

	([application_name], [host_name], [error_message], [error_number], [stored_procedure],   

	[error_severity], [status_code], [created_by], [created_on])   

	SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()    

                              

                          

 END CATCH 

       

End    

    

/*    

exec [dbo].[usp_ui_get_vc_calc_timeseries] @Case_id=79,@category='production',@stime='2024-01-25',@etime='2024-02-10'  

    

*/
GO

-- ---------------------------------------------------------------------------
-- usp_ui_eo_get_tag_data_for_validation
-- ---------------------------------------------------------------------------
ALTER PROCEDURE [dbo].[usp_ui_eo_get_tag_data_for_validation] @caseid int=NULL,
    @source VARCHAR(20) = 'db'

As  

Begin  

  

 SET NOCOUNT ON  

  

 Declare @max_time_stamp_LBM Datetime=NULL,@max_time_stamp_DM Datetime=NULL  

 

 Begin try



Select TOP 1 @max_time_stamp_LBM=[run_info].last_run_time from [Energy_Optimization].[dbo].[Run_info] With(NOLOCK)  

join [Energy_Optimization].[dbo].[model] [Model] With(NOLOCK)

on [Model].[model_id]= [run_info].[model_id]  

Where [Model].[case_id]=@caseid and model_status='On'  

ORDER BY [run_info].last_run_time DESC 

  

  

Select [tag].[tag_name] AS tagName,

[Actual] as 'value' from [Energy_Optimization].[dbo].[model] [Model]  With(NOLOCK)  

join [Energy_Optimization].[dbo].model_tag [Model_tag]  With(NOLOCK)

on [Model].[model_id]=[Model_tag].[model_id]  

join[Energy_Optimization].[dbo].[Tag] [tag] With(NOLOCK)

on [tag].[tag_id]=[Model_tag].[tag_id]  

Left join [Energy_Optimization].[dbo].[model_output] [model_Output] With(NOLOCK) 

on [model_Output].[tag_id]=[tag].[tag_id] And time_stamp=@max_time_stamp_LBM  

    AND [model_Output].[source] = @source
Where case_id=@caseid and [tag].Active=1  

  

END TRY



BEGIN CATCH



Declare @serverName varchar(100)=ISNULL(@@servername,'SQL server')        

Select Error_Message() as 'Error_Message' ,Error_Number() as 'Error_Number',Error_Severity() as 'Error_Severity'         

      

insert into [dbo].[log_errors_tracker] ([application_name], [host_name], [error_message], [error_number], [stored_procedure], [error_severity],[status_code], [created_by], [created_on])     

SELECT 'Energy_Optimization_SQL Server',@serverName,Error_Message(),Error_Number(),Error_Procedure(),Error_Severity(),Error_State(),1,getdate()   



END CATCH

	

END  

  

/*  



Exec [usp_ui_eo_get_tag_data_for_validation] @case_id =1 

  

*/
GO

