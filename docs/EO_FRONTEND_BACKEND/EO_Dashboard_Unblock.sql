/* =============================================================================
   EO DASHBOARD — UNBLOCK + SEED  (idempotent, safe to re-run)
   PART 1 : creates SABIC_DT_EnergyOptimization as a shim DB whose views
            redirect every hardcoded 3-part ref back to Energy_Optimization
   PART 2 : rebuilds Manufacturing_Master's 4 synonym targets (AFFILIATE,
            PLANT, Country, Region) with a workable schema and seed rows
   PART 3 : verification — counts + smoke test of the previously-broken
            3-part reference
   Run in SSMS against localhost\SQLEXPRESS.
   ============================================================================ */
SET NOCOUNT ON;
GO

/* -------------- PART 1 :  SHIM DATABASE ------------------------------------ */
USE master;
GO

/* Create the shim DB with EXPLICIT, non-colliding filenames.
   The default filename 'SABIC_DT_EnergyOptimization.mdf' is already
   taken on disk (orphaned from the earlier rename to Energy_Optimization),
   so we force the shim to use _Shim.mdf / _Shim_log.ldf. */
IF DB_ID(N'SABIC_DT_EnergyOptimization') IS NULL
BEGIN
    PRINT N'[PART 1] Creating SABIC_DT_EnergyOptimization shim DB...';

    DECLARE @data_dir NVARCHAR(512) =
        CAST(SERVERPROPERTY(N'InstanceDefaultDataPath') AS NVARCHAR(512));
    DECLARE @log_dir  NVARCHAR(512) =
        CAST(SERVERPROPERTY(N'InstanceDefaultLogPath')  AS NVARCHAR(512));

    DECLARE @create NVARCHAR(MAX) = N'
CREATE DATABASE SABIC_DT_EnergyOptimization
ON PRIMARY
(
    NAME     = N''SABIC_DT_EnergyOptimization_Shim'',
    FILENAME = N''' + @data_dir + N'SABIC_DT_EnergyOptimization_Shim.mdf''
)
LOG ON
(
    NAME     = N''SABIC_DT_EnergyOptimization_Shim_log'',
    FILENAME = N''' + @log_dir  + N'SABIC_DT_EnergyOptimization_Shim_log.ldf''
);';

    PRINT @create;
    EXEC sp_executesql @create;
END
ELSE
BEGIN
    PRINT N'[PART 1] SABIC_DT_EnergyOptimization already exists -> refreshing views.';
END
GO

USE SABIC_DT_EnergyOptimization;
GO

/* Drop every existing dbo view — we regenerate the whole set */
DECLARE @drop NVARCHAR(MAX) = N'';
SELECT  @drop = @drop + N'DROP VIEW dbo.' + QUOTENAME(name) + N';' + CHAR(13)
FROM    sys.views
WHERE   schema_id = SCHEMA_ID(N'dbo');
IF LEN(@drop) > 0 EXEC sp_executesql @drop;
GO

USE SABIC_DT_EnergyOptimization;
GO

/* Redirect view for every dbo TABLE in Energy_Optimization */
DECLARE @t SYSNAME, @sql NVARCHAR(MAX), @ok INT = 0, @err INT = 0;
DECLARE c CURSOR LOCAL FAST_FORWARD FOR
    SELECT name FROM [Energy_Optimization].sys.tables
    WHERE schema_id = SCHEMA_ID(N'dbo');
OPEN c;
FETCH NEXT FROM c INTO @t;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @sql = N'CREATE VIEW dbo.' + QUOTENAME(@t) +
               N' AS SELECT * FROM [Energy_Optimization].[dbo].' + QUOTENAME(@t);
    BEGIN TRY
        EXEC [SABIC_DT_EnergyOptimization].sys.sp_executesql @sql;
        SET @ok += 1;
    END TRY
    BEGIN CATCH
        PRINT N'  skipped (table->view) ' + @t + N' : ' + ERROR_MESSAGE();
        SET @err += 1;
    END CATCH
    FETCH NEXT FROM c INTO @t;
