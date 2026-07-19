"""Tests for the current Auth API contract."""

from unittest.mock import patch

import pytest
from fastapi import status
from httpx import AsyncClient


async def dev_login(
    client: AsyncClient,
    *,
    email: str,
    username: str | None = None,
    display_name: str | None = None,
):
    """Create or reuse a development user through the public dev auth route."""
    return await client.post(
        "/auth/dev-login",
        json={
            "email": email,
            "password": "password123",
            "username": username,
            "display_name": display_name,
        },
    )


class TestDevLoginEndpoint:
    """Tests for POST /auth/dev-login."""

    @pytest.mark.asyncio
    async def test_dev_login_creates_user(self, client: AsyncClient) -> None:
        response = await dev_login(
            client,
            email="newuser@example.com",
            username="newuser",
            display_name="New User",
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["username"] == "newuser"
        assert data["user"]["display_name"] == "New User"
        assert data["access_token"] == f"dev:{data['user']['id']}"
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_dev_login_reuses_user(self, client: AsyncClient) -> None:
        first = await dev_login(client, email="reuse@example.com", username="first")
        second = await dev_login(client, email="reuse@example.com", username="changed")

        assert first.status_code == status.HTTP_200_OK
        assert second.status_code == status.HTTP_200_OK
        assert second.json()["user"]["id"] == first.json()["user"]["id"]
        assert second.json()["user"]["username"] == "first"

    @pytest.mark.asyncio
    async def test_dev_login_validates_email(self, client: AsyncClient) -> None:
        response = await client.post(
            "/auth/dev-login",
            json={"email": "not-an-email", "password": "password123"},
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT

    @pytest.mark.asyncio
    async def test_dev_login_is_hidden_outside_development(self, client: AsyncClient) -> None:
        with patch("app.modules.auth.router.get_settings") as mock_settings:
            mock_settings.return_value.dev_auth_enabled = False
            mock_settings.return_value.is_production = True
            response = await dev_login(client, email="blocked@example.com")

        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestGetMeEndpoint:
    """Tests for GET /auth/me with development bearer tokens."""

    @pytest.mark.asyncio
    async def test_get_me_success(self, client: AsyncClient) -> None:
        login_response = await dev_login(
            client,
            email="meuser@example.com",
            username="meuser",
        )
        token = login_response.json()["access_token"]

        response = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["email"] == "meuser@example.com"
        assert response.json()["username"] == "meuser"

    @pytest.mark.asyncio
    async def test_get_me_no_token(self, client: AsyncClient) -> None:
        response = await client.get("/auth/me")

        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    @pytest.mark.asyncio
    async def test_get_me_invalid_dev_token(self, client: AsyncClient) -> None:
        response = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer dev:not-a-uuid"},
        )

        assert response.status_code == status.HTTP_401_UNAUTHORIZED


class TestUpdateMeEndpoint:
    """Tests for PUT /auth/me."""

    @pytest.mark.asyncio
    async def test_update_me_success(self, client: AsyncClient) -> None:
        login_response = await dev_login(
            client,
            email="updateme@example.com",
            username="oldname",
        )
        token = login_response.json()["access_token"]

        response = await client.put(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "newname",
                "display_name": "New Display Name",
                "gender": "FEMALE",
                "age_group": "OLDER_TEEN",
                "profile_emoji": "🎉",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "newname"
        assert data["display_name"] == "New Display Name"
        assert data["gender"] == "FEMALE"
        assert data["age_group"] == "OLDER_TEEN"
        assert data["profile_emoji"] == "🎉"

    @pytest.mark.asyncio
    async def test_update_me_partial(self, client: AsyncClient) -> None:
        login_response = await dev_login(
            client,
            email="partial@example.com",
            username="originalname",
            display_name="Original Display",
        )
        token = login_response.json()["access_token"]

        response = await client.put(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            json={"display_name": "Only Display Changed", "gender": "MALE"},
        )

        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "originalname"
        assert data["display_name"] == "Only Display Changed"
        assert data["gender"] == "MALE"

    @pytest.mark.asyncio
    async def test_update_me_no_token(self, client: AsyncClient) -> None:
        response = await client.put("/auth/me", json={"username": "newname"})

        assert response.status_code == status.HTTP_401_UNAUTHORIZED
