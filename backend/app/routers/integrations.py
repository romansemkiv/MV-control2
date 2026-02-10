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

    if body.jwt_username and body.jwt_password:
        integration.jwt_credentials = json.dumps({"username": body.jwt_username, "password": body.jwt_password})

    db.commit()
    db.refresh(integration)

    # First status check on save
    status = _test_connection(integration)
    return {"id": integration.id, "status": status}


def _test_connection(integration: Integration) -> dict:
    try:
        if integration.protocol == "quartz":
            client = QuartzClient(host=integration.host, port=integration.port or 6543, timeout=3.0)
            name = client.read_input_name(1)
            return {"ok": True, "message": f"Connected. Input 1: {name}"}
        elif integration.protocol == "nexx":
            client = NEXXClient(host=integration.host, api_key=integration.api_key)
            result = client.get_parameter("2700")
            return {"ok": True, "message": f"Connected. Total MVs: {result}"}
    except (QuartzError, NEXXError, Exception) as e:
        return {"ok": False, "message": str(e)}
    return {"ok": False, "message": "Unknown protocol"}
