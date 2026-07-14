"""Tests for scheduled notification Celery tasks."""

from datetime import UTC, datetime, timedelta
from unittest.mock import patch

from app.tasks import notification_tasks


def test_schedule_poll_deadline_notifications_schedules_future_tasks() -> None:
    """Schedule 1h, 10m, and result tasks when all ETAs are in the future."""
    now = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
    ends_at = now + timedelta(hours=2)
    poll_id = "6f0c92c1-5b0a-42e8-9d4d-8fd5ef9a6201"

    with (
        patch.object(
            notification_tasks.send_poll_deadline_notification_1h, "apply_async"
        ) as one_hour,
        patch.object(
            notification_tasks.send_poll_deadline_notification_10m, "apply_async"
        ) as ten_minutes,
        patch.object(
            notification_tasks.send_poll_result_notification, "apply_async"
        ) as result,
    ):
        notification_tasks.schedule_poll_deadline_notifications(
            poll_id,
            ends_at,
            now=now,
        )

    one_hour.assert_called_once_with(
        args=[poll_id],
        eta=ends_at - timedelta(hours=1),
    )
    ten_minutes.assert_called_once_with(
        args=[poll_id],
        eta=ends_at - timedelta(minutes=10),
    )
    result.assert_called_once_with(args=[poll_id], eta=ends_at)


def test_schedule_poll_deadline_notifications_skips_past_reminders() -> None:
    """Only schedule reminders whose ETA has not passed."""
    now = datetime(2026, 1, 1, 12, 0, tzinfo=UTC)
    ends_at = now + timedelta(minutes=30)
    poll_id = "6f0c92c1-5b0a-42e8-9d4d-8fd5ef9a6201"

    with (
        patch.object(
            notification_tasks.send_poll_deadline_notification_1h, "apply_async"
        ) as one_hour,
        patch.object(
            notification_tasks.send_poll_deadline_notification_10m, "apply_async"
        ) as ten_minutes,
        patch.object(
            notification_tasks.send_poll_result_notification, "apply_async"
        ) as result,
    ):
        notification_tasks.schedule_poll_deadline_notifications(
            poll_id,
            ends_at,
            now=now,
        )

    one_hour.assert_not_called()
    ten_minutes.assert_called_once_with(
        args=[poll_id],
        eta=ends_at - timedelta(minutes=10),
    )
    result.assert_called_once_with(args=[poll_id], eta=ends_at)
