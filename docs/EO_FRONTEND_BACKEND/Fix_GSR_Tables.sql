-- =============================================================================
-- Fix_GSR_Tables.sql
-- Creates empty GSR stub tables in [SABIC_DT_EnergyOptimization] (the shim DB
-- formerly known as Energy_Optimization). These tables are referenced by 11
-- synonyms in SABIC_DT_EnergyOptimization_WebUI. Without them, every Energy
-- Management SP fails with "Synonym refers to an invalid object".
--
-- The tables are intentionally EMPTY — they provide schema only so the SPs
-- execute cleanly and return zero rows instead of crashing.
-- Once the real Energy_Optimization .bak is restored, drop this shim DB.
-- =============================================================================

USE [Energy_Optimization];
GO

-- ─── GSR_Plants ─────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_Plants', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_Plants (
        Plant_ID        UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        Plant_Name      NVARCHAR(400)    NULL,
        AFFILIATE       NVARCHAR(400)    NULL,
        REGION          NVARCHAR(200)    NULL,
        Active          BIT              NULL DEFAULT 1
    );
END
GO

-- ─── GSR_Equipments ─────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_Equipments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_Equipments (
        Equipment_ID           UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        Plant_ID               UNIQUEIDENTIFIER NULL,
        Equipment              NVARCHAR(400)    NULL,
        Equipment_Category     NVARCHAR(200)    NULL,
        Equipment_Description  NVARCHAR(800)    NULL,
        Energy_Source           NVARCHAR(200)    NULL,
        Active                 BIT              NULL DEFAULT 1
    );
END
GO

-- ─── GSR_EquipmentKPI ───────────────────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_EquipmentKPI', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_EquipmentKPI (
        ID                                       INT IDENTITY(1,1) PRIMARY KEY,
        Equipment_ID                             UNIQUEIDENTIFIER NULL,
        KPI_Date                                 DATE             NULL,
        Equipment_Running_Time                   FLOAT            NULL,
        Equipment_Operational_Days               FLOAT            NULL,
        Energy_Consumed                          FLOAT            NULL,
        Target_Energy_GJ                         FLOAT            NULL,
        Baseline_Energy                          FLOAT            NULL,
        Optimum_Target                           FLOAT            NULL,
        EnPI_GJ                                  FLOAT            NULL,
        [EnPI_$]                                 FLOAT            NULL,
        Process_Flow                             FLOAT            NULL,
        Baseline_Specific_Energy                 FLOAT            NULL,
        Efficiency                               FLOAT            NULL,
        Steam_Energy                             FLOAT            NULL,
        BFW_Energy                               FLOAT            NULL,
        Fuel_Energy                              FLOAT            NULL,
        Total_Heat_absorbed_per_Kg_of_Fuel       FLOAT            NULL,
        Total_Heat_Input_per_Kg_of_Fuel          FLOAT            NULL,
        First_Stage_Isentrophic_Exponent_K       FLOAT            NULL,
        First_Stage_Polytrophic_Exponent_M       FLOAT            NULL,
        Actual_Enthalpy_Drop                     FLOAT            NULL,
        Isentropic_Enthalpy_Drop                 FLOAT            NULL,
        Total_Heat_Absorbed                      FLOAT            NULL,
        Fuel_Fired                               FLOAT            NULL
    );
END
GO

-- ─── GSR_EquipmentBaselinesTargets ──────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_EquipmentBaselinesTargets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_EquipmentBaselinesTargets (
        ID                INT IDENTITY(1,1) PRIMARY KEY,
        Equipment_ID      UNIQUEIDENTIFIER NULL,
        [Year]            SMALLINT         NULL,
        Target_EnPI       FLOAT            NULL,
        Baseline_EnPI     FLOAT            NULL
    );
END
GO

-- ─── GSR_EquipmentLoad ──────────────────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_EquipmentLoad', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_EquipmentLoad (
        ID                INT IDENTITY(1,1) PRIMARY KEY,
        Equipment_ID      UNIQUEIDENTIFIER NULL,
        KPI_Date          DATE             NULL,
        Load_Percentage   FLOAT            NULL,
        Design_Capacity   FLOAT            NULL,
        Actual_Load       FLOAT            NULL
    );
END
GO

