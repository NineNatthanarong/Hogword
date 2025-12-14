from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.models.schemas import AuthRequest, AuthResponse
from app.db.supabase import supabase
from typing import Optional

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to verify JWT token. 
    In a real unified Supabase setup, you might verify against Supabase's JWT secret using python-jose.
    Here we rely on Supabase's `get_user` which validates the session token.
    """
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        return user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.post("/signin-up", response_model=AuthResponse)
async def signin_up(auth_data: AuthRequest):
    """
    **Unified Authentication Endpoint**

    This endpoint handles both **Sign In** and **Sign Up** processes to streamline user onboarding.

    **How to use:**
    - Send a POST request with `email` and `password`.
    - **Behavior:**
        1.  **Attempt Sign In**: The system first tries to log the user in with the provided credentials.
        2.  **Fallback to Sign Up**: If the user does not exist (and sign-in fails), the system automatically attempts to register a new user with the same credentials.
    
    **Returns:**
    - On success (both login or registration), returns an `access_token` and `user_id`.
    - Use this token in the `Authorization: Bearer <token>` header for protected routes.
    """
    try:
        response = supabase.auth.sign_in_with_password({
            "email": auth_data.email,
            "password": auth_data.password
        })
        return AuthResponse(
            access_token=response.session.access_token,
            user_id=response.user.id
        )
    except Exception as e:
        try:
            response = supabase.auth.sign_up({
                "email": auth_data.email,
                "password": auth_data.password
            })
            
            if response.session:
                 return AuthResponse(
                    access_token=response.session.access_token,
                    user_id=response.user.id
                )
            else:
                raise HTTPException(status_code=400, detail="Registration successful. Please check your email to confirm.")
                
        except Exception as signup_error:
             raise HTTPException(status_code=400, detail=str(signup_error))


