import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.main import app
from app.database import get_db, Base
from app.models.user import User
import os

# Test database URL - use PostgreSQL test database  
TEST_DATABASE_URL = os.getenv(
    "TEST_DATABASE_URL", 
    "postgresql://test_user:test_password@test-db:5432/test_circly_db"
)

# Sync test engine for TestClient compatibility
test_engine = create_engine(TEST_DATABASE_URL)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(scope="function")
def db_session():
    """Test database session"""
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def client(db_session: Session):
    """Test client with database dependency override"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session: Session):
    """Create test user"""
    user = User(device_id="test_device_123", username="testuser", display_name="Test User")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def auth_headers(test_user):
    """Authorization headers for authenticated requests"""
    from app.utils.security import create_access_token
    token = create_access_token(data={"user_id": test_user.id})
    return {"Authorization": f"Bearer {token}"}