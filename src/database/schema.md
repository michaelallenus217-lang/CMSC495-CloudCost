# Cloud Cost Database Schema

## Budgets
| Column | Type | Nullable |
|--------|------|----------|
| BudgetID | int | NOT NULL |
| ClientID | int | NOT NULL |
| BudgetAmount | decimal | NOT NULL |
| MonthlyLimit | decimal | NOT NULL |
| AlertThreshold | decimal | NOT NULL |
| AlertEnabled | bit | NOT NULL |
| CreatedDate | datetime | NOT NULL |

## Clients
| Column | Type | Nullable |
|--------|------|----------|
| ClientID | int | NOT NULL |
| ClientName | varchar | NOT NULL |
| CreatedDate | datetime | NOT NULL |

## Invoices
| Column | Type | Nullable |
|--------|------|----------|
| InvoiceID | int | NOT NULL |
| ClientID | int | NOT NULL |
| InvoiceDate | date | NOT NULL |
| InvoiceAmount | decimal | NOT NULL |
| CreatedDate | datetime | NOT NULL |

## Providers
| Column | Type | Nullable |
|--------|------|----------|
| ProviderID | int | NOT NULL |
| ProviderName | varchar | NOT NULL |

## Services
| Column | Type | Nullable |
|--------|------|----------|
| ServiceID | int | NOT NULL |
| ServiceName | varchar | NOT NULL |
| ServiceType | varchar | NOT NULL |
| ServiceCost | decimal | NOT NULL |
| ProviderID | int | NOT NULL |
| CreatedDate | datetime | NOT NULL |
| ServiceUnit | varchar | NOT NULL |

## Usages
| Column | Type | Nullable |
|--------|------|----------|
| UsageID | int | NOT NULL |
| ClientID | int | NOT NULL |
| ServiceID | int | NOT NULL |
| UsageDate | date | NOT NULL |
| UsageTime | time | NOT NULL |
| UnitsUsed | decimal | NOT NULL |
| TotalCost | decimal | NOT NULL |
| CreatedDate | datetime | NOT NULL |
