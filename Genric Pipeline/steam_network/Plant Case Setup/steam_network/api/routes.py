"""HTTP routes for the steam network engine."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from ..components import (
    SteamHeader, SteamSource, SteamConsumer, PRDS, Turbine, Condenser, Valve,
    CondensateReturn, Deaerator, FlashDrum, Vent, MakeupWater, Pump, Attemperator,
)
from ..core.exceptions import SteamNetworkError
from ..models.enums import ComponentType
from ..models.schemas import (
    ComponentCreate, ConnectionCreate, NetworkExport, SolveResult,
    HeaderSpec, SourceSpec, ConsumerSpec, PRDSSpec, TurbineSpec, CondenserSpec, ValveSpec,
    DeaeratorSpec, FlashDrumSpec, VentSpec, MakeupWaterSpec, PumpSpec, AttemperatorSpec,
)
from .main import NetworkState, get_state

router = APIRouter(prefix="/api/v1", tags=["network"])

# Report output directory — lives next to the package root.
from pathlib import Path as _Path
_REPORT_DIR = _Path(__file__).resolve().parent.parent.parent / "reports_output"


# ---- factory -------------------------------------------------------------
def _instantiate(payload: ComponentCreate):
    t = payload.type
    spec = payload.spec
    if t == ComponentType.HEADER:
        return SteamHeader(HeaderSpec(**spec))
    if t == ComponentType.SOURCE:
        return SteamSource(SourceSpec(**spec))
    if t == ComponentType.CONSUMER:
        return SteamConsumer(ConsumerSpec(**spec))
    if t == ComponentType.PRDS:
        return PRDS(PRDSSpec(**spec))
    if t == ComponentType.TURBINE:
        return Turbine(TurbineSpec(**spec))
    if t == ComponentType.CONDENSER:
        return Condenser(CondenserSpec(**spec))
    if t == ComponentType.VALVE:
        return Valve(ValveSpec(**spec))
    if t == ComponentType.CONDENSATE_RETURN:
        return CondensateReturn(**spec)
    if t == ComponentType.DEAERATOR:
        return Deaerator(DeaeratorSpec(**spec))
    if t == ComponentType.FLASH_DRUM:
        return FlashDrum(FlashDrumSpec(**spec))
    if t == ComponentType.VENT:
        return Vent(VentSpec(**spec))
    if t == ComponentType.MAKEUP_WATER:
        return MakeupWater(MakeupWaterSpec(**spec))
    if t == ComponentType.PUMP:
        return Pump(PumpSpec(**spec))
    if t == ComponentType.ATTEMPERATOR:
        return Attemperator(AttemperatorSpec(**spec))
    raise HTTPException(400, f"Unsupported component type: {t}")


# ---- endpoints -----------------------------------------------------------
@router.post("/components", response_model=dict)
def create_component(
    payload: ComponentCreate,
    state: NetworkState = Depends(get_state),
):
    try:
        comp = _instantiate(payload)
        state.engine.add_component(comp)
    except HTTPException:
        raise
    except SteamNetworkError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        # Surface the real error to the UI instead of a generic 500.
        import traceback
        tb = traceback.format_exc(limit=2)
        raise HTTPException(
            400,
            f"{type(e).__name__}: {e}\n--- payload ---\n"
            f"type={payload.type}, spec={payload.spec}\n"
            f"--- trace ---\n{tb}",
        )
    return {"id": comp.id, "name": comp.name, "type": comp.component_type.value}


@router.delete("/components/{component_id}")
def delete_component(component_id: str, state: NetworkState = Depends(get_state)):
    try:
        state.engine.remove_component(component_id)
    except SteamNetworkError as e:
        raise HTTPException(404, str(e))
    return {"deleted": component_id}


@router.patch("/components/{component_id}", response_model=dict)
def update_component(
    component_id: str,
    payload: ComponentCreate,
    state: NetworkState = Depends(get_state),
):
    """Replace the spec of an existing component, preserving its id and edges.

    The new spec must produce the same `ComponentType` and a port set
    compatible with the current edges (otherwise edges referencing a removed
    port are dropped, returned in `dropped_edges`).
    """
    if component_id not in state.engine.components:
        raise HTTPException(404, f"Unknown component {component_id!r}")
    old = state.engine.components[component_id]
    if payload.type != old.component_type:
        raise HTTPException(400,
            f"Cannot change type ({old.component_type.value} -> {payload.type.value}).")

    # Capture existing edges so we can restore them after replacement.
    in_edges = [
        (u, k, d["data"]) for u, _, k, d in
        state.engine.graph.in_edges(component_id, keys=True, data=True)
    ]
    out_edges = [
        (v, k, d["data"]) for _, v, k, d in
        state.engine.graph.out_edges(component_id, keys=True, data=True)
    ]

    # Build new instance.
    try:
        new = _instantiate(payload)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"{type(e).__name__}: {e}")
    new.id = component_id

    # Swap into the engine: remove old, add new (which preserves id).
    state.engine.remove_component(component_id)
    state.engine.components[component_id] = new
    state.engine.graph.add_node(component_id, component=new)

    # Re-wire edges, dropping any whose port no longer exists.
    dropped: list[str] = []
    for u, _k, edge in in_edges:
        if edge.to_port not in new.ports:
            dropped.append(f"{u}.{edge.from_port} → {component_id}.{edge.to_port}")
            continue
        try:
            state.engine.connect_nodes(
                from_id=u, to_id=component_id,
                from_port=edge.from_port, to_port=edge.to_port,
                pressure_bar=edge.pressure_bar, nominal_flow_tph=edge.nominal_flow_tph,
            )
        except Exception as e:
            dropped.append(f"{u}.{edge.from_port} → {component_id}.{edge.to_port} ({e})")
    for v, _k, edge in out_edges:
        dn = state.engine.components.get(v)
        if dn is None or edge.from_port not in new.ports:
            dropped.append(f"{component_id}.{edge.from_port} → {v}.{edge.to_port}")
            continue
        try:
            state.engine.connect_nodes(
                from_id=component_id, to_id=v,
                from_port=edge.from_port, to_port=edge.to_port,
                pressure_bar=edge.pressure_bar, nominal_flow_tph=edge.nominal_flow_tph,
            )
        except Exception as e:
            dropped.append(f"{component_id}.{edge.from_port} → {v}.{edge.to_port} ({e})")

    return {
        "updated": component_id,
        "name": new.name,
        "type": new.component_type.value,
        "dropped_edges": dropped,
    }


@router.post("/connections", response_model=dict)
def create_connection(
    payload: ConnectionCreate,
    state: NetworkState = Depends(get_state),
):
    if payload.port is None:
        raise HTTPException(400, "Connection requires `port` (must encode 'from_port:to_port').")
    try:
        from_port, to_port = payload.port.split(":")
    except ValueError:
        raise HTTPException(400, "`port` must be 'from_port:to_port' (e.g. 'out:in').")
    try:
        key = state.engine.connect_nodes(
            from_id=payload.from_id,
            to_id=payload.to_id,
            from_port=from_port,
            to_port=to_port,
            pressure_bar=payload.pressure_bar,
            nominal_flow_tph=payload.nominal_flow_tph,
        )
    except SteamNetworkError as e:
        raise HTTPException(400, str(e))
    return {"key": key}


@router.delete("/connections")
def delete_connection(
    from_id: str, to_id: str, key: str | None = None,
    state: NetworkState = Depends(get_state),
):
    try:
        state.engine.disconnect_nodes(from_id, to_id, key=key)
    except SteamNetworkError as e:
        raise HTTPException(404, str(e))
    return {"disconnected": [from_id, to_id, key]}


@router.post("/solve", response_model=SolveResult)
def solve_network(state: NetworkState = Depends(get_state)):
    solver = state.fresh_solver()
    try:
        result = solver.solve()
    except SteamNetworkError as e:
        raise HTTPException(400, str(e))

    # Auto-generate live reports (Word + Excel) in background-safe fashion.
    try:
        from ..reports.live_report import generate_reports
        generate_reports(state.engine, result, output_dir=_REPORT_DIR)
    except Exception:
        import traceback
        traceback.print_exc()  # non-fatal; don't break solve

    return result


@router.get("/topology", response_model=NetworkExport)
def export_topology(state: NetworkState = Depends(get_state)):
    data = state.engine.to_dict()
    return NetworkExport(nodes=data["nodes"], edges=data["edges"], metadata={})


@router.post("/reset")
def reset_network(state: NetworkState = Depends(get_state)):
    state.engine.graph.clear()
    state.engine.components.clear()
    state.solver = None
    return {"reset": True}


@router.patch("/components/{component_id}/operating", response_model=dict)
def update_operating(
    component_id: str,
    payload: dict,
    state: NetworkState = Depends(get_state),
):
    """Update *only* operating (live) values on a component without touching its design spec.

    Intended for SCADA/PI tag pushes. Currently supported keys:
        actual_flow_tph (float)
    """
    if component_id not in state.engine.components:
        raise HTTPException(404, f"Unknown component {component_id!r}")
    comp = state.engine.components[component_id]
    spec = getattr(comp, "spec", None)
    if spec is None:
        raise HTTPException(400, "Component has no editable spec.")

    updated = {}
    for k, v in payload.items():
        if not hasattr(spec, k):
            raise HTTPException(400, f"Spec has no field {k!r}")
        # Validate via Pydantic by constructing a dict-merged copy.
        try:
            merged = spec.model_copy(update={k: v})
            type(spec).model_validate(merged.model_dump())
        except Exception as e:
            raise HTTPException(400, f"Invalid value for {k!r}: {e}")
        setattr(spec, k, v)
        updated[k] = v
    return {"updated": component_id, "values": updated}


@router.post("/import")
def import_topology(
    payload: dict,
    state: NetworkState = Depends(get_state),
):
    """Replace the in-memory network from a previously exported topology JSON.

    Expects {"nodes": [...], "edges": [...]} as produced by GET /topology.
    Each node must include enough information to reconstruct it; we attempt
    to recover the spec from `metadata.spec` first, then from heuristics.
    """
    nodes = payload.get("nodes") or []
    edges = payload.get("edges") or []

    # Wipe current state.
    state.engine.graph.clear()
    state.engine.components.clear()
    state.solver = None

    nodes_added = 0
    edges_added = 0
    errors: list[str] = []

    # Build a per-node import. The current export does not embed the full Pydantic
    # spec, so we reconstruct from ports + name + type. Future-proof: if a node
    # carries `metadata.spec`, prefer that.
    for n in nodes:
        try:
            ntype = ComponentType(n["type"])
            spec = (n.get("metadata") or {}).get("spec")
            if spec is None:
                spec = _infer_spec(n)
            comp = _instantiate(ComponentCreate(type=ntype, spec=spec))
            comp.id = n["id"]                         # preserve ids so edges work
            state.engine.add_component(comp)
            nodes_added += 1
        except Exception as e:
            errors.append(f"node {n.get('id')!r}: {e}")

    for e in edges:
        try:
            state.engine.connect_nodes(
                from_id=e["from"],
                to_id=e["to"],
                from_port=e["from_port"],
                to_port=e["to_port"],
                pressure_bar=e.get("pressure_bar"),
                nominal_flow_tph=e.get("nominal_flow_tph"),
            )
            edges_added += 1
        except Exception as ex:
            errors.append(f"edge {e.get('from')}->{e.get('to')}: {ex}")

    return {
        "nodes_added": nodes_added,
        "edges_added": edges_added,
        "errors": errors,
    }


def _infer_spec(node: dict) -> dict:
    """Best-effort spec reconstruction from an exported node."""
    t = node["type"]
    name = node.get("name", "imported")
    ports = node.get("ports") or []
    p_by_name = {p["name"]: p for p in ports}

    def lvl_of(port):
        return p_by_name.get(port, {}).get("header_level")

    if t == "header":
        port = ports[0] if ports else {}
        return {
            "level": port.get("header_level", "MP"),
            "pressure_bar": port.get("nominal_pressure_bar") or 10.0,
        }
    if t == "source":
        port = p_by_name.get("out", {})
        return {
            "name": name,
            "header_level": port.get("header_level", "VHP"),
            "capacity_tph": 200.0,
            "pressure_bar": port.get("nominal_pressure_bar") or 100.0,
            "temperature_c": 500.0,
        }
    if t == "consumer":
        return {
            "name": name,
            "header_level": lvl_of("in") or "MP",
            "demand_tph": 50.0,
        }
    if t == "prds":
        return {
            "name": name,
            "from_level": lvl_of("in") or "HP",
            "to_level": lvl_of("out") or "MP",
            "max_capacity_tph": 60.0,
        }
    if t == "valve":
        return {
            "name": name,
            "from_level": lvl_of("in") or "HP",
            "to_level": lvl_of("out") or "MP",
            "max_flow_tph": 50.0,
        }
    if t == "turbine":
        ext_levels = [p["header_level"] for p in ports
                      if p["name"].startswith("extraction_") and p.get("header_level")]
        return {
            "name": name,
            "mode": "extraction_condensing" if ext_levels else "backpressure",
            "inlet_level": lvl_of("in") or "VHP",
            "exhaust_level": lvl_of("exhaust"),
            "extraction_levels": ext_levels,
            "inlet_flow_tph": 100.0,
            "condenser_pressure_bar": 0.10,
        }
    if t == "condenser":
        port = p_by_name.get("in", {})
        return {
            "name": name,
            "pressure_bar": port.get("nominal_pressure_bar") or 0.10,
            "capacity_tph": 80.0,
        }
    if t == "deaerator":
        return {"name": name, "capacity_tph": 200.0}
    if t == "flash_drum":
        return {
            "name": name,
            "upstream_pressure_bar": p_by_name.get("in", {}).get("nominal_pressure_bar") or 18.0,
            "flash_pressure_bar": p_by_name.get("vapor_out", {}).get("nominal_pressure_bar") or 4.5,
            "capacity_tph": 60.0,
        }
    if t == "vent":
        return {"name": name, "header_level": lvl_of("in") or "LP", "max_flow_tph": 20.0}
    if t == "makeup_water":
        return {"name": name, "flow_tph": 30.0}
    if t == "pump":
        return {
            "name": name,
            "suction_pressure_bar": p_by_name.get("in", {}).get("nominal_pressure_bar") or 1.2,
            "discharge_pressure_bar": p_by_name.get("out", {}).get("nominal_pressure_bar") or 110.0,
            "flow_tph": 200.0,
        }
    if t == "attemperator":
        return {
            "name": name,
            "header_level": lvl_of("in") or "HP",
            "target_temperature_c": 380.0,
            "max_flow_tph": 150.0,
        }
    if t == "condensate_return":
        return {"name": name, "return_pressure_bar": 2.0}
    raise ValueError(f"Cannot infer spec for type {t!r}")


@router.get("/debug/state")
def debug_state(state: NetworkState = Depends(get_state)):
    """Full dump of the in-memory network state — for debugging only."""
    comps = []
    for cid, comp in state.engine.components.items():
        spec = getattr(comp, "spec", None)
        comps.append({
            "id": cid,
            "name": comp.name,
            "type": comp.component_type.value,
            "class": type(comp).__name__,
            "module": type(comp).__module__,
            "spec": spec.model_dump() if spec is not None and hasattr(spec, "model_dump") else None,
            "ports": list(comp.ports.keys()),
            "metadata": comp.metadata,
        })
    return {
        "components_total": len(state.engine.components),
        "edges_total": state.engine.graph.number_of_edges(),
        "components": comps,
    }


@router.get("/reports/excel")
def download_excel_report():
    """Download the latest auto-generated Excel report."""
    fpath = _REPORT_DIR / "Steam_Network_Report.xlsx"
    if not fpath.exists():
        raise HTTPException(404, "No Excel report generated yet. Run Solve first.")
    from fastapi.responses import FileResponse
    return FileResponse(
        path=str(fpath),
        filename="Steam_Network_Report.xlsx",
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


@router.get("/reports/word")
def download_word_report():
    """Download the latest auto-generated Word report."""
    fpath = _REPORT_DIR / "Steam_Network_Report.docx"
    if not fpath.exists():
        raise HTTPException(404, "No Word report generated yet. Run Solve first.")
    from fastapi.responses import FileResponse
    return FileResponse(
        path=str(fpath),
        filename="Steam_Network_Report.docx",
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.get("/reports/status")
def report_status():
    """Check if reports have been generated and their timestamps."""
    xlsx = _REPORT_DIR / "Steam_Network_Report.xlsx"
    docx = _REPORT_DIR / "Steam_Network_Report.docx"
    import datetime
    def _info(p):
        if not p.exists():
            return None
        stat = p.stat()
        return {
            "path": str(p),
            "size_kb": round(stat.st_size / 1024, 1),
            "modified": datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
        }
    return {"excel": _info(xlsx), "word": _info(docx)}


@router.post("/demo/refinery")
def load_demo_refinery(state: NetworkState = Depends(get_state)):
    """Replace the in-memory network with the bundled demo refinery."""
    from ..demo.refinery_demo import build_refinery_network
    eng = build_refinery_network()
    state.engine.graph = eng.graph
    state.engine.components = eng.components
    state.solver = None
    return {
        "loaded": "refinery_demo",
        "components": len(state.engine.components),
        "edges": state.engine.graph.number_of_edges(),
    }


@router.post("/bulk/upload-csv", response_model=dict)
async def bulk_upload_csv(
    file: UploadFile = File(...),
    state: NetworkState = Depends(get_state),
):
    import csv
    import io
    content = await file.read()
    stream = io.StringIO(content.decode("utf-8"))
    reader = csv.DictReader(stream)

    updated_counts = {"components": 0, "parameters": 0}
    errors = []

    for row in reader:
        cid = row.get("component_id")
        param = row.get("parameter")
        val_str = row.get("value")

        if not cid or not param or val_str is None or val_str == "":
            continue

        if cid not in state.engine.components:
            errors.append(f"Row {reader.line_num}: Unknown component {cid}")
            continue

        try:
            val = float(val_str)
            comp = state.engine.components[cid]
            spec = getattr(comp, "spec", None)

            # Special handling for turbine extraction flows: "extraction_{level}_flow"
            if comp.component_type == ComponentType.TURBINE and param.startswith("extraction_") and param.endswith("_flow"):
                level_str = param.replace("extraction_", "").replace("_flow", "")
                if level_str in spec.extraction_levels:
                    idx = spec.extraction_levels.index(level_str)
                    new_flows = list(spec.extraction_flows_tph)
                    while len(new_flows) <= idx: new_flows.append(0.0)
                    new_flows[idx] = val
                    spec.extraction_flows_tph = new_flows
                    updated_counts["parameters"] += 1
                else:
                    errors.append(f"Row {reader.line_num}: Turbine {cid} has no extraction at level {level_str}")

            # Standard parameter update
            elif hasattr(spec, param):
                setattr(spec, param, val)
                updated_counts["parameters"] += 1
            else:
                errors.append(f"Row {reader.line_num}: Component {cid} has no parameter {param}")

        except ValueError:
            errors.append(f"Row {reader.line_num}: Invalid numeric value {val_str!r}")
        except Exception as e:
            errors.append(f"Row {reader.line_num}: {e}")

    return {
        "status": "partial" if errors else "ok",
        "updated_parameters": updated_counts["parameters"],
        "errors": errors
    }
