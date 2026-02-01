-- =====================================================================
-- Script: Seed Usages Table
-- Purpose: Generate 40k test records for the Usages table
-- Author: Tony Arista
-- Description: This script populates the Usages table with simulated
--              cloud service usage data spanning from Nov 2025 to Jan 2026.
--              Each record represents a usage event linked to clients,
--              services, and providers with realistic time and unit data.
-- =====================================================================

-- Declare script parameters
DECLARE @StartDate date = '2025-11-01';      -- Date range start
DECLARE @EndDate   date = '2026-01-25';      -- Date range end
DECLARE @TotalRows int  = 40000;             -- Total records to generate
DECLARE @StartUsageID int = 900001;          -- Starting ID for usage records

;WITH Numbers AS (
    -- CTE 1: Generate sequential numbers from 1 to @TotalRows
    -- Used as the base for generating the specified number of records
    SELECT TOP (@TotalRows)
           ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM sys.all_objects a
    CROSS JOIN sys.all_objects b
),
ClientProvider AS (
    -- CTE 2: Define the mapping between Clients and Providers
    -- Each client is assigned to one or more service providers
    SELECT * FROM (VALUES
        (1001, 2001),(1002, 2001),(1003, 2001),
        (1004, 2002),(1005, 2002),(1006, 2002),
        (1007, 2003),(1008, 2003),
        (1009, 2001),(1010, 2003)
    ) v(ClientID, ProviderID)
),
ClientPick AS (
    -- CTE 3: Distribute clients across all rows using modulo operator
    -- Cycles through ClientIDs 1001-1010 for each generated record
    SELECT
        n.n,
        1000 + ((n.n - 1) % 10) + 1 AS ClientID
    FROM Numbers n
),
Base AS (
    -- CTE 4: Build the core data for each usage record
    -- Combines client data with randomly selected services and generated usage metrics
    SELECT
        cp.ClientID,
        s.ServiceID,
        -- Random usage date within the specified date range
        DATEADD(DAY,
                ABS(CHECKSUM(NEWID())) % (DATEDIFF(DAY, @StartDate, @EndDate) + 1),
                @StartDate) AS UsageDate,
        -- Random usage time within a 24-hour period
        CAST(DATEADD(MILLISECOND,
                     ABS(CHECKSUM(NEWID())) % (24*60*60*1000),
                     CAST('00:00:00.000' AS time(3))) AS time(3)) AS UsageTime,

        -- Units used between 1 and 50 with 2 decimal places
        CAST(1 + (ABS(CHECKSUM(NEWID())) % 50) AS decimal(10,2)) AS UnitsUsed,

        s.ServiceCost,
        GETDATE() AS CreatedDate,
        cp.n
    FROM ClientPick cp
    JOIN ClientProvider map
        ON cp.ClientID = map.ClientID
    -- Randomly select one service from the provider's service list
    CROSS APPLY (
        SELECT TOP 1 ServiceID, ServiceCost
        FROM dbo.Services svc
        WHERE svc.ProviderID = map.ProviderID
        ORDER BY NEWID()
    ) s
)
-- Insert the generated usage records into the Usages table
INSERT INTO dbo.Usages
    (UsageID, ClientID, ServiceID, UsageDate, UsageTime, UnitsUsed, TotalCost, CreatedDate)
SELECT
    -- Generate sequential UsageIDs starting from @StartUsageID
    @StartUsageID + (ROW_NUMBER() OVER (ORDER BY n)) - 1 AS UsageID,
    ClientID,
    ServiceID,
    UsageDate,
    UsageTime,
    UnitsUsed,
    -- Calculate total cost by multiplying units used by service cost per unit
    CAST(UnitsUsed * ServiceCost AS decimal(10,2)) AS TotalCost,
    CreatedDate
FROM Base
ORDER BY n;