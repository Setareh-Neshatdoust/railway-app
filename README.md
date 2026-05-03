# Italian Railway Performance Analysis

A web application for analyzing Italian train performance data using TrainStats as the single source of truth.

## Tech Stack
- Backend: FastAPI (Python)
- Data source: trainstats.altervista.org
- Deployment: Docker

## Running with Docker
```bash
docker pull setarehneshatdoust/railway-opendata-webapp:latest
docker compose up
```

## Running locally
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Endpoints
- `GET /train/relations` — list trains between two stations
- `GET /train/stops` — intermediate stops for a train
- `GET /train/history` — stop data across a date range
- `GET /train/details` — daily historical records