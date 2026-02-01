-- =====================================================================
-- Script: Generate Invoices
-- Purpose: Aggregate cloud service usage by month and create invoices
-- Author: Tony Arista
-- Description: This script generates monthly invoices for each client
--              based on their aggregated service usage costs by provider.
--              It groups usage records by client, provider, year, and month,
--              then creates invoice records with the total cost for each period.
-- =====================================================================

;WITH MonthlyUsage AS (
    -- CTE: Aggregate usage costs by client, provider, and month
    -- Sums all usage charges for each unique client-provider-month combination
    SELECT
        u.ClientID,
        s.ProviderID,
        YEAR(u.UsageDate) AS UsageYear,
        MONTH(u.UsageDate) AS UsageMonth,
        SUM(u.TotalCost) AS InvoiceAmount
    FROM Usages u
    INNER JOIN Services s ON u.ServiceID = s.ServiceID
    GROUP BY
        u.ClientID,
        s.ProviderID,
        YEAR(u.UsageDate),
        MONTH(u.UsageDate)
)
-- Insert aggregated monthly usage data as invoice records into the Invoices table
INSERT INTO Invoices (ClientID, InvoiceDate, InvoiceAmount, CreatedDate)
SELECT
    ClientID,
    -- Convert aggregated month to the last day of that month for the invoice date
    EOMONTH(DATEFROMPARTS(UsageYear, UsageMonth, 1)) AS InvoiceDate,
    InvoiceAmount,
    -- Record the current timestamp when the invoice is created
    GETDATE() AS CreatedDate
FROM MonthlyUsage
-- Exclude January 2026 invoices (month still in progress as of script execution date)
WHERE NOT (UsageYear = 2026 AND UsageMonth = 1);