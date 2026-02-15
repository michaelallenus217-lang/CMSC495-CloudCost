-- =====================================================================
-- Script: Seed Usages Table
-- Purpose: Generate 40k test records for the Usages table
-- Author: Tony Arista
-- Description: This script populates the Usages table with simulated
--              cloud service usage data spanning from Nov 2025 to Jan 2026.
--              Each record represents a usage event linked to clients,
--              services, and providers with realistic time and unit data.
-- v2 Enhancements:
--   - Clients preference to providers
--   - All 30 services used
--   - Category-based UnitsUsed
--   - Time-of-day weighting, more relastic usage patterns
--   - Provider scaling to match invoice spending patterns
-- =====================================================================

-- Clear existing data
TRUNCATE TABLE dbo.Usages;

DECLARE @StartDate date = '2025-11-01';
DECLARE @EndDate   date = '2026-01-25';
DECLARE @TotalRows int  = 40000;
DECLARE @StartUsageID int = 900001;

;WITH Numbers AS (
    SELECT TOP (@TotalRows)
           ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.all_objects a
    CROSS JOIN sys.all_objects b
),
ClientProvider AS (
    -- Client → Provider preference
    SELECT * FROM (VALUES
        (1001, 2001),(1002, 2001),(1003, 2001),(1009, 2001),
        (1004, 2002),(1005, 2002),(1006, 2002),
        (1007, 2003),(1008, 2003),(1010, 2003)
    ) v(ClientID, ProviderID)
),
ClientPick AS (
    -- Evenly cycle clients 1001–1010 across all rows
    SELECT
        n.n,
        1000 + ((n.n - 1) % 10) + 1 AS ClientID
    FROM Numbers n
),
Base AS (
    SELECT
        cp.n,
        cp.ClientID,
        map.ProviderID,
        s.ServiceID,
        s.ServiceCost,
        s.ServiceType,

        -- Random usage date
        DATEADD(DAY,
            ABS(CHECKSUM(NEWID(), cp.n)) % (DATEDIFF(DAY, @StartDate, @EndDate) + 1),
            @StartDate
        ) AS UsageDate,

        -- Time-of-day weighting by ServiceType
        CAST(
            DATEADD(SECOND,
                CASE 
                    WHEN s.ServiceType IN ('Compute','Containers') THEN
                        CASE WHEN ABS(CHECKSUM(NEWID(), cp.n, 1)) % 100 < 75
                             THEN (8*3600) + (ABS(CHECKSUM(NEWID(), cp.n, 2)) % (10*3600))
                             ELSE ABS(CHECKSUM(NEWID(), cp.n, 3)) % 86400
                        END
                    WHEN s.ServiceType IN ('Object Storage','File Storage') THEN
                        CASE WHEN ABS(CHECKSUM(NEWID(), cp.n, 4)) % 100 < 60
                             THEN (1*3600) + (ABS(CHECKSUM(NEWID(), cp.n, 5)) % (3*3600))
                             ELSE ABS(CHECKSUM(NEWID(), cp.n, 6)) % 86400
                        END
                    WHEN s.ServiceType IN ('Machine Learning','Data Warehouse','Data Processing') THEN
                        CASE WHEN ABS(CHECKSUM(NEWID(), cp.n, 7)) % 100 < 50
                             THEN (2*3600) + (ABS(CHECKSUM(NEWID(), cp.n, 8)) % (4*3600))
                             ELSE ABS(CHECKSUM(NEWID(), cp.n, 9)) % 86400
                        END
                    ELSE
                        ABS(CHECKSUM(NEWID(), cp.n, 10)) % 86400
                END,
                CAST('00:00:00' AS time(0))
            ) AS time(0)
        ) AS UsageTime,

        -- Category-based UnitsUsed
        CAST(
            CASE 
                WHEN s.ServiceType = 'Compute' THEN
                    0.1 + (ABS(CHECKSUM(NEWID(), cp.n, 11)) % 50) / 10.0
                WHEN s.ServiceType = 'Containers' THEN
                    0.1 + (ABS(CHECKSUM(NEWID(), cp.n, 12)) % 30) / 10.0
                WHEN s.ServiceType = 'Databases' THEN
                    0.1 + (ABS(CHECKSUM(NEWID(), cp.n, 13)) % 20) / 10.0
                WHEN s.ServiceType IN ('Object Storage','File Storage') THEN
                    1.0 + (ABS(CHECKSUM(NEWID(), cp.n, 14)) % 500)
                WHEN s.ServiceType IN ('Data Warehouse','Data Processing') THEN
                    5.0 + (ABS(CHECKSUM(NEWID(), cp.n, 15)) % 46)
                WHEN s.ServiceType = 'Machine Learning' THEN
                    1.0 + (ABS(CHECKSUM(NEWID(), cp.n, 16)) % 20)
                ELSE
                    0.01 + (ABS(CHECKSUM(NEWID(), cp.n, 17)) % 10) / 100.0
            END
        AS decimal(10,2)) AS BaseUnits,

        GETDATE() AS CreatedDate
    FROM ClientPick cp
    JOIN ClientProvider map
        ON cp.ClientID = map.ClientID
    CROSS APPLY (
        -- Random service per provider (safe randomness)
        SELECT TOP 1
            svc.ServiceID,
            svc.ServiceCost,
            svc.ServiceType
        FROM dbo.Services svc
        WHERE svc.ProviderID = map.ProviderID
        ORDER BY CHECKSUM(NEWID(), cp.n, svc.ServiceID)
    ) s
),
Adjusted AS (
    -- Provider scaling to match invoice spending patterns
    SELECT
        n,
        ClientID,
        ServiceID,
        UsageDate,
        UsageTime,
        CAST(
            BaseUnits *
            CASE ProviderID
                WHEN 2001 THEN 1.0   -- ~1k/month
                WHEN 2002 THEN 16.0  -- ~18k/month
                WHEN 2003 THEN 4.0   -- ~4.3k/month
            END
        AS decimal(10,2)) AS UnitsUsed,
        ServiceCost,
        CreatedDate
    FROM Base
)
INSERT INTO dbo.Usages
    (UsageID, ClientID, ServiceID, UsageDate, UsageTime, UnitsUsed, TotalCost, CreatedDate)
SELECT
    @StartUsageID + (ROW_NUMBER() OVER (ORDER BY n)) - 1 AS UsageID,
    ClientID,
    ServiceID,
    UsageDate,
    UsageTime,
    UnitsUsed,
    CAST(UnitsUsed * ServiceCost AS decimal(10,2)) AS TotalCost,
    CreatedDate
FROM Adjusted
ORDER BY n;