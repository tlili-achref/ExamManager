from pydantic import BaseModel, Field


class RoomCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    building: str = Field(..., min_length=2, max_length=120)
    floor: str = Field(default="RDC", max_length=60)
    capacity: int = Field(..., ge=1, le=2000)
    available: bool = True
    usage_rate: int = Field(default=0, ge=0, le=100)


class RoomUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    building: str | None = Field(default=None, min_length=2, max_length=120)
    floor: str | None = Field(default=None, max_length=60)
    capacity: int | None = Field(default=None, ge=1, le=2000)
    available: bool | None = None
    usage_rate: int | None = Field(default=None, ge=0, le=100)


class RoomResponse(BaseModel):
    id: int
    name: str
    building: str
    floor: str
    capacity: int
    available: bool
    usage_rate: int

    model_config = {"from_attributes": True}


class RoomAvailabilityResponse(BaseModel):
    room_id: int
    name: str
    capacity: int
    available: bool
