import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.clients.nexx import NEXXClient
from app.clients.quartz import QuartzClient
from app.models.multiviewer import Multiviewer
from app.models.source import Source
from app.models.state import StateMV, StateWindow, StateRouting

VARID_ENABLED_MVS = "2702"
VARID_MV_LAYOUT = "2704"
VARID_MV_FONT = "2716"
VARID_MV_OUTER_BORDER = "2726"
VARID_MV_INNER_BORDER = "2727"
VARID_PCM_BARS = "2719"
VARID_UMD_SELECTION = "2708"
VARID_UMD_TEXT = "2709"
VARID_UMD_BOX_COLOUR = "2710"
VARID_UMD_BOX_ALPHA = "2711"
VARID_UMD_BOX_X = "2712"
VARID_UMD_BOX_Y = "2713"
VARID_UMD_TEXT_COLOUR = "2714"
VARID_UMD_TEXT_ALPHA = "2715"
VARID_UMD_TEXT_SIZE = "2717"
VARID_UMD_PADDING = "2733"

UMD_VARIDS = [
    VARID_UMD_SELECTION, VARID_UMD_TEXT, VARID_UMD_BOX_COLOUR, VARID_UMD_BOX_ALPHA,
    VARID_UMD_BOX_X, VARID_UMD_BOX_Y, VARID_UMD_TEXT_COLOUR, VARID_UMD_TEXT_ALPHA,
    VARID_UMD_TEXT_SIZE, VARID_UMD_PADDING,
]


def refresh_nexx_state(db: Session, nexx: NEXXClient) -> dict:
    enabled_count = int(nexx.get_parameter(VARID_ENABLED_MVS))
    results = {"mvs_synced": 0, "errors": []}

    for mv_idx in range(enabled_count):
        try:
            mv = db.query(Multiviewer).filter(Multiviewer.nexx_index == mv_idx).first()
            if not mv:
                mv = Multiviewer(nexx_index=mv_idx, label=f"MV {mv_idx + 1}", enabled=True)
                db.add(mv)
                db.flush()

            params = nexx.get_parameters([
                f"{VARID_MV_LAYOUT}.{mv_idx}",
                f"{VARID_MV_FONT}.{mv_idx}",
                f"{VARID_MV_OUTER_BORDER}.{mv_idx}",
                f"{VARID_MV_INNER_BORDER}.{mv_idx}",
            ])

            state = db.query(StateMV).filter(StateMV.mv_id == mv.id).first()
            if not state:
                state = StateMV(mv_id=mv.id)
                db.add(state)

            state.layout = int(params.get(f"{VARID_MV_LAYOUT}.{mv_idx}", 0))
            state.font = int(params.get(f"{VARID_MV_FONT}.{mv_idx}", 0))
            state.outer_border = int(params.get(f"{VARID_MV_OUTER_BORDER}.{mv_idx}", 0))
            state.inner_border = int(params.get(f"{VARID_MV_INNER_BORDER}.{mv_idx}", 0))
            state.updated_at = datetime.now(timezone.utc)

            for win_idx in range(16):
                _sync_window(db, nexx, mv.id, mv_idx, win_idx)

            results["mvs_synced"] += 1
        except Exception as e:
            results["errors"].append(f"MV {mv_idx}: {e}")

    db.commit()
    return results


def _sync_window(db: Session, nexx: NEXXClient, mv_id: int, mv_idx: int, win_idx: int):
    pcm_param = nexx.get_parameter(f"{VARID_PCM_BARS}.{mv_idx}.{win_idx}")

    umd_data = []
    for layer in range(3):
        varids = [f"{vid}.{mv_idx}.{win_idx}.{layer}" for vid in UMD_VARIDS]
        layer_params = nexx.get_parameters(varids)
        umd_layer = {}
        for vid in UMD_VARIDS:
            key = f"{vid}.{mv_idx}.{win_idx}.{layer}"
            umd_layer[vid] = layer_params.get(key, "")
        umd_data.append(umd_layer)

    state = db.query(StateWindow).filter(
        StateWindow.mv_id == mv_id, StateWindow.window_index == win_idx
    ).first()
    if not state:
        state = StateWindow(mv_id=mv_id, window_index=win_idx)
        db.add(state)

    state.pcm_bars = int(pcm_param) if pcm_param else 0
    state.umd_json = json.dumps(umd_data)
    state.updated_at = datetime.now(timezone.utc)


def refresh_quartz_state(db: Session, quartz: QuartzClient, max_sources: int, max_outputs: int) -> dict:
    results = {"sources_synced": 0, "routing_synced": 0, "errors": []}

    for i in range(1, max_sources + 1):
        try:
            label = quartz.read_input_name(i)
            source = db.query(Source).filter(Source.quartz_input == i).first()
            if not source:
                source = Source(quartz_input=i, label=label)
                db.add(source)
            else:
                source.label = label
            results["sources_synced"] += 1
        except Exception as e:
            results["errors"].append(f"Source {i}: {e}")

    for out in range(1, max_outputs + 1):
        try:
            inp = quartz.read_routing(out)
            route = db.query(StateRouting).filter(StateRouting.output == out).first()
            if not route:
                route = StateRouting(output=out, input=inp)
                db.add(route)
            else:
                route.input = inp
                route.updated_at = datetime.now(timezone.utc)
            results["routing_synced"] += 1
        except Exception as e:
            results["errors"].append(f"Routing out {out}: {e}")

    db.commit()
    return results
