# Cloud Cost Intelligence Platform

**CMSC 495 Computer Science Capstone — Spring 2026**

## Project Overview

Organizations using multiple cloud providers (AWS, Azure, GCP) often overspend by 30–40% due to unused resources, poor visibility, and fragmented billing. The Cloud Cost Intelligence Platform aggregates cost data across providers, analyzes spending patterns, identifies waste, and delivers actionable optimization recommendations through a unified dashboard.

## Team — The Code Collective

| Name              | Role             | Time Zone |
|-------------------|------------------|-----------|
| Michael Allen     | PM / Tech Lead   | PST       |
| Ishan Akhouri     | Frontend Lead    | EST       |
| Sean Kellner      | Backend Lead     | EST       |
| Tony Arista       | Database Dev     | CET       |
| Bryana Henderson  | Testing / QA     | EST       |

## Tech Stack

| Layer            | Technology                          | Version                    |
|------------------|-------------------------------------|----------------------------|
| Frontend         | HTML / CSS / JavaScript + Chart.js  | Chart.js 4.4.7             |
| Backend          | Python / Flask                      | Python 3.12 / Flask 3.1    |
| Database         | Microsoft SQL Server (Azure SQL)    | Azure SQL Serverless Gen5  |
| Containerization | Docker + nginx reverse proxy        | Docker 29.2.0              |
| Authentication   | Microsoft Entra ID                  | DeviceCodeCredential       |
| Testing          | pytest, Jest, Playwright            | pytest 8.x, Jest 29.7      |

## Features (8 Functional Requirements — All Complete)

| FR    | Feature                    | Status   |
|-------|----------------------------|----------|
| FR-01 | View Cost Dashboard        | Complete |
| FR-02 | View Spending Trends       | Complete |
| FR-03 | Filter by Provider/Service | Complete |
| FR-04 | View Waste Alerts          | Complete |
| FR-05 | View Recommendations       | Complete |
| FR-06 | Export Reports (CSV/PDF)   | Complete |
| FR-07 | Set Budget Thresholds      | Complete |
| FR-08 | View Resource Metrics      | Complete |

## Quick Start

### Prerequisites

- Docker Desktop installed and running
- Azure SQL credentials (provided to team and instructor)
- **Apple Silicon (M1/M2/M3) Macs:** Disable AirPlay Receiver (System Settings → General → AirDrop & Handoff) to free port 5000

### Run the Application

```bash
# 1. Clone the repository
git clone https://github.com/michaelallenus217-lang/CMSC495-CloudCost.git
cd CMSC495-CloudCost

# 2. Create backend environment file
cp src/backend/.env.example src/backend/.env
# Edit src/backend/.env — set these values:
#   AZURE_SQL_SERVER=cmsc495-cloud-cost.database.windows.net
#   AZURE_SQL_DATABASE=CloudCostDatabase
#   FLASK_HOST=0.0.0.0   (required for Docker networking)

# 3. Start containers
#    Intel Macs:
docker compose up --build -d
#    Apple Silicon (M1/M2/M3) Macs:
DOCKER_DEFAULT_PLATFORM=linux/amd64 docker compose up --build -d

# 4. Authenticate with Azure SQL
#    A device code will appear in backend logs:
docker compose logs backend -f
#    Go to https://microsoft.com/devicelogin and enter the code
#    Press Ctrl+C after authentication completes

# 5. Open the dashboard
#    http://localhost:8080
```

### Run Tests

```bash
# JavaScript unit tests (94 tests)
npm test --prefix src/frontend

# Python tests — requires Docker containers running (49 tests)
TEST_API_URL=http://localhost:5000/api/v1 pytest tests/ -v
```

### Stop the Application

```bash
docker compose down
```

## Architecture

Three-tier containerized architecture:

