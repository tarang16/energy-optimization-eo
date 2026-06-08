-- =============================================================================
-- Fix_CrossDB_References_v3.sql
-- Catches UNBRACKETED references to SABIC_DT_EnergyOptimization
-- that the v2 script missed (it only handled [bracketed] form).
-- =============================================================================

USE [SABIC_DT_EnergyOptimization_WebUI];
GO

DECLARE @schemaName NVARCHAR(128)
DECLARE @plainName  NVARCHAR(128)
DECLARE @objType    CHAR(2)
DECLARE @def        NVARCHAR(MAX)
DECLARE @newDef     NVARCHAR(MAX)
DECLARE @dropSql    NVARCHAR(MAX)
DECLARE @objName    NVARCHAR(256)

DECLARE obj_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT 
        SCHEMA_NAME(o.schema_id),
        o.name,
        o.type,
        m.definition
    FROM sys.sql_modules m
    JOIN sys.objects o ON o.object_id = m.object_id
    WHERE CHARINDEX('SABIC_DT_EnergyOptimization', m.definition) > 0
      AND o.type IN ('P','V','FN','IF','TF')

OPEN obj_cursor
FETCH NEXT FROM obj_cursor INTO @schemaName, @plainName, @objType, @def

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Replace ALL forms: bracketed and unbracketed
    SET @newDef = REPLACE(@def, '[SABIC_DT_EnergyOptimization]', '[Energy_Optimization]')
    SET @newDef = REPLACE(@newDef, 'SABIC_DT_EnergyOptimization', 'Energy_Optimization')

    SET @objName = QUOTENAME(@schemaName) + '.' + QUOTENAME(@plainName)

    IF @objType = 'P'
        SET @dropSql = 'DROP PROCEDURE ' + @objName
    ELSE IF @objType = 'V'
        SET @dropSql = 'DROP VIEW ' + @objName
    ELSE
        SET @dropSql = 'DROP FUNCTION ' + @objName

    BEGIN TRY
        EXEC sp_executesql @dropSql
        EXEC sp_executesql @newDef
        PRINT 'FIXED: ' + @objName
    END TRY
    BEGIN CATCH
        PRINT 'ERROR on ' + @objName + ': ' + ERROR_MESSAGE()
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
PRINT '=== Unbracketed reference migration complete ==='
GO
