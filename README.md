# Italian Railway Performance

A web application that answers one question: **how punctual were the trains between two
stations over a period of your choice?**

It reads the historical records collected by the community website
[TrainStats](https://trainstats.altervista.org) at the moment of each request, without a
local database, and computes the on-time rate, the average delay and the cancellation
rate for a route, for each train, for each station along the line and for each day.

Developed as a Master's thesis at Politecnico di Torino (DAUIN), supervised by
Prof. Antonio Vetrò.


## What it does

- **Two ways to search.** *Whole journey*: the trains that start at the origin and end at
  the destination. *By stops*: every train that stopped at both stations, wherever it
  started or ended.
- **Three indicators**, each explained where it is shown:
  - *On-time rate*: the share of trips that arrived at most 5 minutes late. Cancelled
    trips and trips without a recorded arrival are not counted.
  - *Average arrival delay*, in minutes. An early arrival counts as a negative delay.
  - *Cancellation rate*: the share of trips that TrainStats marks as cancelled.
- **Four levels of detail**: the route, each train, each station along the line, and the
  stop table of one train on one day.
- **Three interactive charts**: on-time rate by train, delay by day, and arrival and
  departure delay along the route. Pointing at a bar shows its numbers; clicking it opens
  the train, the day or the station.
- **Transparency about the data.** A time that was never recorded (`n.d.`), a cancelled
  stop (`X`) and anything TrainStats did not send are shown, not hidden.
- **Exports**: every table in CSV and every result in JSON.
- Light and dark theme, Italian date format, usable on a phone.

## Run it

You only need [Docker](https://www.docker.com/). One image contains the whole
application, for Intel/AMD and for Apple Silicon:

```bash
docker run -p 8000:8000 setarehneshatdoust/railway-opendata-webapp:v2.2
```

Then open <http://localhost:8000>. The API is under <http://localhost:8000/api>
(interactive documentation at <http://localhost:8000/api/docs>).

The application needs an internet connection, because it asks TrainStats for the data at
every search.

## Run it for development

Backend (Python 3.12 or newer):

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Frontend (Node.js 22 or newer), in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open the address that Vite prints (usually <http://localhost:5173>). In development
the API has no `/api` prefix: <http://localhost:8000/docs>.

To build the Docker image yourself, from the root of the repository:

```bash
docker build -t railway-app .
docker run -p 8000:8000 railway-app
```

## How it is built

```
Browser (React)  ──JSON──►  Backend (FastAPI)  ──HTTP──►  TrainStats
                 ◄─numbers─                    ◄─HTML, JS, JSON─
```

| Part | Technology |
|---|---|
| Backend | Python, FastAPI, requests, Beautiful Soup |
| Frontend | React, TypeScript, Vite, Tailwind CSS, Observable Plot |
| Delivery | one Docker image; the backend also serves the built frontend |

The backend has four layers: **routers** (receive the requests), **services** (the only
code that contacts TrainStats), **parsing** (turns HTML, JavaScript and JSON into
records) and **statistics** (computes the indicators). The browser never contacts
TrainStats directly.

```
backend/
  main.py            the server: API under /api, built frontend everywhere else
  app/routers/       endpoints
  app/services/      requests to TrainStats
  app/utils/         parsing, statistics, dates
  scripts/           tools used for the evaluation (not part of the application)
frontend/
  src/pages/         the four pages
  src/components/    tables, charts, forms
  src/api/           the only code that calls the backend
Dockerfile           builds the frontend, then the image that serves everything
```

## API

All endpoints take plain parameters in the address and answer in JSON. Dates are written
as `YYYY-MM-DD`. In the Docker image they are under `/api`.

| Endpoint | Answer |
|---|---|
| `GET /route/stats` | *Whole journey*: summary, one row per train and per day and, with `include_stations=true`, one row per station. With `train_number`, the same for one train. |
| `GET /route/segment` | *By stops*: summary and one row per train and per day, for every train that stopped at both stations. |
| `GET /route/direct-train` | Whether the relation is still served, and the date of its last record. |
| `GET /stations` | The names of all stations. |
| `GET /stations/destinations` | The destinations recorded for an origin. |
| `GET /train/stops` | The stop table of one train on one day, with platforms. |
| `GET /train/relations` | The trains recorded between two stations. |
| `GET /train/details` | The daily records of one train. |
| `GET /train/history` | The stop tables of one train over a period. |
| `GET /health` | Whether the server is running. |

Errors: `400` for invalid parameters, `404` when TrainStats has no data for the request,
`502` when TrainStats did not answer. When it answered only in part, the result lists
what is missing.

## Data source and limits

All numbers come from [TrainStats](https://trainstats.altervista.org), a community
website that saves every day the data of ViaggiaTreno, the official real-time system of
Trenitalia and RFI. This project is not affiliated with TrainStats, Trenitalia or RFI.

- TrainStats has no documented interface. If its pages change, the parsing code must be
  adapted.
- No data are stored, so the application depends on TrainStats being reachable.
- The application sends at most six requests at a time, to avoid overloading a free
  community service. Please use it with the same care.
- Some times are never recorded at some stations (`n.d.`); those stations have no arrival
  delay.
- Periods are limited to one year.

## Author

Setareh Neshatdoust — Master's thesis, Politecnico di Torino, 2026.
Supervisor: Prof. Antonio Vetrò.

## Licence

See [LICENSE](LICENSE). The licence covers the code of this repository, not the data,
which belong to their sources.
