# Backend

Python API application.

## Setup & Run

Regardless of your setup method, you will **need** to set up your .env file first. Copy the example file and fill in
real values:

```
cp src/backend/.env.example src/backend/.env
```

### Docker

#### Docker: Initial Setup

The project contains a docker-compose.yml file in the root, which will start up the backend and the frontend servers.
From the project root, you can set up and start the docker containers using the command:

```
docker compose up --build
```

#### Docker: Running

After your initial setup, you can re-start the docker containers using the command:

```
docker compose up
```

Upon the back end starting up, you will be prompted to visit https://microsoft.com/devicelogin and provide a code in
order to authenticate the backend with the Azure hosted database. You may be reprompted a second time on startup,
and additional times if you make any changes to the backed python code. Without being authenticated, the backend
cannot access the database.

### Manual Install

#### Manual: Install Python dependencies

Python dependencies are listed in requirements.txt

```
pip install --no-cache-dir -r src/backend/requirements.txt
```

#### Manual: ODBC driver prerequisite

This backend uses pyodbc, which requires a native SQL Server ODBC driver:

- ODBC Driver 18 for SQL Server

### Manual: Running

From the repository root:

```
cd src  
python -m backend.wsgi
```

The API listens on FLASK_HOST:FLASK_PORT (default 127.0.0.1:5000).  
On first database access, a browser window may open for Azure login.

## Quick checks

These health check endpoints can be used to check the status of the back end:

- GET /api/v1/health  
- GET /api/v1/health/db

You can simply view them in a web browser for convenience as well:

- http://{FLASK_HOST}:{FLASK_PORT}/api/v1/health
- http://{FLASK_HOST}:{FLASK_PORT}/api/v1/health/db

## API Endpoints (WIP)

# API Endpoints (Summary)

## Pagination
- `limit` (int, default `10`, min `1`, max `1000`): number of items returned
- `page` (int, default `1`, min `1`): 1-indexed page number

## Date-range filtering
- `start_date` (date `YYYY-MM-DD`, optional)
- `end_date` (date `YYYY-MM-DD`, optional)
- Constraint: if both provided, `start_date <= end_date`

---

### /api/v1/budgets
- **GET**
  - Query params: `limit`, `page`

### /api/v1/budgets/{budgetId}
- **GET**
- **PATCH**
  - Expects JSON object in the form (each field is optional):
  ```
  {
    "alert_enabled": false,
    "alert_threshold": "0.00",
    "budget_amount": "0.00",
    "monthly_limit": "1100.00"
  }
  ```

### /api/v1/clients
- **GET**
  - Query params: `limit`, `page`

### /api/v1/clients/{clientId}
- **GET**

### /api/v1/clients/{clientId}/budgets
- **GET**
  - Query params: `limit`, `page`

### /api/v1/clients/{clientId}/budgets/{budgetId}
- **GET**
  - Query params: `limit`, `page`

### /api/v1/clients/{clientId}/invoices
- **GET**
  - Query params: `limit`, `page`, `start_date`, `end_date`

### /api/v1/clients/{clientId}/invoices/{invoiceId}
- **GET**

### /api/v1/clients/{clientId}/usages
- **GET**
  - Query params: `limit`, `page`, `start_date`, `end_date`

### /api/v1/clients/{clientId}/usages/{usageId}
- **GET**

### /api/v1/invoices
- **GET**
  - Query params: `limit`, `page`, `start_date`, `end_date`

### /api/v1/invoices/{invoiceId}
- **GET**

### /api/v1/providers
- **GET**
  - Query params: `limit`, `page`

### /api/v1/providers/{providerId}
- **GET**

### /api/v1/providers/{providerId}/services
- **GET**
  - Query params: `limit`, `page`

### /api/v1/providers/{providerId}/services/{serviceId}
- **GET**

### /api/v1/services
- **GET**
  - Query params: `limit`, `page`

### /api/v1/services/{serviceId}
- **GET**

### /api/v1/services/{serviceId}/usages
- **GET**
  - Query params: `limit`, `page`, `start_date`, `end_date`

### /api/v1/services/{serviceId}/usages/{usageId}
- **GET**

### /api/v1/usages
- **GET**
  - Query params: `limit`, `page`, `start_date`, `end_date`

### /api/v1/usages/{usageId}
- **GET**