from pydantic import BaseModel


class SourceResponse(BaseModel):
    id: int
    quartz_input: int
    label: str


class MultiviewerResponse(BaseModel):
    id: int
    nexx_index: int
    label: str
    enabled: bool


class MVStateResponse(BaseModel):
    id: int
    nexx_index: int
    label: str
    layout: int | None
    font: int | None
    outer_border: int | None
    inner_border: int | None
    windows: list[dict]


class SetLayoutRequest(BaseModel):
    layout: int


class SetWindowRequest(BaseModel):
    pcm_bars: int | None = None
    umd: list[dict] | None = None


class SwitchRequest(BaseModel):
    output: int
    input: int


class RoutingEntry(BaseModel):
    output: int
    input: int | None
