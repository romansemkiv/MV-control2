import logging
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from app.routers import auth, users, sources, multiviewers, routing, refresh, integrations, presets

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

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
    # Mount static files (JS, CSS, assets)
    app.mount("/assets", StaticFiles(directory=str(static_dir / "assets")), name="assets")

    # SPA fallback: serve index.html for all non-API routes
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # If it's an API route that doesn't exist, let FastAPI handle 404
        if full_path.startswith("api/"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")

        # For all other routes (/, /admin, /main, etc.), serve index.html
        index_path = static_dir / "index.html"
        if index_path.exists():
            return FileResponse(index_path)

        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Frontend not built")