```
Browser ──► nginx (:8080) ──► Flask API (:5000) ──► Azure SQL
              │                      │
         Static Files          REST /api/v1/
         index.html            health.py
         dashboard.js          clients.py
         api.js                providers.py
         analysis.js           services.py
         utils.js              usages.py
         config.js             invoices.py
         style.css             budgets.py (GET + PATCH)
```

nginx serves static frontend files and proxies `/api/*` requests to Flask. Docker Compose orchestrates both containers on a single origin, resolving CORS without backend changes.

## Repository Structure

```
CMSC495-CloudCost/
├── src/
│   ├── backend/           # Flask API (16 files, 1,028 lines)
│   │   ├── routes/v1/     # 7 REST resource endpoints
│   │   ├── api_http/      # Schemas, error handlers, responses
│   │   ├── db/            # SQLAlchemy engine + session management
│   │   └── Dockerfile
│   ├── frontend/          # Dashboard UI (5 JS files, 3,487 lines)
│   │   ├── js/            # api.js, analysis.js, dashboard.js, utils.js, config.js
│   │   ├── css/           # style.css
│   │   ├── __tests__/     # Jest test suites
│   │   └── Dockerfile
│   └── database/          # Schema, seed data, ERD
│       ├── schema.md      # Table definitions
│       ├── seed_usages v2.sql  # 40K+ usage records
│       └── ERD.png        # Entity relationship diagram
├── tests/                 # 49 pytest files (unit, integration, E2E)
├── docs/                  # Project deliverables and meeting notes
├── docker-compose.yml
└── README.md
```

## API Endpoints

All endpoints prefixed with `/api/v1/`

| Method | Endpoint                           | Description                    |
|--------|------------------------------------|--------------------------------|
| GET    | /health                            | Health check                   |
| GET    | /health/db                         | Database connectivity check    |
| GET    | /clients                           | List all clients               |
| GET    | /clients/{id}                      | Get client by ID               |
| GET    | /clients/{id}/budgets              | Client budgets                 |
| GET    | /clients/{id}/invoices             | Client invoices                |
| GET    | /clients/{id}/usages               | Client usage records           |
| GET    | /providers                         | List all providers             |
| GET    | /providers/{id}/services           | Provider services              |
| GET    | /services                          | List all services              |
| GET    | /services/{id}/usages              | Service usage records          |
| GET    | /usages                            | List usage records (date filter)|
| GET    | /budgets                           | List all budgets               |
| GET    | /budgets/{id}                      | Get budget by ID               |
| PATCH  | /budgets/{id}                      | Update budget threshold        |
| GET    | /invoices                          | List all invoices              |

## Test Summary

| Category            | Framework  | Count | Pass | Fail |
|---------------------|------------|-------|------|------|
| Backend Unit Tests  | pytest     | 8     | 8    | 0    |
| Frontend Unit Tests | Jest       | 94    | 94   | 0    |
| Integration Tests   | pytest     | 8     | 8    | 0    |
| E2E / FR Tests      | pytest     | 18    | 18   | 0    |
| Functional Tests    | pytest     | 6     | 6    | 0    |
| API Resource Tests  | pytest     | 9     | 9    | 0    |
| Manual Tests        | Browser    | 50    | 50   | 0    |
| **Total**           |            |**193**|**193**| **0**|

## Documentation

| Document | Location |
|----------|----------|
| Project Plan | `/docs/01_Project_Plan.pdf` |
| Project Design | `/docs/02_Project_Design.pdf` |
| Phase I Report | `/docs/03_Phase_I_Report.pdf` |
| Test Plan Report | `/docs/04_Test_Plan_Report.pdf` |
| Testing & QA Plan | `/docs/Testing_and_QA_Plan.md` |
| Database Schema | `/src/database/schema.md` |
| Database README | `/src/database/README.md` |
| ERD | `/src/database/ERD.png` |
| Manual Testing Log | `/tests/MANUAL_TESTING.pdf` |
| Meeting Notes | `/docs/meeting_notes/` |

## License

UMGC CMSC 495 Capstone Project — Spring 2026
