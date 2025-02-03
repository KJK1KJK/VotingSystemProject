import pytest
from fastapi import status
from app.models.voting_session import VotingSession
from app.models.session_settings import SessionSettings
from app.models.user import User
from app.schemas.session_settings import SessionSettingsResponse, SessionSettingsCreate, SessionSettingsUpdate

# ------------------------------------------------------------------------------
# Test Data
# ------------------------------------------------------------------------------
TEST_SETTING_DATA = {
    "setting_name": "max_votes",
    "setting_value": "5"
}

TEST_SETTING_UPDATE = {
    "setting_name": "max_votes",
    "setting_value": "10"
}

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------
def create_test_user(db_session, username="dummyuser", email="dummy@example.com"):
    """
    Creates and returns a dummy User instance.
    Adjust attributes as needed for your User model.
    """
    user_data = {
        "username": username,
        "email": email,
        "password": "secret",
        "type": "user"
    }
    user = User(**user_data)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

def create_test_voting_session(db_session):
    """
    Creates and returns a VotingSession instance.
    The VotingSession model requires a title and a creator_id.
    """
    creator = create_test_user(db_session)
    voting_session = VotingSession(
        title="Test Voting Session",
        description="A session created for testing",
        creator_id=creator.id,
        is_published=True
    )
    db_session.add(voting_session)
    db_session.commit()
    db_session.refresh(voting_session)
    return voting_session

def create_test_session_setting(db_session, session_id, extra_data: dict = None):
    """
    Creates and returns a SessionSettings instance associated with the given voting session.
    """
    data = TEST_SETTING_DATA.copy()
    if extra_data:
        data.update(extra_data)
    setting = SessionSettings(
        session_id=session_id,
        **data
    )
    db_session.add(setting)
    db_session.commit()
    db_session.refresh(setting)
    return setting

# ------------------------------------------------------------------------------
# Tests for Session Settings Routes
# ------------------------------------------------------------------------------
class TestSessionSettingsRoutes:
    # Create Session Setting Tests
    def test_create_session_setting_success(self, client, db_session):
        # Create a valid voting session first.
        voting_session = create_test_voting_session(db_session)
        payload = TEST_SETTING_DATA.copy()
        
        response = client.post(
            f"/api/session-settings/{voting_session.id}/settings/",
            json=payload
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Verify returned data matches the input payload.
        assert data["setting_name"] == payload["setting_name"]
        assert data["setting_value"] == payload["setting_value"]
        assert data["session_id"] == voting_session.id

    def test_create_session_setting_session_not_found(self, client):
        # Attempt to create a setting for a non-existent session.
        payload = TEST_SETTING_DATA.copy()
        response = client.post(
            "/api/session-settings/9999/settings/",
            json=payload
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "voting session not found" in response.json()["detail"].lower()

    # Get Session Settings Tests
    def test_get_session_settings_success(self, client, db_session):
        # Create a voting session and add a session setting.
        voting_session = create_test_voting_session(db_session)
        created_setting = create_test_session_setting(db_session, voting_session.id)
        
        response = client.get(f"/api/session-settings/{voting_session.id}/settings/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Expect a list with at least one setting.
        assert isinstance(data, list)
        assert len(data) >= 1
        returned_ids = [s["id"] for s in data]
        assert created_setting.id in returned_ids

    def test_get_session_settings_no_settings(self, client, db_session):
        # Create a voting session without adding any settings.
        voting_session = create_test_voting_session(db_session)
        
        response = client.get(f"/api/session-settings/{voting_session.id}/settings/")
        # The endpoint should return 404 if no settings exist.
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "no settings found for this session" in response.json()["detail"].lower()

    # Update Session Setting Tests
    def test_update_session_setting_success(self, client, db_session):
        # Create a voting session and add a session setting.
        voting_session = create_test_voting_session(db_session)
        setting = create_test_session_setting(db_session, voting_session.id)
        update_payload = TEST_SETTING_UPDATE.copy()
        
        response = client.put(
            f"/api/session-settings/settings/{setting.id}",
            json=update_payload
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Verify that the update was applied.
        assert data["setting_name"] == update_payload["setting_name"]
        assert data["setting_value"] == update_payload["setting_value"]
        
        # Check the update directly in the DB.
        updated_setting = db_session.query(SessionSettings).get(setting.id)
        assert updated_setting.setting_value == update_payload["setting_value"]

    def test_update_session_setting_not_found(self, client):
        update_payload = TEST_SETTING_UPDATE.copy()
        response = client.put(
            "/api/session-settings/settings/9999",
            json=update_payload
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "session setting not found" in response.json()["detail"].lower()

    # Delete Session Setting Tests
    def test_delete_session_setting_success(self, client, db_session):
        # Create a voting session and add a session setting.
        voting_session = create_test_voting_session(db_session)
        setting = create_test_session_setting(db_session, voting_session.id)
        
        response = client.delete(f"/api/session-settings/settings/{setting.id}")
        assert response.status_code == status.HTTP_200_OK
        # Verify deletion by ensuring the setting is no longer in the DB.
        deleted_setting = db_session.query(SessionSettings).get(setting.id)
        assert deleted_setting is None

    def test_delete_session_setting_not_found(self, client):
        response = client.delete("/api/session-settings/settings/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "session setting not found" in response.json()["detail"].lower()
