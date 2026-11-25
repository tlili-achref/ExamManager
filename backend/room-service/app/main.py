from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import Base, engine, get_db
from app.exceptions import register_exception_handlers
from app.models import Room
from app.schemas import RoomAvailabilityResponse, RoomCreate, RoomResponse, RoomUpdate

app = FastAPI(title="ExamManager Room Service", version="1.0.0")
register_exception_handlers(app)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "UP", "service": "room-service"}


@app.get("/rooms", response_model=list[RoomResponse])
def list_rooms(search: str | None = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Room)
    if search:
        query = query.filter(Room.name.ilike(f"%{search}%"))
    return query.order_by(Room.id.asc()).all()


@app.post("/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
def create_room(payload: RoomCreate, db: Session = Depends(get_db)):
    if db.query(Room).filter(Room.name == payload.name).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Room name already exists")
    room = Room(**payload.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@app.get("/rooms/{room_id}", response_model=RoomResponse)
def get_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return room


@app.put("/rooms/{room_id}", response_model=RoomResponse)
def update_room(room_id: int, payload: RoomUpdate, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    return room


@app.delete("/rooms/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    db.delete(room)
    db.commit()
    return None


@app.get("/rooms/{room_id}/availability", response_model=RoomAvailabilityResponse)
def check_availability(room_id: int, db: Session = Depends(get_db)):
    room = db.query(Room).filter(Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found")
    return RoomAvailabilityResponse(
        room_id=room.id,
        name=room.name,
        capacity=room.capacity,
        available=room.available,
    )
