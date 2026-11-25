import asyncio
import json
import logging
import aio_pika

from app.config import settings
from app.database import SessionLocal
from app.models import Notification

logger = logging.getLogger(__name__)
EXCHANGE_NAME = "exammanager.events"
QUEUE_NAME = "notification-service.queue"


def event_to_notification(event_type: str, payload: dict) -> Notification:
    if event_type == "ExamCreated":
        return Notification(
            event_type=event_type,
            title="Nouvel examen planifié",
            message=f"L'examen de {payload.get('subject_name', 'Matière')} a été planifié le {payload.get('exam_date', '')} à {payload.get('start_time', '')} ({payload.get('room_name', '')}).",
            icon="calendar",
            target_role="ALL",
        )
    if event_type == "ExamUpdated":
        return Notification(
            event_type=event_type,
            title="Examen mis à jour",
            message=f"L'examen de {payload.get('subject_name', 'Matière')} ({payload.get('exam_date', '')}) a été modifié ({payload.get('status', '')}).",
            icon="calendar",
            target_role="ALL",
        )
    if event_type == "GradesPublished":
        subjects = ", ".join(payload.get("subjects") or ["session"])
        return Notification(
            event_type=event_type,
            title="Notes publiées",
            message=f"Les notes de {subjects} ({payload.get('count', 0)} résultats) ont été publiées.",
            icon="grade",
            target_role="STUDENT",
        )
    return Notification(
        event_type=event_type,
        title=event_type,
        message=json.dumps(payload),
        icon="bell",
        target_role="ALL",
    )


async def start_consumer():
    while True:
        try:
            connection = await aio_pika.connect_robust(settings.RABBITMQ_URL)
            async with connection:
                channel = await connection.channel()
                exchange = await channel.declare_exchange(
                    EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC, durable=True
                )
                queue = await channel.declare_queue(QUEUE_NAME, durable=True)
                await queue.bind(exchange, routing_key="#")

                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        async with message.process():
                            data = json.loads(message.body.decode("utf-8"))
                            notif = event_to_notification(
                                data.get("event_type", "Event"),
                                data.get("payload", {}),
                            )
                            db = SessionLocal()
                            try:
                                db.add(notif)
                                db.commit()
                            finally:
                                db.close()
        except asyncio.CancelledError:
            break
        except Exception as exc:
            logger.warning("RabbitMQ consumer reconnecting: %s", exc)
            await asyncio.sleep(5)
