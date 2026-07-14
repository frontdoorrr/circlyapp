"""Celery tasks for scheduled poll notifications."""

import asyncio
import logging
import uuid
from datetime import UTC, datetime, timedelta

from app.core.celery import celery_app
from app.core.database import async_session_maker
from app.core.enums import PollStatus
from app.modules.auth.repository import UserRepository
from app.modules.circles.repository import CircleRepository, MembershipRepository
from app.modules.notifications.repository import NotificationRepository
from app.modules.notifications.service import NotificationService
from app.modules.polls.repository import (
    PollRepository,
    TemplateRepository,
    VoteRepository,
    VoteSessionRepository,
)
from app.modules.polls.service import PollService

logger = logging.getLogger(__name__)


def _parse_poll_id(poll_id: str) -> uuid.UUID:
    """Parse a poll id string for task inputs."""
    return uuid.UUID(poll_id)


async def _send_poll_deadline_notification(poll_id: str, minutes_left: int) -> bool:
    poll_uuid = _parse_poll_id(poll_id)

    async with async_session_maker() as session:
        poll_repo = PollRepository(session)
        vote_repo = VoteRepository(session)
        membership_repo = MembershipRepository(session)
        notification_service = NotificationService(
            NotificationRepository(session),
            UserRepository(session),
        )

        poll = await poll_repo.find_by_id(poll_uuid)
        if poll is None or poll.status != PollStatus.ACTIVE:
            return False

        members = await membership_repo.find_by_circle_id(poll.circle_id)
        member_ids = [member.user_id for member in members]
        voted_user_ids = await vote_repo.find_voter_ids_by_poll_id(poll_uuid)
        non_voter_ids = [
            member_id for member_id in member_ids if member_id not in voted_user_ids
        ]

        await notification_service.send_poll_reminder(
            poll,
            non_voter_ids,
            minutes_left=minutes_left,
        )
        await session.commit()
        return True


async def _send_poll_result_notification(poll_id: str) -> bool:
    poll_uuid = _parse_poll_id(poll_id)

    async with async_session_maker() as session:
        poll_repo = PollRepository(session)
        notification_service = NotificationService(
            NotificationRepository(session),
            UserRepository(session),
        )
        poll_service = PollService(
            TemplateRepository(session),
            poll_repo,
            VoteRepository(session),
            MembershipRepository(session),
            CircleRepository(session),
            notification_service,
            VoteSessionRepository(session),
            UserRepository(session),
        )

        poll = await poll_repo.find_by_id(poll_uuid)
        if poll is None or poll.status != PollStatus.ACTIVE:
            return False

        await poll_service.close_poll(poll_uuid)
        await session.commit()
        return True


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_poll_deadline_notification_1h(self, poll_id: str) -> bool:
    """Send the 1-hour-before poll deadline reminder."""
    try:
        return asyncio.run(_send_poll_deadline_notification(poll_id, 60))
    except Exception as exc:
        logger.exception("1h deadline notification failed for poll %s", poll_id)
        raise self.retry(exc=exc) from exc


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_poll_deadline_notification_10m(self, poll_id: str) -> bool:
    """Send the 10-minute-before poll deadline reminder."""
    try:
        return asyncio.run(_send_poll_deadline_notification(poll_id, 10))
    except Exception as exc:
        logger.exception("10m deadline notification failed for poll %s", poll_id)
        raise self.retry(exc=exc) from exc


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def send_poll_result_notification(self, poll_id: str) -> bool:
    """Close a poll and send result notifications."""
    try:
        return asyncio.run(_send_poll_result_notification(poll_id))
    except Exception as exc:
        logger.exception("Result notification failed for poll %s", poll_id)
        raise self.retry(exc=exc) from exc


def schedule_poll_deadline_notifications(
    poll_id: str,
    ends_at: datetime,
    now: datetime | None = None,
) -> None:
    """Schedule deadline reminders and the final result notification."""
    reference_time = now or datetime.now(UTC)
    if reference_time.tzinfo is None:
        reference_time = reference_time.replace(tzinfo=UTC)
    if ends_at.tzinfo is None:
        ends_at = ends_at.replace(tzinfo=UTC)

    one_hour_before = ends_at - timedelta(hours=1)
    if one_hour_before > reference_time:
        send_poll_deadline_notification_1h.apply_async(
            args=[poll_id],
            eta=one_hour_before,
        )

    ten_minutes_before = ends_at - timedelta(minutes=10)
    if ten_minutes_before > reference_time:
        send_poll_deadline_notification_10m.apply_async(
            args=[poll_id],
            eta=ten_minutes_before,
        )

    if ends_at > reference_time:
        send_poll_result_notification.apply_async(
            args=[poll_id],
            eta=ends_at,
        )


schedule_poll_notifications = schedule_poll_deadline_notifications
