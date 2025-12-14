"""Integration tests for circles module."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_circle_flow(client: AsyncClient) -> None:
    """Test complete circle creation and joining flow."""
    # Register first user (owner)
    owner_response = await client.post(
        "/auth/register",
        json={
            "email": "owner@example.com",
            "password": "password123",
            "username": "owner",
        },
    )
    assert owner_response.status_code == 201
    owner_token = owner_response.json()["access_token"]

    # Register second user (member)
    member_response = await client.post(
        "/auth/register",
        json={
            "email": "member@example.com",
            "password": "password123",
            "username": "member",
        },
    )
    assert member_response.status_code == 201
    member_token = member_response.json()["access_token"]

    # Create circle
    create_response = await client.post(
        "/circles",
        headers={"Authorization": f"Bearer {owner_token}"},
        json={
            "name": "Test Circle",
            "description": "A test circle",
            "max_members": 10,
        },
    )
    assert create_response.status_code == 201
    circle_data = create_response.json()
    assert circle_data["name"] == "Test Circle"
    assert circle_data["member_count"] == 1
    invite_code = circle_data["invite_code"]
    circle_id = circle_data["id"]

    # Get owner's circles
    owner_circles = await client.get(
        "/circles",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert owner_circles.status_code == 200
    assert len(owner_circles.json()) == 1

    # Member joins by code
    join_response = await client.post(
        "/circles/join/code",
        headers={"Authorization": f"Bearer {member_token}"},
        json={
            "invite_code": invite_code,
            "nickname": "Cool Member",
        },
    )
    assert join_response.status_code == 200
    assert join_response.json()["member_count"] == 2

    # Get circle details
    detail_response = await client.get(
        f"/circles/{circle_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert detail_response.status_code == 200
    detail_data = detail_response.json()
    assert len(detail_data["members"]) == 2

    # Member leaves circle
    leave_response = await client.post(
        f"/circles/{circle_id}/leave",
        headers={"Authorization": f"Bearer {member_token}"},
    )
    assert leave_response.status_code == 204

    # Verify member count decreased
    detail_after_leave = await client.get(
        f"/circles/{circle_id}",
        headers={"Authorization": f"Bearer {owner_token}"},
    )
    assert detail_after_leave.status_code == 200
    assert len(detail_after_leave.json()["members"]) == 1
