from pydantic import BaseModel


class IntegrationRequest(BaseModel):
    protocol: str
    host: str
    port: int | None = None
    api_key: str | None = None
    jwt_username: str | None = None
    jwt_password: str | None = None
    max_inputs: int | None = None
    max_outputs: int | None = None


class IntegrationResponse(BaseModel):
    id: int
    protocol: str
    host: str
    port: int | None
    api_key: str | None
    has_jwt: bool
    max_inputs: int | None
    max_outputs: int | None
