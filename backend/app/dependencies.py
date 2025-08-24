from fastapi import Depends, HTTPException, status, Request
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
    request: Request,
    db = Depends(get_db)
) -> User:
    """Get current authenticated user (supports both sync and async DB sessions)"""
    print(f"🔐 [get_current_user] Function called for: {request.method} {request.url}")
    print(f"📋 [get_current_user] Request headers: {dict(request.headers)}")
    
    # Manual token extraction
    authorization = request.headers.get("authorization") or request.headers.get("Authorization")
    print(f"🔑 [get_current_user] Authorization header: {authorization}")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not authorization:
        print(f"❌ [get_current_user] No authorization header")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract token from "Bearer <token>" format
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            print(f"❌ [get_current_user] Invalid authorization scheme: {scheme}")
            raise credentials_exception
    except ValueError:
        print(f"❌ [get_current_user] Invalid authorization header format")
        raise credentials_exception
    
    print(f"🎫 [get_current_user] Extracted token: {token[:30]}...")
    
    # Verify token
    print(f"🔍 [get_current_user] Verifying token...")
    payload = verify_token(token)
    print(f"🔍 [get_current_user] Token payload: {payload}")
    
    if payload is None:
        print(f"❌ [get_current_user] Token verification failed")
        raise credentials_exception
    
    user_id: int = payload.get("user_id")
    if user_id is None:
        print(f"❌ [get_current_user] No user_id in token payload")
        raise credentials_exception
    
    print(f"👤 [get_current_user] Looking for user with id: {user_id}")
    
    # Get user - handle both sync and async sessions
    if isinstance(db, AsyncSession):
        # Async session
        result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
        user = result.scalar_one_or_none()
    else:
        # Sync session (for tests)
        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    
    if user is None:
        print(f"❌ [get_current_user] User not found or inactive: {user_id}")
        raise credentials_exception
    
    print(f"✅ [get_current_user] User authenticated: {user.username} (id: {user.id})")
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current admin user"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")
    return current_user