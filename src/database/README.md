# Cloud Cost Database

A SQL Server database designed to track and manage cloud service usage, costs, and billing for multiple clients across various cloud service providers.

## Overview

The Cloud Cost database provides a comprehensive solution for:
- **Usage Tracking**: Recording detailed cloud service consumption metrics
- **Cost Management**: Calculating and aggregating service costs by client and time period
- **Invoice Generation**: Automatically generating monthly invoices based on usage data
- **Budget Monitoring**: Tracking client budgets and spending limits

Owner account is managed through a Subscription: Azure for Students
Access is granted for team members and instructor user accounts. 
Control is accomplished by using Identity Access Management and assigning a privileged contributor role to the resource.
The users umgc.edu Microsoft online account is used for authentication and access to resources.
For this project Python generates a devicecode linking the Microsoft online account to a token that is used to connect to the Azure SQL Server.

Server is a logical server through a public endpoint: cmsc495-cloud-cost.database.windows.net
Access control is though IP based firewall rules allowing public address access to the resources

An exception exists to allow Azure services and resources to access the server this option configures the firewall to allow connections from IP addresses allocated to any Azure service or asset, including connections from the subscriptions of other customers.

Authorized users will be allowed to enter IP to firewall rules, owner can also add firewall rules.

Connection to the server can be achieved through:
SQL Server Management Studio
Azure portal query editor
Visual Studio Code
Programming languages such as .NET, Python, and Java

The following steps demonstrate how to connect using VS Code
1. Install SQL Server mssql extension
2. Create a new plain text file (Ctrl+N). In lower right status bar click "Plain Text" and change to SQL or MS SQL
3. Connect to Database, press F1 to open Command Palette. Type "connect" and chose MS SQL:Connect
4. Select create Connection Profile
5. Add Profile Name; Server Name: cmsc495-cloud-cost.database.windows.net; Set Authentication: Microsoft Entra ID; Click "Sign In"
6. Webpage will open; select your UMGC account; Azure account page will open stating: Your account was added successfully!; return to VS Code
7. Enter Database name: CloudCostDatabase; click Connect
8. Successful connection will populate on left Explorer panel showing Connections, and all database tables
9. execute the following query to display the clients table:

SELECT ClientID, ClientName, CreatedDate
FROM dbo.Clients
ORDER BY ClientID;

## Database Tables

### Core Tables

#### **Clients**
Represents the organizations using cloud services.
- `ClientID` (int, PK): Unique client identifier
- `ClientName` (varchar): Name of the client organization
- `CreatedDate` (datetime): Timestamp of record creation

#### **Providers**
Cloud service providers (e.g., AWS, Azure, GCP).
- `ProviderID` (int, PK): Unique provider identifier
- `ProviderName` (varchar): Name of the cloud service provider

#### **Services**
Available cloud services offered by providers.
- `ServiceID` (int, PK): Unique service identifier
- `ServiceName` (varchar): Name of the service
- `ServiceType` (varchar): Category/type of service
- `ServiceCost` (decimal): Cost per unit of service
- `ServiceUnit` (varchar): Unit of measurement (e.g., GB, hours, requests)
- `ProviderID` (int, FK): Associated cloud provider
- `CreatedDate` (datetime): Timestamp of record creation

#### **Usages**
Records of actual cloud service consumption by clients.
- `UsageID` (int, PK): Unique usage record identifier
- `ClientID` (int, FK): Client using the service
- `ServiceID` (int, FK): Service being used
- `UsageDate` (date): Date of usage
- `UsageTime` (time): Time of usage
- `UnitsUsed` (decimal): Number of units consumed (1-50 range in seed data)
- `TotalCost` (decimal): Cost calculated as units × service cost
- `CreatedDate` (datetime): Timestamp of record creation

#### **Invoices**
Monthly billing invoices generated from aggregated usage data.
- `InvoiceID` (int, PK): Unique invoice identifier
- `ClientID` (int, FK): Client being billed
- `InvoiceDate` (date): Last day of the month for the billing period
- `InvoiceAmount` (decimal): Total amount due for the month
- `CreatedDate` (datetime): Timestamp of record creation

#### **Budgets**
Budget tracking and alert settings for clients.
- `BudgetID` (int, PK): Unique budget record identifier
- `ClientID` (int, FK): Associated client
- `BudgetAmount` (decimal): Total budget allocation
- `MonthlyLimit` (decimal): Spending limit per month
- `AlertThreshold` (decimal): Threshold percentage for spending alerts
- `AlertEnabled` (bit): Whether alerts are enabled
- `CreatedDate` (datetime): Timestamp of record creation

## SQL Scripts

### seed_usages.sql
**Purpose**: Populates the Usages table with test data for reporting and analysis.

**Functionality**:
- Generates 40,000 usage records
- Spans from November 1, 2025 to January 25, 2026
- Distributes records across 10 clients (ClientIDs 1001-1010)
- Randomly assigns usage to services based on provider mappings
- Generates random usage dates, times, and unit quantities (1-50 units)
- Calculates total cost for each usage record

**Usage**: Run this script to populate the database with realistic test data for development and testing.

### generate_invoices.sql
**Purpose**: Aggregates monthly usage data and creates monthly invoices.

**Functionality**:
- Groups all usage records by client, provider, year, and month
- Sums total costs for each client-provider-month combination
- Creates invoice records with month-end dates
- Excludes January 2026 invoices (assumed to be in progress)

**Usage**: Run this script after populating usage data to generate corresponding invoice records. Can be scheduled monthly to create invoices from new usage data.

## Data Relationships

```
Providers
    ↓
Services (belongs to Provider)
    ↓
Usages (references Service and Client)
    ↓
Invoices (aggregated from Usages by Client)

Clients
    ↓
Budgets (allocated to Client)

Entity RElationship Diagram - ERD - CloudCostDatabase v2.pptx illustrates these relationships
```

## Usage Example

1. **Load test data**: Run `seed_usages.sql` to populate the Usages table with 40,000 test records
2. **Generate invoices**: Run `generate_invoices.sql` to create monthly invoices from the usage data
3. **Query reports**: Query the database to analyze client spending, usage patterns, and budget compliance

## Notes

- The seed data uses IDs starting at 900001 for UsageID to avoid conflicts with manually-created test records
- Invoice generation excludes the current month (January 2026) to allow for ongoing usage tracking before billing
- Service costs are stored per unit; total usage cost is calculated as `UnitsUsed × ServiceCost`
- All timestamps use the server's local time via `GETDATE()`
- For simulations Usages and Invoices would need to be truncated before generating data
