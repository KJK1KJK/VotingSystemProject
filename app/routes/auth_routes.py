from fastapi import APIRouter, Request, Depends, HTTPException
from authlib.integrations.starlette_client import OAuth
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session
from urllib.parse import urlencode
from jose import jwt, jwk, JWTError
from datetime import datetime

from app.models import User

from app.services.database import get_db
from app.utils.auth_utils import get_current_user

router = APIRouter()
oauth = OAuth()

KEYCLOAK_URL = "localhost:8080"
BACKEND_URL = "localhost:8000"
FRONTEND_URL = "localhost:3000"
REALM = "VotingSystem"
CLIENT_ID = "VotingSystem"

#Register Keycloak OAuth client
oauth.register(
    #Internal working variables
    name='keycloak',
    client_id=CLIENT_ID,
    client_secret='XEshRA6gO1urtYvdsjy0jObhz8PJYi0N',
    server_metadata_url=f'http://{KEYCLOAK_URL}/realms/{REALM}/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid profile email'},
)

@router.get("/login")
async def login(request: Request):
    redirect_uri = f"http://{BACKEND_URL}/auth/auth"
    response = await oauth.keycloak.authorize_redirect(request, redirect_uri)
    return response

@router.get("/auth")
async def auth(request: Request, db: Session = Depends(get_db)):
    try:
        #Complete the OAuth flow and get the token
        token = await oauth.keycloak.authorize_access_token(request)
        
        #Extract user info from the token
        user_info = token.get('userinfo')
        if not user_info:
            raise HTTPException(status_code=400, detail="Could not get user info")
        
        #Get or create user in database
        email = user_info.get('email')
        username = user_info.get('preferred_username') or email.split('@')[0]
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by provider")
        
        #Check if user exists in DB
        user = db.query(User).filter(User.email == email).first()
        
        if not user:
            user = User(
                username=username,
                email=email,
                password="",  #Not needed for OAuth users
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        #Redirect to frontend with just username and user ID
        frontend_url = f"http://{FRONTEND_URL}/auth/callback"
        redirect_url = f"{frontend_url}?username={username}&user_id={user.id}"
        return RedirectResponse(url=redirect_url)
        
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        frontend_url = f"http://{FRONTEND_URL}/login"
        error_url = f"{frontend_url}?error={str(e)}"
        return RedirectResponse(url=error_url)

@router.get("/register")
async def register(request: Request):
    try:
        redirect_uri = f"http://{BACKEND_URL}/auth/auth"
        
        #Keycloak-specific registration URL
        registration_url = f"http://{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/registrations"
        
        #Create base authorization URL (different from login)
        base_auth_url = await oauth.keycloak.create_authorization_url(redirect_uri)
        
        #Store state in session for security validation
        request.session['oauth_state'] = base_auth_url['state']
        
        #Build registration URL with parameters
        params = {
            "client_id": CLIENT_ID,
            "response_type": "code",
            "scope": "openid profile email",
            "redirect_uri": redirect_uri,
            "state": base_auth_url['state'],
        }
        
        full_url = f"{registration_url}?{urlencode(params)}"
        return RedirectResponse(url=full_url)
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        frontend_url = f"http://{FRONTEND_URL}/register"
        error_url = f"{frontend_url}?error=registration_failed"
        return RedirectResponse(url=error_url)

@router.get("/logout")
async def logout(request: Request):
    try:
        #Clear local session
        request.session.clear()
        
        #Keycloak logout URL
        logout_url = (
            f"http://{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/logout"
            f"?post_logout_redirect_uri=http://{FRONTEND_URL}"
            f"&client_id={CLIENT_ID}"
        )
        
        return RedirectResponse(url=logout_url)
        
    except Exception as e:
        print(f"Logout error: {str(e)}")
        return RedirectResponse(url=f"http://{FRONTEND_URL}")