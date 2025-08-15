import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession


class TestCircles:
    """Circle API tests"""
    
    def test_create_circle(self, client: TestClient, auth_headers):
        """Test circle creation"""
        circle_data = {
            "name": "Test Circle",
            "description": "A test circle for testing"
        }
        response = client.post("/v1/circles", json=circle_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Circle"
        assert data["description"] == "A test circle for testing"
        assert "invite_code" in data
        assert len(data["invite_code"]) == 8
    
    def test_create_circle_unauthenticated(self, client: TestClient):
        """Test circle creation without authentication"""
        circle_data = {"name": "Test Circle"}
        response = client.post("/v1/circles", json=circle_data)
        assert response.status_code == 403
    
    def test_get_my_circles_empty(self, client: TestClient, auth_headers):
        """Test get circles when user has no circles"""
        response = client.get("/v1/circles", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []
    
    def test_join_circle_with_invite_code(self, client: TestClient, auth_headers):
        """Test joining circle with invite code"""
        # First create a circle
        circle_data = {"name": "Test Circle"}
        create_response = client.post("/v1/circles", json=circle_data, headers=auth_headers)
        invite_code = create_response.json()["invite_code"]
        
        # Create another user to join
        login_response = client.post("/v1/auth/login", json={"device_id": "another_device_456"})
        other_auth_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}
        
        # Join circle
        join_response = client.post(
            "/v1/circles/join",
            json={"invite_code": invite_code},
            headers=other_auth_headers
        )
        assert join_response.status_code == 200
    
    def test_join_circle_invalid_invite_code(self, client: TestClient, auth_headers):
        """Test joining circle with invalid invite code"""
        response = client.post(
            "/v1/circles/join",
            json={"invite_code": "INVALID1"},
            headers=auth_headers
        )
        assert response.status_code == 404
    
    def test_join_circle_already_member(self, client: TestClient, auth_headers):
        """Test joining circle when already a member"""
        # Create a circle
        circle_data = {"name": "Test Circle"}
        create_response = client.post("/v1/circles", json=circle_data, headers=auth_headers)
        invite_code = create_response.json()["invite_code"]
        
        # Try to join the same circle (creator is already admin)
        response = client.post(
            "/v1/circles/join",
            json={"invite_code": invite_code},
            headers=auth_headers
        )
        assert response.status_code == 400
    
    def test_get_circle_details(self, client: TestClient, auth_headers):
        """Test getting circle details"""
        # Create a circle
        circle_data = {"name": "Test Circle", "description": "Test description"}
        create_response = client.post("/v1/circles", json=circle_data, headers=auth_headers)
        circle_id = create_response.json()["id"]
        
        # Get circle details
        response = client.get(f"/v1/circles/{circle_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Test Circle"
        assert data["description"] == "Test description"
        assert "member_count" in data
    
    def test_get_circle_not_member(self, client: TestClient, auth_headers):
        """Test getting circle details when not a member"""
        # Create another user and circle
        login_response = client.post("/v1/auth/login", json={"device_id": "other_device_789"})
        other_auth_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}
        
        circle_data = {"name": "Private Circle"}
        create_response = client.post("/v1/circles", json=circle_data, headers=other_auth_headers)
        circle_id = create_response.json()["id"]
        
        # Try to access with original user
        response = client.get(f"/v1/circles/{circle_id}", headers=auth_headers)
        assert response.status_code == 404
    
    def test_get_circle_members(self, client: TestClient, auth_headers):
        """Test getting circle members"""
        # Create a circle
        circle_data = {"name": "Test Circle"}
        create_response = client.post("/v1/circles", json=circle_data, headers=auth_headers)
        circle_id = create_response.json()["id"]
        
        # Get members
        response = client.get(f"/v1/circles/{circle_id}/members", headers=auth_headers)
        assert response.status_code == 200
        members = response.json()
        assert len(members) == 1  # Only creator
        assert members[0]["role"] == "admin"
    
    def test_create_circle_validation(self, client: TestClient, auth_headers):
        """Test circle creation validation"""
        # Test missing name
        response = client.post("/v1/circles", json={}, headers=auth_headers)
        assert response.status_code == 422
        
        # Test empty name
        response = client.post("/v1/circles", json={"name": ""}, headers=auth_headers)
        assert response.status_code == 422