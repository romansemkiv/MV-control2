from pydantic import BaseModel


class PresetCreate(BaseModel):
    name: str
    payload: dict


class PresetResponse(BaseModel):
    id: int
    name: str
    created_at: str


class PresetDetail(BaseModel):
    id: int
    name: str
    payload: dict
    created_at: str
