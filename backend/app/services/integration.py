from sqlalchemy.orm import Session

from app.clients.quartz import QuartzClient
from app.clients.nexx import NEXXClient
from app.models.integration import Integration


def get_quartz_client(db: Session) -> QuartzClient | None:
    integration = db.query(Integration).filter(Integration.protocol == "quartz").first()
    if not integration:
        return None
    return QuartzClient(host=integration.host, port=integration.port or 6543)


def get_nexx_client(db: Session) -> NEXXClient | None:
    integration = db.query(Integration).filter(Integration.protocol == "nexx").first()
    if not integration:
        return None
    return NEXXClient(host=integration.host, api_key=integration.api_key, jwt=None)
