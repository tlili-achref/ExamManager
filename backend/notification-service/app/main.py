import asyncio
import contextlib
from fastapi import Depends, FastAPI, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.consumer import start_consumer
from app.database import Base, engine, get_db
from app.exceptions import register_exception_handlers
from app.models import Notification
from app.schemas import NotificationCreate, NotificationResponse

app = FastAPI(title="ExamManager Notification Service", version="1.0.0")
register_exception_handlers(app)
_consumer_task: asyncio.Task | None = None


@app.on_event("startup")
async def on_startup():
    global _consumer_task
    Base.metadata.create_all(bind=engine)
    _consumer_task = asyncio.create_task(start_consumer())


@app.on_event("shutdown")
async def on_shutdown():
    if _consumer_task:
        _consumer_task.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await _consumer_task


@app.get("/health")
def health():
    return {"status": "UP", "service": "notification-service"}


@app.get("/notifications", response_model=list[NotificationResponse])
def list_notifications(unread_only: bool = Query(default=False), db: Session = Depends(get_db)):
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.is_read == False)  # noqa: E712
    return query.order_by(Notification.id.desc()).all()


@app.post("/notifications", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db)):
    notif = Notification(**payload.model_dump())
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


@app.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif


@app.post("/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    updated = db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})  # noqa: E712
    db.commit()
    return {"updated": updated}