END
CLOSE c; DEALLOCATE c;
PRINT N'[PART 1] table -> passthrough views created : ' + CAST(@ok  AS NVARCHAR);
PRINT N'[PART 1] table -> passthrough skipped       : ' + CAST(@err AS NVARCHAR);
GO

/* Redirect view for every dbo VIEW in Energy_Optimization (skip dupes) */
DECLARE @t SYSNAME, @sql NVARCHAR(MAX), @ok INT = 0;
DECLARE c2 CURSOR LOCAL FAST_FORWARD FOR
    SELECT name FROM [Energy_Optimization].sys.views
    WHERE schema_id = SCHEMA_ID(N'dbo');
OPEN c2;
FETCH NEXT FROM c2 INTO @t;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF OBJECT_ID(N'[SABIC_DT_EnergyOptimization].[dbo].' + QUOTENAME(@t)) IS NULL
    BEGIN
        SET @sql = N'CREATE VIEW dbo.' + QUOTENAME(@t) +
                   N' AS SELECT * FROM [Energy_Optimization].[dbo].' + QUOTENAME(@t);
        BEGIN TRY
            EXEC [SABIC_DT_EnergyOptimization].sys.sp_executesql @sql;
            SET @ok += 1;
        END TRY
        BEGIN CATCH
            PRINT N'  skipped (view->view) ' + @t + N' : ' + ERROR_MESSAGE();
        END CATCH
    END
    FETCH NEXT FROM c2 INTO @t;
END
CLOSE c2; DEALLOCATE c2;
PRINT N'[PART 1] view  -> passthrough views created : ' + CAST(@ok AS NVARCHAR);
GO

/* -------------- PART 2 :  MANUFACTURING_MASTER REBUILD --------------------- */
USE Manufacturing_Master;
GO

/* Drop existing shim objects regardless of whether they are tables or views */
IF OBJECT_ID(N'dbo.AFFILIATE','V') IS NOT NULL DROP VIEW  dbo.AFFILIATE;
IF OBJECT_ID(N'dbo.AFFILIATE','U') IS NOT NULL DROP TABLE dbo.AFFILIATE;
IF OBJECT_ID(N'dbo.PLANT','V')     IS NOT NULL DROP VIEW  dbo.PLANT;
IF OBJECT_ID(N'dbo.PLANT','U')     IS NOT NULL DROP TABLE dbo.PLANT;
IF OBJECT_ID(N'dbo.Country','V')   IS NOT NULL DROP VIEW  dbo.Country;
IF OBJECT_ID(N'dbo.Country','U')   IS NOT NULL DROP TABLE dbo.Country;
IF OBJECT_ID(N'dbo.Region','V')    IS NOT NULL DROP VIEW  dbo.Region;
IF OBJECT_ID(N'dbo.Region','U')    IS NOT NULL DROP TABLE dbo.Region;
GO

CREATE TABLE dbo.Region (
    RegionId     INT            NOT NULL PRIMARY KEY,
    RegionCode   NVARCHAR(20)   NOT NULL,
    RegionName   NVARCHAR(100)  NOT NULL,
    IsActive     BIT            NOT NULL DEFAULT 1,
    CreatedDate  DATETIME       NOT NULL DEFAULT GETDATE(),
    CreatedBy    INT            NULL,
    ModifiedDate DATETIME       NULL,
    ModifiedBy   INT            NULL
);
INSERT dbo.Region (RegionId, RegionCode, RegionName, CreatedBy)
VALUES (1,'ME','Middle East',1),
       (2,'AS','Asia',       1),
       (3,'EU','Europe',     1),
       (4,'AM','Americas',   1);
GO

CREATE TABLE dbo.Country (
    CountryId    INT            NOT NULL PRIMARY KEY,
    CountryCode  NVARCHAR(10)   NOT NULL,
    CountryName  NVARCHAR(100)  NOT NULL,
    RegionId     INT            NULL,
    IsActive     BIT            NOT NULL DEFAULT 1,
    CreatedDate  DATETIME       NOT NULL DEFAULT GETDATE(),
    CreatedBy    INT            NULL,
    ModifiedDate DATETIME       NULL,
    ModifiedBy   INT            NULL
);
INSERT dbo.Country (CountryId, CountryCode, CountryName, RegionId, CreatedBy)
VALUES (1,'SA','Saudi Arabia',         1,1),
       (2,'AE','United Arab Emirates', 1,1),
       (3,'IN','India',                2,1),
       (4,'US','United States',        4,1);
