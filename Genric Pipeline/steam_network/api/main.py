"""FastAPI application factory + in-memory network state."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from ..core.graph_engine import GraphEngine
from ..core.thermodynamics import Thermo
from ..core.solver import NetworkSolver

STATIC_DIR = Path(__file__).parent / "static"


@dataclass
class NetworkState:
    engine: GraphEngine = field(default_factory=GraphEngine)
    thermo: Thermo = field(default_factory=Thermo)
    solver: Optional[NetworkSolver] = None

    def fresh_solver(self) -> NetworkSolver:
        self.solver = NetworkSolver(self.engine, self.thermo)
        return self.solver


_STATE = NetworkState()


def get_state() -> NetworkState:
    return _STATE


def create_app() -> FastAPI:
    app = FastAPI(
        title="Steam Network Engine",
        version="0.1.0",
        description="Graph-based steam network simulator and optimizer.",
    )
    from .routes import router
    app.include_router(router)

    if STATIC_DIR.exists():
        app.mount("/ui", StaticFiles(directory=STATIC_DIR, html=True), name="ui")

        @app.get("/", include_in_schema=False)
        def _root():
            return FileResponse(STATIC_DIR / "index.html")

    return app


app = create_app()