-- ─── GSR_OMS_PlantSystems ───────────────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_OMS_PlantSystems', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_OMS_PlantSystems (
        ID                                  INT IDENTITY(1,1) PRIMARY KEY,
        Plant_ID                            UNIQUEIDENTIFIER NULL,
        KPI_Date                            DATE             NULL,
        Energy_Consumed_Electricity         FLOAT            NULL,
        Energy_Consumed_Fuel                FLOAT            NULL,
        Energy_Consumed_Steam               FLOAT            NULL,
        Energy_Cost_Electricity             FLOAT            NULL,
        Energy_Cost_Fuel                    FLOAT            NULL,
        Energy_Cost_Steam                   FLOAT            NULL,
        OMS_Production_Total                FLOAT            NULL,
        Motors_ENPI                         FLOAT            NULL,
        Turbines_ENPI                       FLOAT            NULL,
        Motors_Consumption                  FLOAT            NULL,
        Turbine_consumption                 FLOAT            NULL,
        [CA_EnPI_Target_$/Day]              FLOAT            NULL,
        Sea_Water_ENPI                      FLOAT            NULL,
        CLOSED_COOLING_WATER_ENPI           FLOAT            NULL,
        [CW_EnPI_Target_$/Day]              FLOAT            NULL,
        Cw_load                             FLOAT            NULL,
        CW_Water_Chem_Cost_Total            FLOAT            NULL,
        CW_Chemical_Cost                    FLOAT            NULL,
        CW_Energy_Cost                      FLOAT            NULL,
        CLOSED_COOLING_WATER_Energy_Cost    FLOAT            NULL,
        Sea_Water_Energy_Cost               FLOAT            NULL,
        Steam_Let_Down_ENPI                 FLOAT            NULL,
        Steam_Vents_ENPI                    FLOAT            NULL,
        Steam_Dumped_ENPI                   FLOAT            NULL,
        Steam_Let_Down_Losses               FLOAT            NULL,
        Steam_Vents_Losses                  FLOAT            NULL,
        Steam_Dumped_Losses                 FLOAT            NULL,
        Steam_Let_Down_ENPI_Target          FLOAT            NULL,
        Steam_Vents_ENPI_Target             FLOAT            NULL,
        Steam_Dumped_ENPI_Target            FLOAT            NULL,
        Steam_Let_Down_Losses_Target        FLOAT            NULL,
        Steam_Vents_Losses_Target           FLOAT            NULL,
        Steam_Dumped_Losses_Target          FLOAT            NULL
    );
END
GO

-- ─── GSR_PlantBaselinesTargets ──────────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_PlantBaselinesTargets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_PlantBaselinesTargets (
        ID                         INT IDENTITY(1,1) PRIMARY KEY,
        PLANT_ID                   UNIQUEIDENTIFIER NULL,
        [Year]                     SMALLINT         NULL,
        Energy_Cost_Index_Target   FLOAT            NULL,
        Baseline_Energy_Cost_Index FLOAT            NULL
    );
END
GO

-- ─── GSR_AffiliateBaselinesTargets ──────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_AffiliateBaselinesTargets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_AffiliateBaselinesTargets (
        ID                         INT IDENTITY(1,1) PRIMARY KEY,
        AFFILIATE                  NVARCHAR(400)    NULL,
        [Year]                     SMALLINT         NULL,
        Energy_Cost_Index_Target   FLOAT            NULL
    );
END
GO

-- ─── GSR_AffiliateKPI ───────────────────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_AffiliateKPI', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_AffiliateKPI (
        ID             INT IDENTITY(1,1) PRIMARY KEY,
        AFFILIATE      NVARCHAR(400)    NULL,
        KPI_Date       DATE             NULL,
        SEEC_KPI       FLOAT            NULL,
        SEEC_Target    FLOAT            NULL
    );
END
GO

-- ─── GSR_KEV ────────────────────────────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_KEV', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_KEV (
        ID              INT IDENTITY(1,1) PRIMARY KEY,
        Plant_ID        UNIQUEIDENTIFIER NULL,
        Equipment_ID    UNIQUEIDENTIFIER NULL,
        KPI_Date        DATE             NULL,
        KEV_Name        NVARCHAR(400)    NULL,
        KEV_Value       FLOAT            NULL,
        KEV_Unit        NVARCHAR(100)    NULL,
        KEV_Category    NVARCHAR(200)    NULL
    );
END
GO

-- ─── GSR_SustainabilityAndSeecKPI ───────────────────────────────────────────
IF OBJECT_ID('dbo.GSR_SustainabilityAndSeecKPI', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.GSR_SustainabilityAndSeecKPI (
        ID                        INT IDENTITY(1,1) PRIMARY KEY,
        AFFILIATE                 NVARCHAR(400)    NULL,
        KPI_Date                  DATE             NULL,
        SEEC_KPI_Actual           FLOAT            NULL,
        SEEC_KPI_Target           FLOAT            NULL,
        SEEC_KPI_Baseline         FLOAT            NULL,
        CO2_Reduction             FLOAT            NULL,
        Energy_Savings            FLOAT            NULL
    );
END
GO

PRINT '=== All 11 GSR stub tables created in SABIC_DT_EnergyOptimization ===';
GO
