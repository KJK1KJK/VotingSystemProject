import pytest
from fastapi import status
from datetime import datetime
from app.models.user import User
from app.models.voting_session import VotingSession
from app.schemas.voting_session import VotingSessionCreate, VotingSessionUpdate, VotingSessionResponse

# ------------------------------------------------------------------------------
# Test Data
# ------------------------------------------------------------------------------
TEST_SESSION_DATA = {
    "title": "New Voting Session",
    "description": "A session for testing",
    "whitelist": False
}

TEST_SESSION_UPDATE = {
    "title": "Updated Voting Session",
    "description": "Updated session description",
    "is_published": True,
    "whitelist": True
}

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------
def create_test_user(db_session, username="testuser", email="testuser@example.com", password="secret"):
    """
    Creates and returns a dummy User instance.
    """
    user_data = {
        "username": username,
        "email": email,
        "password": password,  # Assume that the route that creates users handles hashing.
        "type": "user"
    }
    user = User(**user_data)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

def create_test_voting_session(db_session, creator_id, extra_data: dict = None):
    """
    Creates and returns a VotingSession instance associated with the given creator.
    Uses TEST_SESSION_DATA as the base data.
    """
    data = TEST_SESSION_DATA.copy()
    if extra_data:
        data.update(extra_data)
    session = VotingSession(
        title=data["title"],
        description=data["description"],
        creator_id=creator_id,
        whitelist=data["whitelist"]
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session

# ------------------------------------------------------------------------------
# Tests for Voting Session Routes
# ------------------------------------------------------------------------------
class TestVotingSessionRoutes:
    # Create Voting Session Tests
    def test_create_voting_session_success(self, client, db_session):
        """
        Test that a voting session is created successfully.
        The endpoint expects a VotingSessionCreate in the body and a query parameter 'creator_id'.
        """
        creator = create_test_user(db_session, username="creator1", email="creator1@example.com")
        payload = TEST_SESSION_DATA.copy()
        response = client.post(f"/api/voting-sessions/?creator_id={creator.id}", json=payload)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["title"] == payload["title"]
        assert data["description"] == payload["description"]
        assert data["whitelist"] == payload["whitelist"]
        assert data["creator_id"] == creator.id
        # Check that the returned response includes an ID, a time_created and is_published field.
        assert "id" in data
        assert "time_created" in data
        # By default, new sessions are not published (unless your model sets a default).
        assert data["is_published"] is False

    def test_create_voting_session_user_not_found(self, client):
        """
        Test that creating a session for a non-existent creator returns 404.
        """
        payload = TEST_SESSION_DATA.copy()
        response = client.post("/api/voting-sessions/?creator_id=9999", json=payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "user not found" in response.json()["detail"].lower()

    # Get All Voting Sessions Tests
    def test_get_voting_sessions_success(self, client, db_session):
        """
        Test that GET /api/voting-sessions/ returns all voting sessions.
        """
        creator = create_test_user(db_session, username="creator2", email="creator2@example.com")
        session = create_test_voting_session(db_session, creator.id)
        response = client.get("/api/voting-sessions/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Expect a non-empty list.
        assert isinstance(data, list)
        returned_ids = [s["id"] for s in data]
        assert session.id in returned_ids

    def test_get_voting_sessions_no_sessions(self, client, db_session):
        """
        Test that if no voting sessions exist, GET /api/voting-sessions/ returns 404.
        """
        # Delete all sessions (if any exist).
        sessions = db_session.query(VotingSession).all()
        for s in sessions:
            db_session.delete(s)
        db_session.commit()
        response = client.get("/api/voting-sessions/")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "no voting sessions found" in response.json()["detail"].lower()

    # Get Voting Session by ID Tests
    def test_get_voting_session_by_id_success(self, client, db_session):
        """
        Test that a voting session can be retrieved by its ID.
        """
        creator = create_test_user(db_session, username="creator3", email="creator3@example.com")
        session = create_test_voting_session(db_session, creator.id)
        response = client.get(f"/api/voting-sessions/{session.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == session.id
        assert data["title"] == session.title

    def test_get_voting_session_by_id_not_found(self, client):
        """
        Test that retrieving a non-existent voting session returns 404.
        """
        response = client.get("/api/voting-sessions/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "voting session not found" in response.json()["detail"].lower()

    # Delete Voting Session Tests
    def test_delete_voting_session_success(self, client, db_session):
        """
        Test that a voting session is deleted successfully.
        """
        creator = create_test_user(db_session, username="creator4", email="creator4@example.com")
        session = create_test_voting_session(db_session, creator.id)
        response = client.delete(f"/api/voting-sessions/{session.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "deleted successfully" in data["detail"].lower()
        # Verify deletion.
        deleted = db_session.query(VotingSession).filter(VotingSession.id == session.id).first()
        assert deleted is None

    def test_delete_voting_session_not_found(self, client):
        """
        Test that deleting a non-existent voting session returns 404.
        """
        response = client.delete("/api/voting-sessions/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "voting session not found" in response.json()["detail"].lower()

    # Publish Voting Session Tests
    def test_publish_voting_session_success(self, client, db_session):
        """
        Test that publishing a voting session marks it as published.
        """
        creator = create_test_user(db_session, username="creator5", email="creator5@example.com")
        # Create a session with is_published False.
        session = create_test_voting_session(db_session, creator.id, extra_data={"is_published": False})
        response = client.patch(f"/api/voting-sessions/{session.id}/publish")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "published successfully" in data["detail"].lower()
        # Verify the session is now published.
        updated_session = db_session.query(VotingSession).filter(VotingSession.id == session.id).first()
        assert updated_session.is_published is True

    def test_publish_voting_session_not_found(self, client):
        """
        Test that publishing a non-existent session returns 404.
        """
        response = client.patch("/api/voting-sessions/9999/publish")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "voting session not found" in response.json()["detail"].lower()

    # Get Published Sessions for a User Tests
    def test_get_published_sessions_success(self, client, db_session):
        """
        Test retrieving all published sessions for a given user.
        """
        creator = create_test_user(db_session, username="creator6", email="creator6@example.com")
        # Create one published session and one draft.
        session_published = create_test_voting_session(db_session, creator.id, extra_data={"is_published": True})
        create_test_voting_session(db_session, creator.id, extra_data={"is_published": False})
        response = client.get(f"/api/voting-sessions/user/{creator.id}/published")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        returned_ids = [s["id"] for s in data]
        assert session_published.id in returned_ids

    def test_get_published_sessions_not_found(self, client, db_session):
        """
        Test that if a user has no published sessions, 404 is returned.
        """
        creator = create_test_user(db_session, username="creator7", email="creator7@example.com")
        # Create only drafts.
        create_test_voting_session(db_session, creator.id, extra_data={"is_published": False})
        response = client.get(f"/api/voting-sessions/user/{creator.id}/published")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "no published voting sessions found" in response.json()["detail"].lower()

    # Get Draft Sessions for a User Tests
    def test_get_draft_sessions_success(self, client, db_session):
        """
        Test retrieving all unpublished (draft) sessions for a given user.
        """
        creator = create_test_user(db_session, username="creator8", email="creator8@example.com")
        session_draft = create_test_voting_session(db_session, creator.id, extra_data={"is_published": False})
        # Create a published session that should not be returned.
        create_test_voting_session(db_session, creator.id, extra_data={"is_published": True})
        response = client.get(f"/api/voting-sessions/user/{creator.id}/drafts")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        returned_ids = [s["id"] for s in data]
        assert session_draft.id in returned_ids

    def test_get_draft_sessions_not_found(self, client, db_session):
        """
        Test that if a user has no draft sessions, 404 is returned.
        """
        creator = create_test_user(db_session, username="creator9", email="creator9@example.com")
        # Create only published sessions.
        create_test_voting_session(db_session, creator.id, extra_data={"is_published": True})
        response = client.get(f"/api/voting-sessions/user/{creator.id}/drafts")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "no unpublished drafts found" in response.json()["detail"].lower()

    # Update Voting Session Tests
    def test_update_voting_session_success(self, client, db_session):
        """
        Test that an existing voting session can be updated successfully.
        """
        creator = create_test_user(db_session, username="creator10", email="creator10@example.com")
        session = create_test_voting_session(db_session, creator.id)
        update_payload = TEST_SESSION_UPDATE.copy()
        response = client.put(f"/api/voting-sessions/{session.id}", json=update_payload)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Verify updates.
        assert data["title"] == update_payload["title"]
        assert data["description"] == update_payload["description"]
        assert data["is_published"] == update_payload["is_published"]
        assert data["whitelist"] == update_payload["whitelist"]
        # Verify in the DB.
        updated_session = db_session.query(VotingSession).filter(VotingSession.id == session.id).first()
        assert updated_session.title == update_payload["title"]

    def test_update_voting_session_not_found(self, client):
        """
        Test that updating a non-existent voting session returns 404.
        """
        update_payload = TEST_SESSION_UPDATE.copy()
        response = client.put("/api/voting-sessions/9999", json=update_payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "voting session not found" in response.json()["detail"].lower()
