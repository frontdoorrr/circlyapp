from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.utils.security import verify_token
import inspect

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db = Depends(get_db)
) -> User:
    """Get current authenticated user (supports both sync and async DB sessions)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify token
    payload = verify_token(credentials.credentials)
    if payload is None:
        raise credentials_exception
    
    user_id: int = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
    
    # Get user - handle both sync and async sessions
    if isinstance(db, AsyncSession):
        # Async session
        result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
        user = result.scalar_one_or_none()
    else:
        # Sync session (for tests)
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if user is None:
        raise credentials_exception
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user