GO

CREATE TABLE dbo.AFFILIATE (
    AffiliateId    INT            NOT NULL PRIMARY KEY,
    AffiliateCode  NVARCHAR(20)   NOT NULL,
    AffiliateName  NVARCHAR(200)  NOT NULL,
    CountryId      INT            NULL,
    RegionId       INT            NULL,
    AffiliateImage VARBINARY(MAX) NULL,
    IsActive       BIT            NOT NULL DEFAULT 1,
    CreatedDate    DATETIME       NOT NULL DEFAULT GETDATE(),
    CreatedBy      INT            NULL,
    ModifiedDate   DATETIME       NULL,
    ModifiedBy     INT            NULL
);
INSERT dbo.AFFILIATE (AffiliateId, AffiliateCode, AffiliateName, CountryId, RegionId, CreatedBy)
VALUES (1,'SABIC', 'SABIC',                     1,1,1),
       (2,'YANSAB','Yanbu National Petrochem',  1,1,1),
       (3,'PETRO', 'Petrokemya',                1,1,1),
       (4,'KAYAN', 'Saudi Kayan',               1,1,1);
GO

CREATE TABLE dbo.PLANT (
    PlantId      INT            NOT NULL PRIMARY KEY,
    PlantCode    NVARCHAR(20)   NOT NULL,
    PlantName    NVARCHAR(200)  NOT NULL,
    AffiliateId  INT            NULL,
    CountryId    INT            NULL,
    RegionId     INT            NULL,
    IsActive     BIT            NOT NULL DEFAULT 1,
    CreatedDate  DATETIME       NOT NULL DEFAULT GETDATE(),
    CreatedBy    INT            NULL,
    ModifiedDate DATETIME       NULL,
    ModifiedBy   INT            NULL
);
INSERT dbo.PLANT (PlantId, PlantCode, PlantName, AffiliateId, CountryId, RegionId, CreatedBy)
VALUES (1,'JUBAIL','Jubail Plant',  1,1,1,1),
       (2,'YANBU', 'Yanbu Plant',   2,1,1,1),
       (3,'RABIGH','Rabigh Plant',  1,1,1,1),
       (4,'KAYANP','Kayan Plant',   4,1,1,1);
GO

PRINT N'[PART 2] Manufacturing_Master rebuilt and seeded.';
GO

/* -------------- PART 3 :  VERIFICATION ------------------------------------- */
USE SABIC_DT_EnergyOptimization;
SELECT  db_name = N'SABIC_DT_EnergyOptimization',
        views_count = (SELECT COUNT(*) FROM sys.views);

USE Manufacturing_Master;
SELECT 'Region'    AS object_name, COUNT(*) AS row_count FROM dbo.Region    UNION ALL
SELECT 'Country',                  COUNT(*)              FROM dbo.Country   UNION ALL
SELECT 'AFFILIATE',                COUNT(*)              FROM dbo.AFFILIATE UNION ALL
SELECT 'PLANT',                    COUNT(*)              FROM dbo.PLANT;

/* Smoke-test the hardcoded 3-part ref that was previously blowing up */
BEGIN TRY
    DECLARE @c INT;
    SELECT @c = COUNT(*) FROM SABIC_DT_EnergyOptimization.dbo.case_info;
    PRINT N'[VERIFY] SABIC_DT_EnergyOptimization.dbo.case_info rows: ' + CAST(@c AS NVARCHAR);
END TRY
BEGIN CATCH
    PRINT N'[VERIFY] case_info still unreachable: ' + ERROR_MESSAGE();
END CATCH
GO

PRINT N'=== EO_Dashboard_Unblock complete ===';
GO
