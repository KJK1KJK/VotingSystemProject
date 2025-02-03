# tests/test_feedback_routes.py
import pytest
from fastapi import status
from app.models.user import User
from app.models.feedback import Feedback
from app.schemas.feedback import FeedbackCreate, FeedbackResponse

# Test data
TEST_USER = {
    "username": "testuser",
    "email": "testuser@example.com",
    "password": "secret"
}

TEST_FEEDBACK = {
    "user_id": None,  # to be set when a test user is created
    "message": "This is a test feedback message."
}

# Helper functions to create test objects in the DB
def create_test_user(db_session):
    """Creates and returns a User instance."""
    # Assuming the User model has attributes username, email, and password.
    user = User(**TEST_USER)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

def create_test_feedback(db_session, user_id):
    """Creates and returns a Feedback instance linked to the given user_id."""
    feedback_data = TEST_FEEDBACK.copy()
    feedback_data["user_id"] = user_id
    feedback = Feedback(**feedback_data)
    db_session.add(feedback)
    db_session.commit()
    db_session.refresh(feedback)
    return feedback

class TestFeedbackRoutes:
    # Create Feedback Tests
    def test_create_feedback_success(self, client, db_session):
        # Create a test user first.
        user = create_test_user(db_session)
        payload = TEST_FEEDBACK.copy()
        payload["user_id"] = user.id

        response = client.post(
            "/api/feedback/",
            json=payload
        )
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["message"] == TEST_FEEDBACK["message"]
        assert data["user_id"] == user.id

    def test_create_feedback_user_not_found(self, client):
        # Use a non-existent user_id.
        payload = TEST_FEEDBACK.copy()
        payload["user_id"] = 9999

        response = client.post(
            "/api/feedback/",
            json=payload
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "user not found" in response.json()["detail"].lower()

    # Get All Feedback Tests
    def test_get_all_feedback(self, client, db_session):
        # Create two test feedback entries.
        user = create_test_user(db_session)
        create_test_feedback(db_session, user.id)
        create_test_feedback(db_session, user.id)

        response = client.get("/api/feedback/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # At least two entries should be returned.
        assert isinstance(data, list)
        assert len(data) >= 2

    # Get Feedback by User Tests
    def test_get_feedback_by_user_success(self, client, db_session):
        user = create_test_user(db_session)
        feedback = create_test_feedback(db_session, user.id)

        response = client.get(f"/api/feedback/user/{user.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        # Should have at least one feedback entry.
        assert len(data) >= 1
        # Check that the returned feedback belongs to the correct user.
        for item in data:
            assert item["user_id"] == user.id

    def test_get_feedback_by_user_not_found(self, client, db_session):
        # Ensure no feedback exists for a newly created user.
        user = create_test_user(db_session)
        response = client.get(f"/api/feedback/user/{user.id}")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "no feedback found" in response.json()["detail"].lower()

    # Get Feedback by ID Tests
    def test_get_feedback_by_id_success(self, client, db_session):
        user = create_test_user(db_session)
        feedback = create_test_feedback(db_session, user.id)

        response = client.get(f"/api/feedback/{feedback.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == feedback.id
        assert data["message"] == feedback.message
        assert data["user_id"] == user.id

    def test_get_feedback_by_id_not_found(self, client):
        response = client.get("/api/feedback/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "feedback not found" in response.json()["detail"].lower()
