"""Integration tests for Circle workflow.

Tests the complete JoinCircleFlow:
1. User creates a circle
2. Another user joins via invite code
3. Members can view circle details
4. Owner can regenerate invite code
5. Member can leave circle
"""

from datetime import UTC, datetime, timedelta

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.circles.models import Circle


class TestCircleFlow:
    """Integration tests for Circle creation and join flow."""

    @pytest.mark.asyncio
    async def test_complete_circle_flow(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test complete circle creation and join flow.

        Flow:
        1. Owner registers and creates a circle
        2. Member registers and joins via invite code
        3. Both can view circle details and members
        4. Member leaves the circle
        """
        # Step 1: Owner registers
        owner_register = await client.post(
            "/auth/dev-login",
            json={
                "email": "owner@example.com",
                "password": "password123",
                "username": "circleowner",
            },
        )
        assert owner_register.status_code == status.HTTP_200_OK

        owner_login = await client.post(
            "/auth/dev-login",
            json={
                "email": "owner@example.com",
                "password": "password123",
            },
        )
        owner_token = owner_login.json()["access_token"]

        # Step 2: Owner creates a circle
        create_circle = await client.post(
            "/circles",
            json={
                "name": "Best Friends Circle",
                "description": "Our amazing friend group",
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert create_circle.status_code == status.HTTP_201_CREATED
        circle_data = create_circle.json()
        circle_id = circle_data["id"]
        invite_code = circle_data["invite_code"]

        assert circle_data["name"] == "Best Friends Circle"
        assert len(invite_code) == 6  # 6-character invite code

        # Step 3: Member registers
        member_register = await client.post(
            "/auth/dev-login",
            json={
                "email": "member@example.com",
                "password": "password123",
                "username": "circlemember",
            },
        )
        assert member_register.status_code == status.HTTP_200_OK

        member_login = await client.post(
            "/auth/dev-login",
            json={
                "email": "member@example.com",
                "password": "password123",
            },
        )
        member_token = member_login.json()["access_token"]

        # Step 4: Member joins circle via invite code
        join_circle = await client.post(
            "/circles/join/code",
            json={
                "invite_code": invite_code,
                "nickname": "BestFriend",
            },
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert join_circle.status_code == status.HTTP_200_OK
        join_data = join_circle.json()
        assert join_data["id"] == circle_id  # CircleResponse returns id directly

        # Step 5: Owner views circle details - should see 2 members
        owner_circle_detail = await client.get(
            f"/circles/{circle_id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert owner_circle_detail.status_code == status.HTTP_200_OK
        detail_data = owner_circle_detail.json()
        assert detail_data["member_count"] == 2

        # Step 6: Member views circle details
        member_circle_detail = await client.get(
            f"/circles/{circle_id}",
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert member_circle_detail.status_code == status.HTTP_200_OK

        # Step 7: View members list
        members_list = await client.get(
            f"/circles/{circle_id}/members",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert members_list.status_code == status.HTTP_200_OK
        members_data = members_list.json()
        assert len(members_data) == 2

        # Step 8: Member leaves circle
        leave_circle = await client.post(
            f"/circles/{circle_id}/leave",
            headers={"Authorization": f"Bearer {member_token}"},
        )
        assert leave_circle.status_code == status.HTTP_204_NO_CONTENT

        # Step 9: Verify member count is now 1
        owner_circle_after_leave = await client.get(
            f"/circles/{circle_id}",
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert owner_circle_after_leave.status_code == status.HTTP_200_OK
        assert owner_circle_after_leave.json()["member_count"] == 1

    @pytest.mark.asyncio
    async def test_invalid_invite_code(self, client: AsyncClient, db_session: AsyncSession) -> None:
        """Test joining with non-existent invite code."""
        # Register user
        await client.post(
            "/auth/dev-login",
            json={
                "email": "user@example.com",
                "password": "password123",
                "username": "testuser",
            },
        )
        login_response = await client.post(
            "/auth/dev-login",
            json={
                "email": "user@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Try to join with non-existent valid format code
        join_response = await client.post(
            "/circles/join/code",
            json={
                "invite_code": "ABC123",  # Valid format but doesn't exist
                "nickname": "TestNick",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert join_response.status_code == status.HTTP_400_BAD_REQUEST
        assert join_response.json()["error"]["code"] == "INVALID_INVITE_CODE"

    @pytest.mark.asyncio
    async def test_circle_invite_contract_includes_24_hour_expiration(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Circle creation returns a permanent link and expiring fallback code."""
        owner = await client.post(
            "/auth/dev-login",
            json={
                "email": "invite-contract-owner@example.com",
                "password": "password123",
                "username": "invite-owner",
            },
        )
        created_at = datetime.now(UTC)
        response = await client.post(
            "/circles",
            json={"name": "Invite Contract Circle"},
            headers={"Authorization": f"Bearer {owner.json()['access_token']}"},
        )

        assert response.status_code == status.HTTP_201_CREATED
        payload = response.json()
        expires_at = datetime.fromisoformat(payload["invite_code_expires_at"])
        assert payload["invite_link_id"] is not None
        assert created_at + timedelta(hours=23, minutes=59) <= expires_at
        assert expires_at <= created_at + timedelta(hours=24, minutes=1)

    @pytest.mark.asyncio
    async def test_expired_invite_code_is_rejected(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """An expired fallback code cannot be validated or used to join."""
        owner = await client.post(
            "/auth/dev-login",
            json={
                "email": "expired-code-owner@example.com",
                "password": "password123",
                "username": "expired-owner",
            },
        )
        circle = await client.post(
            "/circles",
            json={"name": "Expired Code Circle"},
            headers={"Authorization": f"Bearer {owner.json()['access_token']}"},
        )
        circle_payload = circle.json()
        await db_session.execute(
            update(Circle)
            .where(Circle.id == circle_payload["id"])
            .values(invite_code_expires_at=datetime.now(UTC) - timedelta(minutes=1))
        )
        await db_session.commit()

        validation = await client.get(
            f"/circles/validate-code/{circle_payload['invite_code']}"
        )
        assert validation.status_code == status.HTTP_200_OK
        assert validation.json()["valid"] is False

        member = await client.post(
            "/auth/dev-login",
            json={
                "email": "expired-code-member@example.com",
                "password": "password123",
                "username": "expired-member",
            },
        )
        join = await client.post(
            "/circles/join/code",
            json={"invite_code": circle_payload["invite_code"], "nickname": "Member"},
            headers={"Authorization": f"Bearer {member.json()['access_token']}"},
        )
        assert join.status_code == status.HTTP_400_BAD_REQUEST
        assert join.json()["error"]["code"] == "INVALID_INVITE_CODE"

    @pytest.mark.asyncio
    async def test_permanent_invite_link_joins_after_code_expiration(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Permanent links join directly and do not depend on fallback code expiry."""
        owner = await client.post(
            "/auth/dev-login",
            json={
                "email": "permanent-link-owner@example.com",
                "password": "password123",
                "username": "permanent-owner",
            },
        )
        circle = await client.post(
            "/circles",
            json={"name": "Permanent Link Circle"},
            headers={"Authorization": f"Bearer {owner.json()['access_token']}"},
        )
        circle_payload = circle.json()
        await db_session.execute(
            update(Circle)
            .where(Circle.id == circle_payload["id"])
            .values(invite_code_expires_at=datetime.now(UTC) - timedelta(minutes=1))
        )
        await db_session.commit()

        resolved = await client.get(
            f"/circles/invite-links/{circle_payload['invite_link_id']}"
        )
        assert resolved.status_code == status.HTTP_200_OK
        assert resolved.json()["valid"] is True
        assert resolved.json()["invite_code"] is None

        member = await client.post(
            "/auth/dev-login",
            json={
                "email": "permanent-link-member@example.com",
                "password": "password123",
                "username": "permanent-member",
            },
        )
        join = await client.post(
            f"/circles/join/link/{circle_payload['invite_link_id']}",
            json={"nickname": "Link Member"},
            headers={"Authorization": f"Bearer {member.json()['access_token']}"},
        )

        assert join.status_code == status.HTTP_200_OK
        assert join.json()["id"] == circle_payload["id"]
        assert join.json()["member_count"] == 2

    @pytest.mark.asyncio
    async def test_regenerate_code_refreshes_expiration_without_changing_link(
        self,
        client: AsyncClient,
        db_session: AsyncSession,
    ) -> None:
        """Code rotation refreshes its expiry while preserving the permanent link."""
        owner = await client.post(
            "/auth/dev-login",
            json={
                "email": "rotate-code-owner@example.com",
                "password": "password123",
                "username": "rotate-owner",
            },
        )
        circle = await client.post(
            "/circles",
            json={"name": "Rotate Code Circle"},
            headers={"Authorization": f"Bearer {owner.json()['access_token']}"},
        )
        original = circle.json()
        await db_session.execute(
            update(Circle)
            .where(Circle.id == original["id"])
            .values(invite_code_expires_at=datetime.now(UTC) - timedelta(minutes=1))
        )
        await db_session.commit()

        rotated_at = datetime.now(UTC)
        regenerate = await client.post(
            f"/circles/{original['id']}/regenerate-code",
            headers={"Authorization": f"Bearer {owner.json()['access_token']}"},
        )

        assert regenerate.status_code == status.HTTP_200_OK
        regenerated = regenerate.json()
        expires_at = datetime.fromisoformat(regenerated["invite_code_expires_at"])
        assert regenerated["invite_code"] != original["invite_code"]
        assert regenerated["invite_link_id"] == original["invite_link_id"]
        assert rotated_at + timedelta(hours=23, minutes=59) <= expires_at

        old_code = await client.get(
            f"/circles/validate-code/{original['invite_code']}"
        )
        assert old_code.json()["valid"] is False

    @pytest.mark.asyncio
    async def test_already_member_cannot_rejoin(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test that existing member cannot join again."""
        # Owner registers and creates circle
        await client.post(
            "/auth/dev-login",
            json={
                "email": "owner@example.com",
                "password": "password123",
                "username": "owner",
            },
        )
        owner_login = await client.post(
            "/auth/dev-login",
            json={
                "email": "owner@example.com",
                "password": "password123",
            },
        )
        owner_token = owner_login.json()["access_token"]

        create_response = await client.post(
            "/circles",
            json={"name": "Test Circle"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        invite_code = create_response.json()["invite_code"]

        # Owner tries to join their own circle
        rejoin_response = await client.post(
            "/circles/join/code",
            json={
                "invite_code": invite_code,
                "nickname": "OwnerAgain",
            },
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        assert rejoin_response.status_code == status.HTTP_409_CONFLICT
        assert rejoin_response.json()["error"]["code"] == "ALREADY_MEMBER"

    @pytest.mark.asyncio
    async def test_user_can_view_their_circles(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test user can list their circles."""
        # Register and login
        await client.post(
            "/auth/dev-login",
            json={
                "email": "user@example.com",
                "password": "password123",
                "username": "testuser",
            },
        )
        login_response = await client.post(
            "/auth/dev-login",
            json={
                "email": "user@example.com",
                "password": "password123",
            },
        )
        token = login_response.json()["access_token"]

        # Create two circles
        await client.post(
            "/circles",
            json={"name": "Circle 1"},
            headers={"Authorization": f"Bearer {token}"},
        )
        await client.post(
            "/circles",
            json={"name": "Circle 2"},
            headers={"Authorization": f"Bearer {token}"},
        )

        # Get user's circles
        circles_response = await client.get(
            "/circles",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert circles_response.status_code == status.HTTP_200_OK
        circles = circles_response.json()
        assert len(circles) == 2
        circle_names = [c["name"] for c in circles]
        assert "Circle 1" in circle_names
        assert "Circle 2" in circle_names

    @pytest.mark.asyncio
    async def test_non_member_cannot_view_circle(
        self, client: AsyncClient, db_session: AsyncSession
    ) -> None:
        """Test that non-member cannot view circle details."""
        # Owner creates circle
        await client.post(
            "/auth/dev-login",
            json={
                "email": "owner@example.com",
                "password": "password123",
                "username": "owner",
            },
        )
        owner_login = await client.post(
            "/auth/dev-login",
            json={
                "email": "owner@example.com",
                "password": "password123",
            },
        )
        owner_token = owner_login.json()["access_token"]

        create_response = await client.post(
            "/circles",
            json={"name": "Private Circle"},
            headers={"Authorization": f"Bearer {owner_token}"},
        )
        circle_id = create_response.json()["id"]

        # Non-member registers
        await client.post(
            "/auth/dev-login",
            json={
                "email": "outsider@example.com",
                "password": "password123",
                "username": "outsider",
            },
        )
        outsider_login = await client.post(
            "/auth/dev-login",
            json={
                "email": "outsider@example.com",
                "password": "password123",
            },
        )
        outsider_token = outsider_login.json()["access_token"]

        # Non-member tries to view circle - returns 400 (not a member)
        view_response = await client.get(
            f"/circles/{circle_id}",
            headers={"Authorization": f"Bearer {outsider_token}"},
        )
        # The service returns 400 BAD_REQUEST for non-members (NOT_MEMBER error)
        assert view_response.status_code in [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_403_FORBIDDEN,
        ]
