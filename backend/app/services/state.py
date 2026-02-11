import json
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.clients.nexx import NEXXClient
from app.clients.quartz import QuartzClient
from app.models.multiviewer import Multiviewer
from app.models.source import Source
from app.models.state import StateMV, StateWindow, StateRouting
from app.protocol_mappings import (
    VARID_ENABLED_MVS,
    VARID_MV_ENABLE,
    VARID_MV_LAYOUT,
    VARID_MV_FONT,
    VARID_MV_OUTER_BORDER,
    VARID_MV_INNER_BORDER,
    VARID_PCM_BARS,
    UMD_VARIDS,
    pcm_index_to_value,
    pcm_value_to_index,
)


def refresh_nexx_state(db: Session, nexx: NEXXClient, mv_indices: list[int] | None = None) -> dict:
    import logging
    logger = logging.getLogger(__name__)

    try:
        raw_count = nexx.get_parameter(VARID_ENABLED_MVS)
    except Exception as e:
        raise ValueError(f"Failed to connect to NEXX: {str(e)}")

    if isinstance(raw_count, int):
        max_mv_count = raw_count
    elif isinstance(raw_count, str):
        if not raw_count.strip():
            raise ValueError("NEXX returned empty response. Check if NEXX API is accessible and API key is correct.")
        try:
            max_mv_count = int(raw_count)
        except ValueError:
            raise ValueError(f"NEXX returned invalid count value: '{raw_count}'")
    else:
        raise ValueError(f"NEXX returned unexpected type: {type(raw_count)}")

    max_mv_count = min(max_mv_count, 120)
    logger.info(f"[NEXX Sync] Max MV count from API: {max_mv_count}")

    results = {"mvs_synced": 0, "errors": []}

    enabled_flags = {}
    try:
        varids = [f"{VARID_MV_ENABLE}.{idx}" for idx in range(max_mv_count)]
        enabled_params = nexx.get_parameters(varids)

        for idx in range(max_mv_count):
            key = f"{VARID_MV_ENABLE}.{idx}"
            value = enabled_params.get(key, 0)
            if value is None or value == "" or value == 0 or value == "0":
                enabled_flags[idx] = False
            else:
                enabled_flags[idx] = int(value) == 1

        logger.info(f"[NEXX Sync] Enabled MVs: {[idx for idx, en in enabled_flags.items() if en]}")
    except Exception as e:
        logger.error(f"[NEXX Sync] Failed to fetch enabled flags: {e}", exc_info=True)
        enabled_flags = {0: True, 1: True, 2: True}
        logger.info(f"[NEXX Sync] Using fallback enabled MVs: {[0, 1, 2]}")

    enabled_indices = [idx for idx in range(max_mv_count) if enabled_flags.get(idx, False)]

    if mv_indices is not None:
        enabled_indices = [idx for idx in enabled_indices if idx in mv_indices]

    # Pre-load all DB objects (3 queries instead of 18 per MV)
    mv_by_idx = {mv.nexx_index: mv for mv in db.query(Multiviewer).filter(
        Multiviewer.nexx_index.in_(enabled_indices)
    ).all()}
    mv_ids = [mv.id for mv in mv_by_idx.values()]
    state_mv_by_id = {s.mv_id: s for s in db.query(StateMV).filter(
        StateMV.mv_id.in_(mv_ids)
    ).all()} if mv_ids else {}
    state_win_by_key = {(s.mv_id, s.window_index): s for s in db.query(StateWindow).filter(
        StateWindow.mv_id.in_(mv_ids)
    ).all()} if mv_ids else {}

    for mv_idx in enabled_indices:
        logger.info(f"[NEXX Sync] Syncing MV {mv_idx}...")
        try:
            mv = mv_by_idx.get(mv_idx)
            if not mv:
                mv = Multiviewer(nexx_index=mv_idx, label=f"MV {mv_idx + 1}", enabled=True)
                db.add(mv)
                db.flush()
                mv_by_idx[mv_idx] = mv

            params = nexx.get_parameters([
                f"{VARID_MV_LAYOUT}.{mv_idx}",
                f"{VARID_MV_FONT}.{mv_idx}",
                f"{VARID_MV_OUTER_BORDER}.{mv_idx}",
                f"{VARID_MV_INNER_BORDER}.{mv_idx}",
            ])

            state = state_mv_by_id.get(mv.id)
            if not state:
                state = StateMV(mv_id=mv.id)
                db.add(state)
                state_mv_by_id[mv.id] = state

            state.layout = int(params.get(f"{VARID_MV_LAYOUT}.{mv_idx}", 0) or 0)
            state.font = int(params.get(f"{VARID_MV_FONT}.{mv_idx}", 0) or 0)
            state.outer_border = int(params.get(f"{VARID_MV_OUTER_BORDER}.{mv_idx}", 0) or 0)
            state.inner_border = int(params.get(f"{VARID_MV_INNER_BORDER}.{mv_idx}", 0) or 0)
            state.updated_at = datetime.now(timezone.utc)

            _sync_all_windows_batched(db, nexx, mv.id, mv_idx, state_win_by_key)

            results["mvs_synced"] += 1
        except Exception as e:
            logger.error(f"[NEXX Sync] Failed to sync MV {mv_idx}: {e}", exc_info=True)
            results["errors"].append(f"MV {mv_idx}: {e}")

    db.commit()
    return results


