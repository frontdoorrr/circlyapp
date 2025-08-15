import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestAuth:
    """Authentication API tests"""
    
    def test_login_new_device(self, client: TestClient):
        """Test login with new device ID"""
        response = client.post(
            "/v1/auth/login",
            json={"device_id": "new_device_123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["device_id"] == "new_device_123"
    
    def test_login_existing_device(self, client: TestClient, test_user):
        """Test login with existing device ID"""
        response = client.post(
            "/v1/auth/login",
            json={"device_id": test_user.device_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["id"] == test_user.id
    
    def test_logout(self, client: TestClient):
        """Test logout endpoint"""
        response = client.post("/v1/auth/logout")
        assert response.status_code == 200
        assert response.json()["message"] == "Successfully logged out"
    
    def test_get_current_user_authenticated(self, client: TestClient, auth_headers):
        """Test get current user with valid token"""
        response = client.get("/v1/auth/me", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "device_id" in data
    
    def test_get_current_user_unauthenticated(self, client: TestClient):
        """Test get current user without token"""
        response = client.get("/v1/auth/me")
        assert response.status_code == 403  # No authorization header
    
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test get current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/v1/auth/me", headers=headers)
        assert response.status_code == 401
    
    def test_login_missing_device_id(self, client: TestClient):
        """Test login without device ID"""
        response = client.post("/v1/auth/login", json={})
        assert response.status_code == 422  # Validation error
    
    def test_login_empty_device_id(self, client: TestClient):
        """Test login with empty device ID"""
        response = client.post("/v1/auth/login", json={"device_id": ""})
        assert response.status_code == 422  # Validation error