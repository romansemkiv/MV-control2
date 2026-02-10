from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.routers import auth, users, sources, multiviewers, routing, refresh, integrations, presets

app = FastAPI(title="MV-Control", version="0.1.0")

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(sources.router)
app.include_router(multiviewers.router)
app.include_router(routing.router)
app.include_router(refresh.router)
app.include_router(integrations.router)
app.include_router(presets.router)

static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