def _sync_all_windows_batched(db: Session, nexx: NEXXClient, mv_id: int, mv_idx: int,
                              state_win_by_key: dict):
    pcm_varids = [f"{VARID_PCM_BARS}.{mv_idx}.{win_idx}" for win_idx in range(16)]
    pcm_params = nexx.get_parameters(pcm_varids)

    # NEXX API limit: max 40 params per request. 10 UMD VarIDs × 4 windows = 40.
    umd_params_by_layer = {0: {}, 1: {}, 2: {}}
    for layer in range(3):
        for group_start in range(0, 16, 4):
            varids = []
            for win_idx in range(group_start, group_start + 4):
                for vid in UMD_VARIDS:
                    varids.append(f"{vid}.{mv_idx}.{win_idx}.{layer}")
            chunk_result = nexx.get_parameters(varids)
            umd_params_by_layer[layer].update(chunk_result)

    now = datetime.now(timezone.utc)
    for win_idx in range(16):
        pcm_key = f"{VARID_PCM_BARS}.{mv_idx}.{win_idx}"
        pcm_param = pcm_params.get(pcm_key, 0)

        umd_data = []
        for layer in range(3):
            umd_layer = {}
            for vid in UMD_VARIDS:
                key = f"{vid}.{mv_idx}.{win_idx}.{layer}"
                umd_layer[vid] = umd_params_by_layer[layer].get(key, "")
            umd_data.append(umd_layer)

        key = (mv_id, win_idx)
        state = state_win_by_key.get(key)
        if not state:
            state = StateWindow(mv_id=mv_id, window_index=win_idx)
            db.add(state)
            state_win_by_key[key] = state

        pcm_index = int(pcm_param) if pcm_param not in (None, "") else 0
        state.pcm_bars = pcm_index_to_value(pcm_index)
        state.umd_json = json.dumps(umd_data)
        state.updated_at = now


def refresh_quartz_state(db: Session, quartz: QuartzClient, max_sources: int, max_outputs: int,
                         source_inputs: list[int] | None = None, output_range: list[int] | None = None) -> dict:
    from concurrent.futures import ThreadPoolExecutor, as_completed
    import logging

    logger = logging.getLogger(__name__)
    results = {"sources_synced": 0, "routes_synced": 0, "errors": []}

    source_ids_to_fetch = source_inputs if source_inputs is not None else list(range(1, max_sources + 1))

    # Parallel fetch of source names (max 10 concurrent connections)
    # NOTE: Quartz server has RD/RS swapped - use read_output_name to get actual sources
    logger.info(f"[Quartz Sync] Fetching {len(source_ids_to_fetch)} source names...")
    input_data = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_input = {executor.submit(quartz.read_output_name, i): i for i in source_ids_to_fetch}
        for future in as_completed(future_to_input):
            i = future_to_input[future]
            try:
                label = future.result()
                input_data[i] = label
            except Exception as e:
                results["errors"].append(f"Source {i}: {e}")

    for i, label in input_data.items():
        source = db.query(Source).filter(Source.quartz_input == i).first()
        if not source:
            source = Source(quartz_input=i, label=label)
            db.add(source)
        else:
            source.label = label
        results["sources_synced"] += 1

    logger.info(f"[Quartz Sync] Synced {results['sources_synced']} sources")

    output_ids_to_fetch = output_range if output_range is not None else list(range(1, max_outputs + 1))

    logger.info(f"[Quartz Sync] Fetching {len(output_ids_to_fetch)} routing states...")
    routing_data = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_output = {executor.submit(quartz.read_routing, out): out for out in output_ids_to_fetch}
        for future in as_completed(future_to_output):
            out = future_to_output[future]
            try:
                inp = future.result()
                routing_data[out] = inp
            except Exception as e:
                results["errors"].append(f"Routing out {out}: {e}")

    # Save routing to DB
    for out, inp in routing_data.items():
        route = db.query(StateRouting).filter(StateRouting.output == out).first()
        if not route:
            route = StateRouting(output=out, input=inp)
            db.add(route)
        else:
            route.input = inp
            route.updated_at = datetime.now(timezone.utc)
        results["routes_synced"] += 1

    logger.info(f"[Quartz Sync] Synced {results['routes_synced']} routes")
    db.commit()
    return results
