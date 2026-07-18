# Italian Railway Performance Analysis

A web application for analyzing Italian train performance data using TrainStats as the single source of truth.

## Tech Stack
- Backend: FastAPI (Python)
- Data source: trainstats.altervista.org
- Deployment: Docker

## Running with Docker
```bash
docker pull setarehneshatdoust/railway-opendata-webapp:v1.1
docker run -p 8000:8000 setarehneshatdoust/railway-opendata-webapp:v1.1
```
Then open http://localhost:8000/docs for the interactive API documentation.

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
- `GET /route/stats` — date-range statistics for a route (average delay, cancellation rate, on-time percentage), aggregated across all trains on the route
