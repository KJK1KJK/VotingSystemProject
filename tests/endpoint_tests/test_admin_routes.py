import pytest
from conftest import *
from fastapi import status
from app.models import User, AdminUser
from app.schemas.user_schema import AdminOut
from passlib.hash import bcrypt
from pydantic import ValidationError
from app.schemas.user_schema import AdminOut, AdminBase  # Import your schemas

TEST_ADMIN = {
    "username": "testadmin",
    "email": "admin@example.com",
    "password": "securepassword"
}

@pytest.fixture(scope="function")
def clean_db(db_session):
    # Explicit cleanup before each test
    db_session.rollback()
    # Delete all data in reverse order of dependency
    for table in reversed(Base.metadata.sorted_tables):
        db_session.execute(table.delete())
    db_session.commit()
    yield db_session

def create_test_admin(db_session, admin_data=TEST_ADMIN):
    # Ensure clean state for each admin creation
    db_session.rollback()
    hashed_password = bcrypt.hash(admin_data["password"])
    admin = AdminUser(
        username=admin_data["username"],
        email=admin_data["email"],
        password=hashed_password
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


# Add these helper functions to your test file
def validate_admin_out(data: dict) -> bool:
    """Validate data matches the AdminOut schema"""
    try:
        AdminOut(**data)
        return True
    except ValidationError:
        return False

def validate_admin_base(data: dict) -> bool:
    """Validate data matches the AdminBase schema"""
    try:
        AdminBase(**data)
        return True
    except ValidationError:
        return False
    
class TestAdminRoutes:
    def test_admin_creation(self, client, clean_db):
        response = client.post("/api/admin/", json=TEST_ADMIN)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["email"] == TEST_ADMIN["email"]
        
        # Verify database state
        admin = clean_db.query(AdminUser).first()
        assert admin is not None
        assert admin.email == TEST_ADMIN["email"]

    def test_unique_email_constraint(self, client, clean_db):
        # Create first admin
        client.post("/api/admin/", json=TEST_ADMIN)
        
        # Try duplicate email with different username
        duplicate_data = TEST_ADMIN.copy()
        duplicate_data["username"] = "different_user"
        response = client.post("/api/admin/", json=duplicate_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "admin already registered" in response.json()["detail"].lower()

    def test_unique_username_constraint(self, client, clean_db):
        # Create first admin
        client.post("/api/admin/", json=TEST_ADMIN)
        
        # Try duplicate username with different email
        duplicate_data = TEST_ADMIN.copy()
        duplicate_data["email"] = "different@example.com"
        response = client.post("/api/admin/", json=duplicate_data)
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "admin already registered" in response.json()["detail"].lower()

    def test_delete_admin(self, client, clean_db):
        # Create and delete admin
        admin = create_test_admin(clean_db)
        response = client.delete(f"/api/admin/{admin.id}")
        assert response.status_code == status.HTTP_200_OK
        
        # Verify deletion
        assert clean_db.query(AdminUser).get(admin.id) is None
        assert clean_db.query(User).get(admin.id) is None
        
    def test_get_admin_by_username_success(self, client, clean_db):
        admin = create_test_admin(clean_db)
        response = client.get(f"/api/admin/username/{admin.username}")
        assert response.status_code == status.HTTP_200_OK
        assert validate_admin_out(response.json())
        data = response.json()
        assert data["username"] == admin.username
        assert data["email"] == admin.email

    def test_get_admin_by_username_not_found(self, client):
        response = client.get("/api/admin/username/nonexistent")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Admin not found" in response.json()["detail"]

    def test_get_admin_by_id_success(self, client, clean_db):
        admin = create_test_admin(clean_db)
        response = client.get(f"/api/admin/id/{admin.id}")
        assert response.status_code == status.HTTP_200_OK
        assert validate_admin_out(response.json())
        data = response.json()
        assert data["id"] == admin.id
        assert data["username"] == admin.username

    def test_get_admin_by_id_not_found(self, client):
        response = client.get("/api/admin/id/999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Admin not found" in response.json()["detail"]

    # Get Admin by Email
    def test_get_admin_by_email_success(self, client, clean_db):
        admin = create_test_admin(clean_db)
        response = client.get(f"/api/admin/email/{admin.email}")
        assert response.status_code == status.HTTP_200_OK
        assert validate_admin_out(response.json())
        data = response.json()
        assert data["email"] == admin.email

    def test_get_admin_by_email_not_found(self, client):
        response = client.get("/api/admin/email/wrong@example.com")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "Admin not found" in response.json()["detail"]

    # Check Admin Existence
    def test_check_admin_exists_true(self, client, clean_db):
        admin = create_test_admin(clean_db)
        response = client.get(f"/api/admin/{admin.username}/exists")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"exists": True}

    def test_check_admin_exists_false(self, client):
        response = client.get("/api/admin/nonexistent/exists")
        assert response.status_code == status.HTTP_200_OK
        assert response.json() == {"exists": False}

    def test_login_success(self, client, clean_db):
        create_test_admin(clean_db)
        response = client.post(
            f"/api/admin/login/?email={TEST_ADMIN['email']}&password={TEST_ADMIN['password']}"
            # "/api/admin/login/",
            # data={
            #     "email": TEST_ADMIN["email"], 
            #     "password": TEST_ADMIN["password"]
            # }
        )
        assert response.status_code == status.HTTP_200_OK
        assert validate_admin_base(response.json())

    def test_login_invalid_email(self, client):
        response = client.post(
            "/api/admin/login/",
            data={
                "username": "wrong@example.com",
                "password": "any"
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_login_invalid_password(self, client, clean_db):
        create_test_admin(clean_db)
        response = client.post(
            "/api/admin/login/",
            data={
                "username": TEST_ADMIN["email"],
                "password": "wrong"
            }
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND