# Italian Railway Performance Analysis

A web application for analyzing Italian train performance data using TrainStats as the single source of truth.

## Tech Stack
- Backend: FastAPI (Python)
- Frontend: React + TypeScript + Vite, Tailwind CSS
- Data source: trainstats.altervista.org
- Deployment: Docker

## Running with Docker

### Backend
```bash
docker pull setarehneshatdoust/railway-opendata-webapp:v1.3
docker run -p 8000:8000 setarehneshatdoust/railway-opendata-webapp:v1.3
```
Then open http://localhost:8000/docs for the interactive API documentation.

### Frontend
```bash
docker pull setarehneshatdoust/railway-frontend:v1.0
docker run -p 3000:80 setarehneshatdoust/railway-frontend:v1.0
```
Then open http://localhost:3000. The backend must also be running (see above) on port 8000, since the frontend calls it directly from the browser.

## Running locally

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Then open the URL Vite prints (usually http://localhost:5173).

## API Endpoints
- `GET /train/relations` — list trains between two stations
- `GET /train/stops` — intermediate stops for a specific train on a specific day, including platform numbers
- `GET /train/history` — stop data across a date range
- `GET /train/details` — daily historical records for a specific train
- `GET /route/stats` — date-range statistics for a route (average delay, cancellation rate, on-time percentage), aggregated across all trains on the route. Optional `train_number` to restrict to one train; optional `include_stations=true` to also aggregate per intermediate station along the route
- `GET /stations` — the full list of station names known to TrainStats, used to power the frontend's search autocomplete
