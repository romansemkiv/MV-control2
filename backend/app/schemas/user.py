from pydantic import BaseModel


class CreateUserRequest(BaseModel):
    login: str
    password: str
    role: str = "user"


class UpdateUserRequest(BaseModel):
    login: str | None = None
    role: str | None = None
    password: str | None = None


class UserResponse(BaseModel):
    id: int
    login: str
    role: str


class AccessUpdate(BaseModel):
    source_ids: list[int] | None = None
    mv_ids: list[int] | None = None
