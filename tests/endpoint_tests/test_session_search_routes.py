import pytest
from datetime import datetime, timedelta
from fastapi import status
from app.models.user import User
from app.models.voting_session import VotingSession
from app.models.whitelist import Whitelist
from app.schemas.voting_session import VotingSessionResponse
from app.schemas.session_search import VotingSessionSearchParams, WhitelistSearchParams

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------

def create_test_user(db_session, username="testuser", email="test@example.com"):
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

def create_test_voting_session(db_session, creator_id, title="Test Session", 
                               description="A test session", time_created=None, 
                               is_published=True):
    """
    Creates and returns a VotingSession instance.
    
    **Note:** In your model, the 'whitelist' attribute is defined as both a column 
    (Boolean) and a relationship. Here we simulate a public session by simply not adding
    any whitelist record. Restricted sessions (whitelist‐required) will be simulated via a 
    corresponding Whitelist entry.
    """
    if time_created is None:
        time_created = datetime.utcnow()
    voting_session = VotingSession(
        title=title,
        description=description,
        creator_id=creator_id,
        time_created=time_created,
        is_published=is_published
        # Do not pass a value for 'whitelist' here—its relationship will be managed separately.
    )
    db_session.add(voting_session)
    db_session.commit()
    db_session.refresh(voting_session)
    return voting_session

def create_test_whitelist(db_session, session_id, user_id):
    """
    Creates and returns a Whitelist record linking a user to a voting session.
    """
    whitelist_entry = Whitelist(session_id=session_id, user_id=user_id)
    db_session.add(whitelist_entry)
    db_session.commit()
    db_session.refresh(whitelist_entry)
    return whitelist_entry

# ------------------------------------------------------------------------------
# Tests for /search/my-polls endpoint
# ------------------------------------------------------------------------------
class TestSearchMyPolls:
    def test_search_my_polls_no_filter(self, client, db_session):
        """
        Create two voting sessions by a given user and verify that a search with no
        additional filters returns both sessions.
        """
        creator = create_test_user(db_session, username="creator1", email="creator1@example.com")
        session1 = create_test_voting_session(db_session, creator.id, title="Session One")
        session2 = create_test_voting_session(db_session, creator.id, title="Session Two")

        response = client.get(f"/api/voting-sessions/search/my-polls?user_id={creator.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Expect both sessions to be returned.
        returned_ids = [item["id"] for item in data]
        assert session1.id in returned_ids
        assert session2.id in returned_ids

    def test_search_my_polls_title_filter(self, client, db_session):
        """
        Create sessions with distinct titles and filter by a title substring.
        """
        creator = create_test_user(db_session, username="creator2", email="creator2@example.com")
        session1 = create_test_voting_session(db_session, creator.id, title="Unique Title Session")
        # Create another session that should not match the title filter.
        create_test_voting_session(db_session, creator.id, title="Another Session")

        response = client.get(
            f"/api/voting-sessions/search/my-polls?user_id={creator.id}&title=Unique"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Expect only the session with 'Unique' in its title.
        assert len(data) == 1
        assert data[0]["id"] == session1.id

    def test_search_my_polls_date_filter(self, client, db_session):
        """
        Create a voting session with a known creation date and filter by day, month, and year.
        """
        creator = create_test_user(db_session, username="creator3", email="creator3@example.com")
        fixed_date = datetime(2020, 5, 15, 12, 0, 0)
        session = create_test_voting_session(db_session, creator.id, title="Dated Session", time_created=fixed_date)

        # Use query parameters for day, month, and year.
        url = (
            f"/api/voting-sessions/search/my-polls?user_id={creator.id}"
            f"&day=15&month=5&year=2020"
        )
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        returned_ids = [item["id"] for item in data]
        assert session.id in returned_ids

# ------------------------------------------------------------------------------
# Tests for /search/whitelisted endpoint
# ------------------------------------------------------------------------------
class TestSearchWhitelistedPolls:
    def test_search_whitelisted_includes_public_and_whitelisted(self, client, db_session):
        """
        Verify that a search for whitelisted polls returns sessions where either:
         - the user is explicitly whitelisted (restricted session), or
         - the session is public (no whitelist record exists).
        """
        creator = create_test_user(db_session, username="creator4", email="creator4@example.com")
        searching_user = create_test_user(db_session, username="voter1", email="voter1@example.com")
        
        # Create a public session (simulate by not adding a whitelist record).
        session_public = create_test_voting_session(db_session, creator.id, title="Public Session")
        
        # Create a restricted session and add a whitelist entry for the searching user.
        session_restricted = create_test_voting_session(db_session, creator.id, title="Restricted Session")
        create_test_whitelist(db_session, session_restricted.id, searching_user.id)
        
        # Create another restricted session for which the searching user is not whitelisted.
        session_restricted_not = create_test_voting_session(db_session, creator.id, title="Restricted Not For User")
        
        response = client.get(f"/api/voting-sessions/search/whitelisted?user_id={searching_user.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        returned_ids = [item["id"] for item in data]
        # Expect the public session and the restricted session (where user is whitelisted) to appear.
        assert session_public.id in returned_ids
        assert session_restricted.id in returned_ids
        # The restricted session without a whitelist entry for the user should not appear.
        assert session_restricted_not.id not in returned_ids

    def test_search_whitelisted_creator_name_filter(self, client, db_session):
        """
        Create a session whose creator has a distinctive username and filter by that name.
        """
        # Create a creator with a unique username.
        creator = create_test_user(db_session, username="UniqueCreator", email="unique@example.com")
        session1 = create_test_voting_session(db_session, creator.id, title="Session by UniqueCreator")
        
        # Create another session by a different creator.
        other_creator = create_test_user(db_session, username="OtherCreator", email="other@example.com")
        session2 = create_test_voting_session(db_session, other_creator.id, title="Session by Other")
        
        # Query with the creator_name filter. (If your join uses User.name, adjust accordingly; here we use username.)
        response = client.get(
            f"/api/voting-sessions/search/whitelisted?user_id={creator.id}&creator_name=Unique"
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        returned_ids = [item["id"] for item in data]
        # Expect only the session by the unique creator to be returned.
        assert session1.id in returned_ids
        assert session2.id not in returned_ids

    def test_search_whitelisted_date_filter(self, client, db_session):
        """
        Create a session with a fixed creation date and filter by start_date and end_date.
        """
        creator = create_test_user(db_session, username="creator_date", email="date@example.com")
        fixed_date = datetime(2021, 8, 20, 10, 0, 0)
        session = create_test_voting_session(db_session, creator.id, title="Dated Session", time_created=fixed_date)
        
        start_date = fixed_date - timedelta(days=1)
        end_date = fixed_date + timedelta(days=1)
        url = (
            f"/api/voting-sessions/search/whitelisted?user_id={creator.id}"
            f"&start_date={start_date.isoformat()}&end_date={end_date.isoformat()}"
        )
        response = client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        returned_ids = [item["id"] for item in data]
        assert session.id in returned_ids
