"""Expo Push Notification Service Client.

Handles sending push notifications via Expo Push API.
Reference: https://docs.expo.dev/push-notifications/sending-notifications/
"""

import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class ExpoPushError(Exception):
    """Exception raised for Expo Push API errors."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.details = details or {}


class ExpoPushClient:
    """Client for sending push notifications via Expo Push API."""

    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
    MAX_BATCH_SIZE = 100  # Expo recommends max 100 messages per request

    def __init__(self, timeout: float = 30.0) -> None:
        """Initialize the Expo Push client.

        Args:
            timeout: HTTP request timeout in seconds
        """
        self.timeout = timeout

    async def send_push_notification(
        self,
        token: str,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
        sound: str = "default",
        badge: int | None = None,
        priority: str = "high",
    ) -> dict[str, Any]:
        """Send a single push notification.

        Args:
            token: Expo push token (ExponentPushToken[...])
            title: Notification title
            body: Notification body text
            data: Custom data payload for deep linking
            sound: Notification sound ('default' or None)
            badge: Badge count to display on app icon
            priority: Notification priority ('default', 'normal', 'high')

        Returns:
            Response data from Expo API

        Raises:
            ExpoPushError: If the API request fails
        """
        message = self._build_message(token, title, body, data, sound, badge, priority)
        results = await self._send_messages([message])
        return results[0] if results else {}

    async def send_batch_push_notifications(
        self,
        messages: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Send multiple push notifications in batch.

        Args:
            messages: List of message dicts with keys:
                - token: Expo push token
                - title: Notification title
                - body: Notification body
                - data: Optional custom data
                - sound: Optional sound setting
                - badge: Optional badge count
                - priority: Optional priority

        Returns:
            List of response data from Expo API

        Raises:
            ExpoPushError: If the API request fails
        """
        formatted_messages = [
            self._build_message(
                token=msg["token"],
                title=msg["title"],
                body=msg["body"],
                data=msg.get("data"),
                sound=msg.get("sound", "default"),
                badge=msg.get("badge"),
                priority=msg.get("priority", "high"),
            )
            for msg in messages
        ]

        all_results: list[dict[str, Any]] = []

        # Send in batches of MAX_BATCH_SIZE
        for i in range(0, len(formatted_messages), self.MAX_BATCH_SIZE):
            batch = formatted_messages[i : i + self.MAX_BATCH_SIZE]
            results = await self._send_messages(batch)
            all_results.extend(results)

        return all_results

    def _build_message(
        self,
        token: str,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
        sound: str | None = "default",
        badge: int | None = None,
        priority: str = "high",
    ) -> dict[str, Any]:
        """Build a single push message payload.

        Args:
            token: Expo push token
            title: Notification title
            body: Notification body
            data: Custom data payload
            sound: Sound setting
            badge: Badge count
            priority: Notification priority

        Returns:
            Formatted message dict for Expo API
        """
        message: dict[str, Any] = {
            "to": token,
            "title": title,
            "body": body,
            "priority": priority,
        }

        if data:
            message["data"] = data

        if sound:
            message["sound"] = sound

        if badge is not None:
            message["badge"] = badge

        return message

    async def _send_messages(
        self,
        messages: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Send messages to Expo Push API.

        Args:
            messages: List of formatted message dicts

        Returns:
            List of response ticket data

        Raises:
            ExpoPushError: If the API request fails
        """
        if not messages:
            return []

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.EXPO_PUSH_URL,
                    json=messages,
                    headers={
                        "Accept": "application/json",
                        "Accept-Encoding": "gzip, deflate",
                        "Content-Type": "application/json",
                    },
                )

                if response.status_code != 200:
                    logger.error(
                        "Expo Push API error: status=%d, body=%s",
                        response.status_code,
                        response.text,
                    )
                    raise ExpoPushError(
                        f"Expo Push API returned status {response.status_code}",
                        {"status_code": response.status_code, "body": response.text},
                    )

                result = response.json()
                tickets = result.get("data", [])

                # Log any errors in the tickets
                for i, ticket in enumerate(tickets):
                    if ticket.get("status") == "error":
                        logger.warning(
                            "Push notification failed: token=%s, error=%s, message=%s",
                            messages[i].get("to", "unknown"),
                            ticket.get("details", {}).get("error", "unknown"),
                            ticket.get("message", "unknown"),
                        )
                    else:
                        logger.debug(
                            "Push notification sent: token=%s, id=%s",
                            messages[i].get("to", "unknown")[:20] + "...",
                            ticket.get("id", "unknown"),
                        )

                return tickets

        except httpx.RequestError as e:
            logger.exception("Failed to send push notifications: %s", e)
            raise ExpoPushError(f"Request failed: {e}") from e


# Singleton instance for convenience
_expo_push_client: ExpoPushClient | None = None


def get_expo_push_client() -> ExpoPushClient:
    """Get or create the Expo Push client singleton.

    Returns:
        ExpoPushClient instance
    """
    global _expo_push_client
    if _expo_push_client is None:
        _expo_push_client = ExpoPushClient()
    return _expo_push_client
