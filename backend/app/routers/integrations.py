import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.integration import Integration
from app.schemas.integration import IntegrationRequest, IntegrationResponse
from app.clients.quartz import QuartzClient, QuartzError
from app.clients.nexx import NEXXClient, NEXXError

router = APIRouter(prefix="/api/integrations", tags=["integrations"])


@router.get("", response_model=list[IntegrationResponse])
def list_integrations(_admin=Depends(require_admin), db: Session = Depends(get_db)):
    items = db.query(Integration).all()
    return [
        IntegrationResponse(
            id=i.id, protocol=i.protocol, host=i.host, port=i.port,
            api_key=i.api_key, has_jwt=bool(i.jwt_credentials),
            max_inputs=i.max_inputs, max_outputs=i.max_outputs,
        )
        for i in items
    ]


@router.post("")
def save_integration(body: IntegrationRequest, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    integration = db.query(Integration).filter(Integration.protocol == body.protocol).first()
    if not integration:
        integration = Integration(protocol=body.protocol)
        db.add(integration)

    integration.host = body.host
    integration.port = body.port
    integration.api_key = body.api_key
    integration.max_inputs = body.max_inputs
    integration.max_outputs = body.max_outputs

    if body.jwt_username and body.jwt_password:
        integration.jwt_credentials = json.dumps({"username": body.jwt_username, "password": body.jwt_password})

    db.commit()
    db.refresh(integration)

    # First status check on save
    status = _test_connection(integration)
    return {"id": integration.id, "status": status}


@router.delete("/{protocol}")
def delete_integration(protocol: str, _admin=Depends(require_admin), db: Session = Depends(get_db)):
    integration = db.query(Integration).filter(Integration.protocol == protocol).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")
    db.delete(integration)
    db.commit()
    return {"ok": True}


def _test_connection(integration: Integration) -> dict:
    import logging
    logger = logging.getLogger(__name__)

    try:
        if integration.protocol == "quartz":
            client = QuartzClient(host=integration.host, port=integration.port or 6543, timeout=3.0)
            name = client.read_input_name(1)
            return {"ok": True, "message": f"Connected. Input 1: {name}"}
        elif integration.protocol == "nexx":
            logger.info(f"[Integration Test] Testing NEXX connection to {integration.host}")
            client = NEXXClient(host=integration.host, api_key=integration.api_key)
            result = client.get_parameter("2700")
            return {"ok": True, "message": f"Connected. Total MVs: {result}"}
    except (QuartzError, NEXXError) as e:
        logger.error(f"[Integration Test] Protocol error: {e}")
        return {"ok": False, "message": str(e)}
    except Exception as e:
        logger.error(f"[Integration Test] Unexpected error: {e}", exc_info=True)
        return {"ok": False, "message": f"Connection failed: {str(e)}"}
    return {"ok": False, "message": "Unknown protocol"}
