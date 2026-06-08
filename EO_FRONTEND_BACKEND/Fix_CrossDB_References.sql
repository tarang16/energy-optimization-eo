-- =============================================================================
-- Fix_CrossDB_References.sql
-- Rewrites ALL stored procedures and views in SABIC_DT_EnergyOptimization_WebUI
-- that reference [SABIC_DT_EnergyOptimization] to instead reference
-- [Energy_Optimization] (the actual restored database).
--
-- This performs an in-place ALTER on each object, preserving all logic
-- but swapping the cross-database reference.
-- =============================================================================

USE [SABIC_DT_EnergyOptimization_WebUI];
GO

DECLARE @objName  NVARCHAR(256)
DECLARE @objType  NVARCHAR(10)
DECLARE @def      NVARCHAR(MAX)
DECLARE @newDef   NVARCHAR(MAX)

-- Cursor over every SP and VIEW that contains the old DB name
DECLARE obj_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT 
        QUOTENAME(SCHEMA_NAME(o.schema_id)) + '.' + QUOTENAME(o.name) AS obj_name,
        CASE 
            WHEN o.type = 'P'  THEN 'SP'
            WHEN o.type = 'V'  THEN 'VIEW'
            WHEN o.type = 'FN' THEN 'FN'
            WHEN o.type = 'IF' THEN 'IF'
            WHEN o.type = 'TF' THEN 'TF'
            ELSE o.type
        END AS obj_type,
        m.definition
    FROM sys.sql_modules m
    JOIN sys.objects o ON o.object_id = m.object_id
    WHERE m.definition LIKE '%[[]SABIC_DT_EnergyOptimization]%'
      AND o.type IN ('P','V','FN','IF','TF')

OPEN obj_cursor
FETCH NEXT FROM obj_cursor INTO @objName, @objType, @def

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Replace old DB name with new DB name
    SET @newDef = REPLACE(@def, '[SABIC_DT_EnergyOptimization]', '[Energy_Optimization]')
    -- Also handle unbracketed references
    SET @newDef = REPLACE(@newDef, 'SABIC_DT_EnergyOptimization.dbo.', 'Energy_Optimization.dbo.')

    -- Change CREATE to ALTER so we can update in-place
    IF @objType = 'SP'
    BEGIN
        -- Handle CREATE PROCEDURE / CREATE  PROCEDURE / CREATE     Procedure etc.
        SET @newDef = STUFF(@newDef, PATINDEX('%CREATE%PROC%', @newDef), 6, 'ALTER')
    END
    ELSE IF @objType = 'VIEW'
    BEGIN
        SET @newDef = STUFF(@newDef, PATINDEX('%CREATE%VIEW%', @newDef), 6, 'ALTER')
    END
    ELSE -- Functions
    BEGIN
        SET @newDef = STUFF(@newDef, PATINDEX('%CREATE%FUNCTION%', @newDef), 6, 'ALTER')
    END

    BEGIN TRY
        EXEC sp_executesql @newDef
        PRINT 'FIXED: ' + @objName + ' (' + @objType + ')'
    END TRY
    BEGIN CATCH
        PRINT 'ERROR on ' + @objName + ': ' + ERROR_MESSAGE()
    END CATCH

    FETCH NEXT FROM obj_cursor INTO @objName, @objType, @def
END

CLOSE obj_cursor
DEALLOCATE obj_cursor

PRINT '=== Cross-DB reference migration complete ==='
GO
