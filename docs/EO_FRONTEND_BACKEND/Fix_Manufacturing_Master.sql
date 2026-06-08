-- =============================================================================
-- Fix_Manufacturing_Master.sql
-- Rebuilds the Manufacturing_Master shim tables with the EXACT column names
-- and foreign-key values that view_landing_case_data expects.
--
-- The view joins:
--   case_info.affiliate_id -> AFFILIATE.affiliate_id
--   AFFILIATE.country_id   -> Country.country_id
--   Country.region_id      -> Region.region_id
--
-- And reads columns: AFFILIATE(affiliate_id, name, affiliate_sap_id, image, country_id)
--                     Country(country_id, name, region_id)
--                     Region(region_id, name, abrv)
--
-- case_info currently has affiliate_id = 10 and 14, so we must seed those IDs.
-- =============================================================================

USE [Manufacturing_Master];
GO

-- ─── Drop existing (wrong-schema) tables ────────────────────────────────────
IF OBJECT_ID('dbo.PLANT',     'U') IS NOT NULL DROP TABLE dbo.PLANT;
IF OBJECT_ID('dbo.AFFILIATE', 'U') IS NOT NULL DROP TABLE dbo.AFFILIATE;
IF OBJECT_ID('dbo.Country',   'U') IS NOT NULL DROP TABLE dbo.Country;
IF OBJECT_ID('dbo.Region',    'U') IS NOT NULL DROP TABLE dbo.Region;
GO

-- ─── Region ─────────────────────────────────────────────────────────────────
CREATE TABLE dbo.Region (
    region_id   INT          NOT NULL PRIMARY KEY,
    name        NVARCHAR(200) NOT NULL,
    abrv        NVARCHAR(50)  NULL,
    active      BIT          NOT NULL DEFAULT 1,
    created_on  DATETIME     NULL DEFAULT GETDATE(),
    created_by  INT          NULL
);
GO

INSERT INTO dbo.Region (region_id, name, abrv) VALUES
(1, 'Middle East',  'ME'),
(2, 'Asia Pacific', 'AP'),
(3, 'Americas',     'AM'),
(4, 'Europe',       'EU');
GO

-- ─── Country ────────────────────────────────────────────────────────────────
CREATE TABLE dbo.Country (
    country_id  INT          NOT NULL PRIMARY KEY,
    name        NVARCHAR(200) NOT NULL,
    region_id   INT          NOT NULL,
    active      BIT          NOT NULL DEFAULT 1,
    created_on  DATETIME     NULL DEFAULT GETDATE(),
    created_by  INT          NULL,
    FOREIGN KEY (region_id) REFERENCES dbo.Region(region_id)
);
GO

INSERT INTO dbo.Country (country_id, name, region_id) VALUES
(1, 'Saudi Arabia', 1),
(2, 'United Arab Emirates', 1),
(3, 'China', 2),
(4, 'United States', 3);
GO

-- ─── AFFILIATE ──────────────────────────────────────────────────────────────
CREATE TABLE dbo.AFFILIATE (
    affiliate_id     INT           NOT NULL PRIMARY KEY,
    name             NVARCHAR(200) NOT NULL,
    affiliate_sap_id NVARCHAR(50)  NULL,
    image            NVARCHAR(500) NULL,
    country_id       INT           NOT NULL,
    active           BIT           NOT NULL DEFAULT 1,
    created_on       DATETIME      NULL DEFAULT GETDATE(),
    created_by       INT           NULL,
    FOREIGN KEY (country_id) REFERENCES dbo.Country(country_id)
);
GO

-- Seed affiliate_ids that match the case_info table (10 and 14).
-- Also add a few extras so the sidebar has content.
INSERT INTO dbo.AFFILIATE (affiliate_id, name, affiliate_sap_id, country_id) VALUES
(10, 'United',       '1000', 1),
(14, 'Test Affiliate','1400', 1),
(1,  'SABIC',        '0001', 1),
(2,  'Yanbu National Petrochem', '0002', 1),
(3,  'Petrokemya',   '0003', 1),
(4,  'Saudi Kayan',  '0004', 1);
GO

-- ─── PLANT (may be referenced by other synonyms/views) ──────────────────────
CREATE TABLE dbo.PLANT (
    plant_id      INT           NOT NULL PRIMARY KEY,
    name          NVARCHAR(200) NOT NULL,
    affiliate_id  INT           NOT NULL,
    active        BIT           NOT NULL DEFAULT 1,
    created_on    DATETIME      NULL DEFAULT GETDATE(),
    created_by    INT           NULL,
    FOREIGN KEY (affiliate_id) REFERENCES dbo.AFFILIATE(affiliate_id)
);
GO

INSERT INTO dbo.PLANT (plant_id, name, affiliate_id) VALUES
(1, 'Plant A', 10),
(2, 'Plant B', 14);
GO

PRINT '=== Manufacturing_Master shim tables rebuilt with correct schema ===';
GO
