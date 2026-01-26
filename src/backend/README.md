# Backend

Python API application.

## Initial Setup

### Install Python dependencies

```
pip install flask sqlalchemy pyodbc azure-identity python-dotenv
```

### Configure .env

Copy the example file and fill in real values:

```
cp src/backend/.env.example src/backend/.env
```

### ODBC driver prerequisite

This backend uses pyodbc, which requires a native SQL Server ODBC driver:

- ODBC Driver 18 for SQL Server

## Starting the server

From the repository root:

```
cd src  
python -m backend.wsgi
```

The API listens on FLASK_HOST:FLASK_PORT (default 127.0.0.1:5000).  
On first database access, a browser window may open for Azure login.

### Quick checks

These health check endpoints can be used to check the status of the back end:

- GET /api/v1/health  
- GET /api/v1/health/db

You can simply view them in a web browser for convenience as well:

- http://{FLASK_HOST}:{FLASK_PORT}/api/v1/health
- http://{FLASK_HOST}:{FLASK_PORT}/api/v1/health/db

## API Endpoints (WIP)

### /api/v1/health
GET

### /api/v1/health/db
GET

### /api/v1/clients
GET, POST

### /api/v1/clients/{clientId}
GET, PUT, PATCH, DELETE

### /api/v1/clients/{clientId}/budget
GET, PUT, PATCH, DELETE

### /api/v1/clients/{clientId}/invoices
GET, POST

### /api/v1/clients/{clientId}/invoices/{invoiceId}
GET, PUT, PATCH, DELETE

### /api/v1/clients/{clientId}/usage
GET, POST

### /api/v1/clients/{clientId}/usage/{usageId}
GET, PUT, PATCH, DELETE

### /api/v1/providers
GET, POST

### /api/v1/providers/{providerId}
GET, PUT, PATCH, DELETE

### /api/v1/providers/{providerId}/services
GET, POST

### /api/v1/providers/{providerId}/services/{serviceId}
GET, PUT, PATCH, DELETE

### /api/v1/services
GET, POST

### /api/v1/services/{serviceId}
GET, PUT, PATCH, DELETE

### /api/v1/services/{serviceId}/usage
GET, POST

### /api/v1/services/{serviceId}/usage/{usageId}
GET, PUT, PATCH, DELETE