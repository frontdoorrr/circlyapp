import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestBasicEndpoints:
    """Basic endpoint tests without database dependencies"""
    
    def test_root_endpoint(self):
        """Test root endpoint"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert data["message"] == "Circly API"
        assert data["version"] == "1.0.0"
    
    def test_health_check(self):
        """Test health check endpoint"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data == {"status": "ok"}
    
    def test_docs_endpoint(self):
        """Test API documentation endpoint"""
        response = client.get("/docs")
        assert response.status_code == 200
        assert "text/html" in response.headers["content-type"]
    
    def test_openapi_schema(self):
        """Test OpenAPI schema endpoint"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        data = response.json()
        assert "openapi" in data
        assert "info" in data
        assert data["info"]["title"] == "Circly API"
    
    def test_auth_login_validation(self):
        """Test auth login validation without database"""
        # Test missing device_id
        response = client.post("/v1/auth/login", json={})
        assert response.status_code == 422
        
        # Test empty device_id (should fail validation)
        response = client.post("/v1/auth/login", json={"device_id": ""})
        assert response.status_code == 422
    
    def test_unauthenticated_endpoints(self):
        """Test endpoints that require authentication"""
        # Test accessing protected endpoint without token
        response = client.get("/v1/auth/me")
        assert response.status_code == 403
        
        response = client.get("/v1/users/me")
        assert response.status_code == 403
        
        response = client.get("/v1/circles")
        assert response.status_code == 403
    
    def test_invalid_endpoints(self):
        """Test invalid endpoints"""
        response = client.get("/v1/nonexistent")
        assert response.status_code == 404
        
        response = client.post("/v1/invalid/endpoint")
        assert response.status_code == 404