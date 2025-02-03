import pytest
from datetime import datetime
from fastapi import status
from app.models.vote import Vote
from app.models.user import User
from app.models.candidate import Candidate
from app.models.question import Question
from app.models.voting_session import VotingSession
# Import passlib for hashing passwords
from passlib.hash import bcrypt

# ------------------------------------------------------------------------------
# Test Data
# ------------------------------------------------------------------------------
# (No static vote payload is needed; we build our payloads from created objects)

# ------------------------------------------------------------------------------
# Helper Functions
# ------------------------------------------------------------------------------

def create_test_user(db_session, username="voter", email="voter@example.com", password="secret"):
    """
    Creates and returns a User instance with a hashed password.
    """
    hashed = bcrypt.hash(password)
    user = User(username=username, email=email, password=hashed, type="user")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

def create_test_voting_session(db_session, creator=None, title="Test Session", description="Test session", is_published=True):
    """
    Creates and returns a VotingSession instance.
    If no creator is provided, a test user is created as the creator.
    """
    if not creator:
        creator = create_test_user(db_session, username="creator", email="creator@example.com")
    session = VotingSession(
        title=title,
        description=description,
        creator_id=creator.id,
        is_published=is_published
    )
    db_session.add(session)
    db_session.commit()
    db_session.refresh(session)
    return session

def create_test_question(db_session, session_id, title="Test Question", type="multiple_choice", description="Test question", is_quiz=True):
    """
    Creates and returns a Question instance associated with the given session.
    """
    from app.models.question import Question  # Import here to avoid circular import issues.
    question = Question(
        session_id=session_id,
        title=title,
        type=type,
        description=description,
        is_quiz=is_quiz
    )
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)
    return question

def create_test_candidate(db_session, question_id, name="Candidate 1", description="Candidate description", user_input="User input"):
    """
    Creates and returns a Candidate instance associated with the given question.
    """
    from app.models.candidate import Candidate  # Import here for clarity.
    candidate = Candidate(
        question_id=question_id,
        name=name,
        description=description,
        user_input=user_input
    )
    db_session.add(candidate)
    db_session.commit()
    db_session.refresh(candidate)
    return candidate

def create_test_vote(db_session, user_id, candidate_id):
    """
    Creates and returns a Vote instance.
    """
    from app.models.vote import Vote  # Import here for clarity.
    vote = Vote(user_id=user_id, candidate_id=candidate_id)
    db_session.add(vote)
    db_session.commit()
    db_session.refresh(vote)
    return vote

