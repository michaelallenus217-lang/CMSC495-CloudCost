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

### /api/v1/health
GET

### /api/v1/health/db
GET

### /api/v1/clients
GET

### /api/v1/clients/{clientId}
GET

### /api/v1/clients/{clientId}/budget
GET

### /api/v1/clients/{clientId}/invoices
GET

### /api/v1/clients/{clientId}/invoices/{invoiceId}
GET

### /api/v1/clients/{clientId}/usage
GET

### /api/v1/clients/{clientId}/usage/{usageId}
GET

### /api/v1/providers
GET

### /api/v1/providers/{providerId}
GET

### /api/v1/providers/{providerId}/services
GET

### /api/v1/providers/{providerId}/services/{serviceId}
GET

### /api/v1/services
GET

### /api/v1/services/{serviceId}
GET

### /api/v1/services/{serviceId}/usage
GET

### /api/v1/services/{serviceId}/usage/{usageId}
GET