"""Tests for Auth API endpoints."""

import pytest
from httpx import AsyncClient


class TestRegisterEndpoint:
    """Tests for POST /auth/register endpoint."""

    @pytest.mark.asyncio
    async def test_register_success(self, client: AsyncClient) -> None:
        """Test successful user registration."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
                "username": "newuser",
                "display_name": "New User",
            },
        )

        assert response.status_code == 201
        data = response.json()
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["username"] == "newuser"
        assert data["user"]["display_name"] == "New User"
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client: AsyncClient) -> None:
        """Test registration with duplicate email."""
        user_data = {
            "email": "duplicate@example.com",
            "password": "password123",
        }

        # Register first user
        response1 = await client.post("/auth/register", json=user_data)
        assert response1.status_code == 201

        # Try to register with same email
        response2 = await client.post("/auth/register", json=user_data)
        assert response2.status_code == 400

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client: AsyncClient) -> None:
        """Test registration with invalid email format."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "not-an-email",
                "password": "password123",
            },
        )

        assert response.status_code == 422  # Validation error

    @pytest.mark.asyncio
    async def test_register_short_password(self, client: AsyncClient) -> None:
        """Test registration with password too short."""
        response = await client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "password": "short",  # Less than 8 characters
            },
        )

        assert response.status_code == 422  # Validation error


class TestLoginEndpoint:
    """Tests for POST /auth/login endpoint."""

    @pytest.mark.asyncio
    async def test_login_success(self, client: AsyncClient) -> None:
        """Test successful login."""
        # Register a user first
        await client.post(
            "/auth/register",
            json={
                "email": "loginuser@example.com",
                "password": "mypassword123",
                "username": "loginuser",
            },
        )

        # Login
        response = await client.post(
            "/auth/login",
            json={
                "email": "loginuser@example.com",
                "password": "mypassword123",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["user"]["email"] == "loginuser@example.com"
        assert data["user"]["username"] == "loginuser"
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_invalid_email(self, client: AsyncClient) -> None:
        """Test login with non-existent email."""
        response = await client.post(
            "/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "password123",
            },
        )

        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client: AsyncClient) -> None:
        """Test login with wrong password."""
        # Register a user
        await client.post(
            "/auth/register",
            json={
                "email": "wrongpass@example.com",
                "password": "correctpassword",
            },
        )

        # Try to login with wrong password
        response = await client.post(
            "/auth/login",
            json={
                "email": "wrongpass@example.com",
                "password": "wrongpassword",
            },
        )

        assert response.status_code == 401


class TestGetMeEndpoint:
    """Tests for GET /auth/me endpoint."""

    @pytest.mark.asyncio
    async def test_get_me_success(self, client: AsyncClient) -> None:
        """Test getting current user profile."""
        # Register and get token
        register_response = await client.post(
            "/auth/register",
            json={
                "email": "meuser@example.com",
                "password": "password123",
                "username": "meuser",
            },
        )
        token = register_response.json()["access_token"]

        # Get profile
        response = await client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "meuser@example.com"
        assert data["username"] == "meuser"

    @pytest.mark.asyncio
    async def test_get_me_no_token(self, client: AsyncClient) -> None:
        """Test getting profile without token."""
        response = await client.get("/auth/me")

        assert response.status_code == 422  # Missing required header

    @pytest.mark.asyncio
    async def test_get_me_invalid_token(self, client: AsyncClient) -> None:
        """Test getting profile with invalid token."""
        response = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid.token.here"},
        )

        assert response.status_code == 401


class TestUpdateMeEndpoint:
    """Tests for PUT /auth/me endpoint."""

    @pytest.mark.asyncio
    async def test_update_me_success(self, client: AsyncClient) -> None:
        """Test updating current user profile."""
        # Register and get token
        register_response = await client.post(
            "/auth/register",
            json={
                "email": "updateme@example.com",
                "password": "password123",
                "username": "oldname",
            },
        )
        token = register_response.json()["access_token"]

        # Update profile
        response = await client.put(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "username": "newname",
                "display_name": "New Display Name",
                "profile_emoji": "🎉",
            },
        )

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "newname"
        assert data["display_name"] == "New Display Name"
        assert data["profile_emoji"] == "🎉"

    @pytest.mark.asyncio
    async def test_update_me_partial(self, client: AsyncClient) -> None:
        """Test partial profile update."""
        # Register and get token
        register_response = await client.post(
            "/auth/register",
            json={
                "email": "partial@example.com",
                "password": "password123",
                "username": "originalname",
                "display_name": "Original Display",
            },
        )
        token = register_response.json()["access_token"]

        # Update only display name
        response = await client.put(
            "/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            json={"display_name": "Only Display Changed"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "originalname"  # unchanged
        assert data["display_name"] == "Only Display Changed"

    @pytest.mark.asyncio
    async def test_update_me_no_token(self, client: AsyncClient) -> None:
        """Test updating profile without token."""
        response = await client.put(
            "/auth/me",
            json={"username": "newname"},
        )

        assert response.status_code == 422  # Missing required header