# ------------------------------------------------------------------------------
# Test Class for Vote Routes
# ------------------------------------------------------------------------------
class TestVoteRoutes:
    # ----------------------
    # Cast Vote Tests
    # ----------------------
    def test_cast_vote_success(self, client, db_session):
        """Test that a user can successfully cast a vote."""
        user = create_test_user(db_session, username="voter1", email="voter1@example.com")
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, session_id=voting_session.id)
        candidate = create_test_candidate(db_session, question_id=question.id)
        payload = {"user_id": user.id, "candidate_id": candidate.id}
        
        response = client.post("/api/votes/", json=payload)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user_id"] == user.id
        assert data["candidate_id"] == candidate.id

    def test_cast_vote_user_not_found(self, client, db_session):
        """Test casting a vote with a non-existent user returns 404."""
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, session_id=voting_session.id)
        candidate = create_test_candidate(db_session, question_id=question.id)
        payload = {"user_id": 9999, "candidate_id": candidate.id}
        
        response = client.post("/api/votes/", json=payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "user not found" in response.json()["detail"].lower()

    def test_cast_vote_candidate_not_found(self, client, db_session):
        """Test casting a vote with a non-existent candidate returns 404."""
        user = create_test_user(db_session, username="voter2", email="voter2@example.com")
        payload = {"user_id": user.id, "candidate_id": 9999}
        
        response = client.post("/api/votes/", json=payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "candidate not found" in response.json()["detail"].lower()

    def test_cast_vote_duplicate(self, client, db_session):
        """Test that a duplicate vote is not allowed."""
        user = create_test_user(db_session, username="voter3", email="voter3@example.com")
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, session_id=voting_session.id)
        candidate = create_test_candidate(db_session, question_id=question.id)
        payload = {"user_id": user.id, "candidate_id": candidate.id}
        
        # First vote should succeed.
        response1 = client.post("/api/votes/", json=payload)
        assert response1.status_code == status.HTTP_200_OK
        
        # Second vote with same payload should return 400.
        response2 = client.post("/api/votes/", json=payload)
        assert response2.status_code == 400
        assert "already voted" in response2.json()["detail"].lower()

    # ----------------------
    # Get Votes by Candidate
    # ----------------------
    def test_get_votes_by_candidate(self, client, db_session):
        """Test retrieving votes for a candidate."""
        user = create_test_user(db_session, username="voter4", email="voter4@example.com")
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, session_id=voting_session.id)
        candidate = create_test_candidate(db_session, question_id=question.id)
        vote = create_test_vote(db_session, user_id=user.id, candidate_id=candidate.id)
        
        response = client.get(f"/api/votes/candidate/{candidate.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        returned_ids = [v["id"] for v in data]
        assert vote.id in returned_ids

    # ----------------------
    # Get Votes by User
    # ----------------------
    def test_get_votes_by_user(self, client, db_session):
        """Test retrieving votes cast by a specific user."""
        user = create_test_user(db_session, username="voter5", email="voter5@example.com")
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, session_id=voting_session.id)
        candidate = create_test_candidate(db_session, question_id=question.id)
        vote = create_test_vote(db_session, user_id=user.id, candidate_id=candidate.id)
        
        response = client.get(f"/api/votes/user/{user.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        returned_ids = [v["id"] for v in data]
        assert vote.id in returned_ids

    # ----------------------
    # Get Votes by Session
    # ----------------------
    def test_get_votes_by_session(self, client, db_session):
        """Test retrieving votes for an entire voting session via candidate join."""
        user = create_test_user(db_session, username="voter6", email="voter6@example.com")
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, session_id=voting_session.id)
        candidate = create_test_candidate(db_session, question_id=question.id)
        vote = create_test_vote(db_session, user_id=user.id, candidate_id=candidate.id)
        
        response = client.get(f"/api/votes/session/{voting_session.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        returned_ids = [v["id"] for v in data]
        assert vote.id in returned_ids

    # ----------------------
    # Get Session Results
    # ----------------------
    def test_get_session_results_success(self, client, db_session):
        """
        Test retrieving session results when votes exist.
        This endpoint:
         - Finds all questions for a session,
         - Retrieves candidates for those questions,
         - And returns all votes for those candidates.
        """
        user = create_test_user(db_session, username="voter7", email="voter7@example.com")
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, session_id=voting_session.id)
        candidate = create_test_candidate(db_session, question_id=question.id)
        vote = create_test_vote(db_session, user_id=user.id, candidate_id=candidate.id)
        
        response = client.get(f"/api/votes/session/{voting_session.id}/results")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        returned_ids = [v["id"] for v in data]
        assert vote.id in returned_ids

    def test_get_session_results_no_questions(self, client, db_session):
        """
        Test that if no questions exist in a session, the endpoint returns 404.
        """
        voting_session = create_test_voting_session(db_session)
        response = client.get(f"/api/votes/session/{voting_session.id}/results")
        assert response.status_code == 404
        assert "no questions found" in response.json()["detail"].lower()

    # ----------------------
    # Delete Vote
    # ----------------------
    def test_delete_vote_success(self, client, db_session):
        """Test that a vote can be deleted successfully."""
        user = create_test_user(db_session, username="voter8", email="voter8@example.com")
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, session_id=voting_session.id)
        candidate = create_test_candidate(db_session, question_id=question.id)
        vote = create_test_vote(db_session, user_id=user.id, candidate_id=candidate.id)
        
        response = client.delete(f"/api/votes/{vote.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "deleted successfully" in data["detail"].lower()
        # Verify vote is removed from the database.
        vote_in_db = db_session.query(Vote).filter(Vote.id == vote.id).first()
        assert vote_in_db is None

    def test_delete_vote_not_found(self, client):
        """Test that attempting to delete a non-existent vote returns 404."""
        response = client.delete("/api/votes/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "vote not found" in response.json()["detail"].lower()
