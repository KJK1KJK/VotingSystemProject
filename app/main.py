from fastapi import FastAPI, Security, HTTPException, Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.services.database import Base, engine
from app.middleware import api_key_middleware

import subprocess

#database routes
from app.routes.user_routes import router as user_router
from app.routes.admin_routes import router as admin_router
from app.routes.api_key_routes import router as api_key_router
from app.routes.voting_session_routes import router as voting_session_router
from app.routes.session_settings_routes import router as session_settings_router
from app.routes.question_routes import router as question_router
from app.routes.answer_routes import router as answer_router
from app.routes.candidate_routes import router as candidate_router
from app.routes.vote_routes import router as vote_router
from app.routes.whitelist_routes import router as whitelist_router
from app.routes.feedback_routes import router as feedback_router
from app.routes.user_group_routes import router as user_group_router
from app.routes.group_whitelist_routes import router as group_whitelist_router

#Keycloak SSO router
from app.routes.auth_routes import router as auth_router

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
#exit()

#Update migrations
#subprocess.run(["alembic", "upgrade", "head"])

app = FastAPI()

#Add SessionMiddleware with a secure secret key
app.add_middleware(SessionMiddleware, secret_key="your-very-secret-key")

#Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Uncomment the api keys line if you want to enable authentication!

# Apply API key verification to all API routes
#app.middleware("http")(api_key_middleware)

#A root route to handle "/"
@app.get("/")
def home():
    return {"message": "Welcome to the Voting System API!"}

app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admins"])
#app.include_router(api_key_router, prefix="/api", tags=["API Keys"])
app.include_router(voting_session_router, prefix="/api/voting-sessions", tags=["Voting Sessions"])
app.include_router(session_settings_router, prefix="/api/session-settings", tags=["Session Settings"])
app.include_router(question_router, prefix="/api/questions", tags=["Questions"])
app.include_router(answer_router, prefix="/api/answers", tags=["Answers"])
app.include_router(candidate_router, prefix="/api/candidates", tags=["Candidates"])
app.include_router(vote_router, prefix="/api/votes", tags=["Votes"])
app.include_router(whitelist_router, prefix="/api/whitelist", tags=["Whitelist"])
app.include_router(feedback_router, prefix="/api/feedback", tags=["Feedback"])
app.include_router(user_group_router, prefix="/api/user-groups", tags=["UserGroups"])
app.include_router(group_whitelist_router, prefix="/api/group-whitelist", tags=["GroupWhitelist"])

app.include_router(auth_router, prefix="/auth", tags=["Authentication"])