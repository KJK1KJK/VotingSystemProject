# tests/endpoint_tests/test_user_routes.py
import pytest
from fastapi import status
from app.models.user import User
from app.schemas.user_schema import UserOut, UserBase, UserCreate, LoginRequest
from passlib.hash import bcrypt
# Test data for creating a user
TEST_USER_DATA = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "secret"
}

TEST_USER_DATA_2 = {
    "username": "anotheruser",
    "email": "another@example.com",
    "password": "secret"
}

# ------------------------------------------------------------------------------
# Helper Function
# ------------------------------------------------------------------------------
def create_test_user(db_session, username="testuser", email="test@example.com", password="secret"):
    """
    Create and return a User instance in the database.
    The password is hashed using bcrypt.
    """
    hashed = bcrypt.hash(password)
    user = User(username=username, email=email, password=hashed, type="user")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

# ------------------------------------------------------------------------------
# Tests for User Routes
# ------------------------------------------------------------------------------
class TestUserRoutes:
    # GET /api/users/ - get all users
    def test_get_users_success(self, client, db_session):
        # Create two test users.
        user1 = create_test_user(db_session, username="user1", email="user1@example.com")
        user2 = create_test_user(db_session, username="user2", email="user2@example.com")
        
        response = client.get("/api/users/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Verify that both users appear in the returned list.
        usernames = [u["username"] for u in data]
        assert user1.username in usernames
        assert user2.username in usernames

    # POST /api/users/ - create a new user
    def test_create_user_success(self, client, db_session):
        payload = TEST_USER_DATA.copy()
        response = client.post("/api/users/", json=payload)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == payload["username"]
        assert data["email"] == payload["email"]
        # Verify the user was created in the DB.
        user_in_db = db_session.query(User).filter(User.username == payload["username"]).first()
        assert user_in_db is not None

    def test_create_user_already_registered(self, client, db_session):
        # Create a user first.
        payload = TEST_USER_DATA.copy()
        create_test_user(db_session, username=payload["username"], email=payload["email"])
        # Try to create the same user again.
        response = client.post("/api/users/", json=payload)
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    # DELETE /api/users/{user_id} - delete a user
    def test_delete_user_success(self, client, db_session):
        user = create_test_user(db_session, username="todelete", email="todelete@example.com")
        response = client.delete(f"/api/users/{user.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "deleted successfully" in data["message"].lower()
        # Verify the user is removed from the DB.
        user_in_db = db_session.query(User).filter(User.id == user.id).first()
        assert user_in_db is None

    def test_delete_user_not_found(self, client):
        response = client.delete("/api/users/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "user not found" in response.json()["detail"].lower()

    # GET /api/users/username/{user_name} - get user by username
    def test_get_user_by_username_success(self, client, db_session):
        user = create_test_user(db_session, username="uniqueuser", email="unique@example.com")
        response = client.get(f"/api/users/username/{user.username}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == user.username
        assert data["email"] == user.email

    def test_get_user_by_username_not_found(self, client):
        response = client.get("/api/users/username/nonexistentuser")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "user not found" in response.json()["detail"].lower()

    # GET /api/users/id/{user_id} - get user by id
    def test_get_user_by_id_success(self, client, db_session):
        user = create_test_user(db_session, username="useriduser", email="userid@example.com")
        response = client.get(f"/api/users/id/{user.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == user.username
        assert data["email"] == user.email

    def test_get_user_by_id_not_found(self, client):
        response = client.get("/api/users/id/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "user not found" in response.json()["detail"].lower()

    # GET /api/users/email/{user_email} - get user by email
    def test_get_user_by_email_success(self, client, db_session):
        user = create_test_user(db_session, username="emailexample", email="emailexample@example.com")
        response = client.get(f"/api/users/email/{user.email}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == user.username
        assert data["email"] == user.email

    def test_get_user_by_email_not_found(self, client):
        response = client.get("/api/users/email/nonexistent@example.com")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "user not found" in response.json()["detail"].lower()

    # GET /api/users/{user_name}/exists - check if user exists
    def test_check_user_exists_true(self, client, db_session):
        user = create_test_user(db_session, username="existsuser", email="exists@example.com")
        response = client.get(f"/api/users/{user.username}/exists")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["exists"] is True

    def test_check_user_exists_false(self, client):
        response = client.get("/api/users/nonexistentuser/exists")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["exists"] is False

    def test_login_success(self, client, db_session):
        password = "secret"
        user = create_test_user(
            db_session, 
            username="loginuser", 
            email="login@example.com", 
            password=password
        )
        
        response = client.post(
            "/api/users/login/",
            json={"email": user.email, "password": password} 
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        
        assert data["username"] == user.username
        assert data["email"] == user.email

    def test_login_invalid_email(self, client):
        email = "nonexistend@domain.com"
        password = "nonexistent"
        response = client.post(
            "/api/users/login/",
            json={"email": email, "password": password} 
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "invalid email or password" in response.json()["detail"].lower()
