-- Generate 40K usage records
-- Author: Tony Arista

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
    SELECT * FROM (VALUES
        (1001, 2001),(1002, 2001),(1003, 2001),
        (1004, 2002),(1005, 2002),(1006, 2002),
        (1007, 2003),(1008, 2003),
        (1009, 2001),(1010, 2003)
    ) v(ClientID, ProviderID)
),
ClientPick AS (
    SELECT
        n.n,
        1000 + ((n.n - 1) % 10) + 1 AS ClientID
    FROM Numbers n
),
Base AS (
    SELECT
        cp.ClientID,
        s.ServiceID,
        DATEADD(DAY,
                ABS(CHECKSUM(NEWID())) % (DATEDIFF(DAY, @StartDate, @EndDate) + 1),
                @StartDate) AS UsageDate,
        CAST(DATEADD(MILLISECOND,
                     ABS(CHECKSUM(NEWID())) % (24*60*60*1000),
                     CAST('00:00:00.000' AS time(3))) AS time(3)) AS UsageTime,
        CAST(10 + (ABS(CHECKSUM(NEWID())) % 500) AS decimal(10,2)) AS UnitsUsed,
        s.ServiceCost,
        GETDATE() AS CreatedDate,
        cp.n
    FROM ClientPick cp
    JOIN ClientProvider map
        ON cp.ClientID = map.ClientID
    JOIN dbo.Services s
        ON s.ProviderID = map.ProviderID
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
FROM Base
ORDER BY n;
