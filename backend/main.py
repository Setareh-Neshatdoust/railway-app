from pathlib import Path

import requests
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse

from app.routers import health, route, stations, trains

# The API: the same endpoints as before (/route/stats, /stations, ...)
api = FastAPI(title="Italian railway performance API")

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# TrainStats did not answer (offline, too slow, connection refused): a clear message instead of a crash
@api.exception_handler(requests.RequestException)
def trainstats_unreachable(request: Request, exc: requests.RequestException):
    return JSONResponse(
        status_code=502,
        content={"detail": "TrainStats, the data source, did not answer. Please try again in a few minutes."},
    )


api.include_router(health.router)
api.include_router(trains.router)
api.include_router(route.router)
api.include_router(stations.router)


STATIC_DIR = Path(__file__).parent / "static"

if STATIC_DIR.is_dir():
    # One server for everything: the API under /api, the web app everywhere else
    app = FastAPI()
    app.mount("/api", api)

    @app.get("/{path:path}")
    def frontend(path: str):
        file = (STATIC_DIR / path).resolve()
        if file.is_file() and file.is_relative_to(STATIC_DIR.resolve()):
            return FileResponse(file)  # a real file: index.html, the JavaScript, the CSS, favicon.svg
        return FileResponse(STATIC_DIR / "index.html")  # a page of the app (/train, /segment, ...): React decides
else:
    # Development: only the API, the frontend runs separately with npm run dev
    app = api