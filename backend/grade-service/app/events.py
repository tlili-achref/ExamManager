import json
import logging
import aio_pika

from app.config import settings

logger = logging.getLogger(__name__)
EXCHANGE_NAME = "exammanager.events"


async def publish_event(event_type: str, payload: dict) -> None:
    try:
        connection = await aio_pika.connect_robust(settings.RABBITMQ_URL, timeout=3)
        async with connection:
            channel = await connection.channel()
            exchange = await channel.declare_exchange(
                EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC, durable=True
            )
            body = json.dumps({"event_type": event_type, "payload": payload}).encode("utf-8")
            await exchange.publish(
                aio_pika.Message(body=body, delivery_mode=aio_pika.DeliveryMode.PERSISTENT),
                routing_key=event_type,
            )
    except Exception as exc:
        logger.warning("RabbitMQ publish skipped (%s): %s", event_type, exc)
