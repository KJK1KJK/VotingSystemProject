from fastapi import APIRouter, Request, Depends
from authlib.integrations.starlette_client import OAuth
from starlette.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.services.database import get_db
from app.utils.auth_utils import get_current_user

router = APIRouter()
oauth = OAuth()

#Register Keycloak OAuth client
oauth.register(
    name='keycloak',
    client_id='VotingSystem',
    client_secret='h9r83L145P9tyo7RcwV4LrtLChYcOQrP',
    server_metadata_url='http://localhost:8080/realms/VotingSystem/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid profile email'},
)

@router.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for('auth')
    return await oauth.keycloak.authorize_redirect(request, redirect_uri)

@router.get("/auth")
async def auth(request: Request, db: Session = Depends(get_db)):
    token = await oauth.keycloak.authorize_access_token(request)
    user_info = await oauth.keycloak.parse_id_token(request, token)

    #Create or fetch user in the database
    user = get_current_user(token['id_token'], db)


    frontend_url = f"http://localhost:3000/auth/callback?token={user_info['id_token']}&user_id={user.id}"

    #Redirect user or return info
    return RedirectResponse(url=frontend_url)