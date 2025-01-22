from fastapi import FastAPI
from app.routes.user_routes import router as user_router
from app.services.database import Base, engine

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(user_router, prefix="/api/users", tags=["Users"])