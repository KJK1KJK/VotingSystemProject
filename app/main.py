from fastapi import FastAPI
from app.routes.user_routes import router as user_router
from app.routes.admin_routes import router as admin_router
from app.services.database import Base, engine

#Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
#exit()

app = FastAPI()

#A root route to handle "/"
@app.get("/")
def home():
    return {"message": "Welcome to the Voting System API!"}

app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(admin_router, prefix="/api/admin", tags=["Admins"])