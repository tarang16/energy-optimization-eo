-- =============================================================================
-- Fix_CrossDB_References_v2.sql
-- Rewrites ALL stored procedures, views, and functions in 
-- SABIC_DT_EnergyOptimization_WebUI that reference 
-- [SABIC_DT_EnergyOptimization] to instead reference [Energy_Optimization].
--
-- Strategy: DROP the object, then re-CREATE with the fixed definition.
-- =============================================================================

USE [SABIC_DT_EnergyOptimization_WebUI];
GO

DECLARE @objName    NVARCHAR(256)
DECLARE @schemaName NVARCHAR(128)
DECLARE @plainName  NVARCHAR(128)
DECLARE @objType    CHAR(2)
DECLARE @def        NVARCHAR(MAX)
DECLARE @newDef     NVARCHAR(MAX)
DECLARE @dropSql    NVARCHAR(MAX)

DECLARE obj_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT 
        SCHEMA_NAME(o.schema_id) AS schema_name,
        o.name AS plain_name,
        o.type,
        m.definition
    FROM sys.sql_modules m
    JOIN sys.objects o ON o.object_id = m.object_id
    WHERE m.definition LIKE '%[[]SABIC_DT_EnergyOptimization]%'
      AND o.type IN ('P','V','FN','IF','TF')

OPEN obj_cursor
FETCH NEXT FROM obj_cursor INTO @schemaName, @plainName, @objType, @def

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Build the new definition by replacing DB name
    SET @newDef = REPLACE(@def, '[SABIC_DT_EnergyOptimization]', '[Energy_Optimization]')
    SET @newDef = REPLACE(@newDef, 'SABIC_DT_EnergyOptimization.dbo.', 'Energy_Optimization.dbo.')

    -- Build DROP statement
    SET @objName = QUOTENAME(@schemaName) + '.' + QUOTENAME(@plainName)
    IF @objType = 'P'
        SET @dropSql = 'DROP PROCEDURE ' + @objName
    ELSE IF @objType = 'V'
        SET @dropSql = 'DROP VIEW ' + @objName
    ELSE
        SET @dropSql = 'DROP FUNCTION ' + @objName

    BEGIN TRY
        -- Drop the existing object
        EXEC sp_executesql @dropSql
        -- Re-create with fixed definition (definition already contains CREATE)
        EXEC sp_executesql @newDef
        PRINT 'FIXED: ' + @objName
    END TRY
    BEGIN CATCH
        PRINT 'ERROR on ' + @objName + ': ' + ERROR_MESSAGE()
        -- Try to recreate with original definition if the new one failed
        BEGIN TRY
            EXEC sp_executesql @def
            PRINT '  -> Restored original: ' + @objName
        END TRY
        BEGIN CATCH
            PRINT '  -> COULD NOT RESTORE: ' + @objName + ': ' + ERROR_MESSAGE()
        END CATCH
    END CATCH

    FETCH NEXT FROM obj_cursor INTO @schemaName, @plainName, @objType, @def
END

CLOSE obj_cursor
DEALLOCATE obj_cursor

PRINT ''
PRINT '=== Cross-DB reference migration complete ==='
GO

-- Verify: no more references to old DB name
SELECT COUNT(*) AS remaining_refs 
FROM sys.sql_modules 
WHERE definition LIKE '%[[]SABIC_DT_EnergyOptimization]%'
GO
