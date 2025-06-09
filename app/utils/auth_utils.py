from fastapi import Depends, HTTPException
from fastapi.security import OAuth2AuthorizationCodeBearer
from jose import jwt, jwk, JWTError
from sqlalchemy.orm import Session
import httpx

from app.services.database import get_db
from app.models import User
from app.schemas.user_schema import UserOut

#Keycloak config
KEYCLOAK_URL = "http://keycloak:8080"
REALM = "VotingSystem"
CLIENT_ID = "VotingSystem"

OIDC_CONFIG_URL = f"{KEYCLOAK_URL}/realms/{REALM}/.well-known/openid-configuration"

oauth2_scheme = OAuth2AuthorizationCodeBearer(
    authorizationUrl=f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/auth",
    tokenUrl=f"{KEYCLOAK_URL}/realms/{REALM}/protocol/openid-connect/token"
)

#Caches
oidc_config = {}
jwks = {}

#Load OIDC configuration and JWKS keys
async def load_config():
    global oidc_config, jwks
    async with httpx.AsyncClient() as client:
        oidc_config = (await client.get(OIDC_CONFIG_URL)).json()
        jwks = (await client.get(oidc_config["jwks_uri"])).json()

#Get or create the current user from Keycloak token
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> UserOut:
    if not jwks:
        await load_config()

    try:
        #Decode JWT header and find corresponding key
        header = jwt.get_unverified_header(token)
        key = next(k for k in jwks["keys"] if k["kid"] == header["kid"])

        #Construct public key in a way jose understands
        public_key = jwk.construct(key)

        #Decode token
        payload = jwt.decode(
            token,
            key=public_key.to_pem().decode(),
            algorithms=[key["alg"]],
            audience=CLIENT_ID,
            options={"verify_at_hash": False}
        )

        email = payload.get("email")
        username = payload.get("preferred_username") or email.split("@")[0]

        if not email:
            raise HTTPException(status_code=403, detail="Email not found in token")

        #Check if user exists in DB
        user = db.query(User).filter(User.email == email).first()

        if not user:
            user = User(
                username=username,
                email=email,
                password="",  #Not needed, since Keycloak handles auth
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return UserOut.from_orm(user)

    except (JWTError, Exception) as e:
        raise HTTPException(status_code=401, detail="Invalid token")
