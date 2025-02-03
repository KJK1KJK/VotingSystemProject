# tests/test_question_routes.py
import pytest
from fastapi import status
from app.models.question import Question
from app.models.voting_session import VotingSession
from app.models.user import User
from app.schemas.question import QuestionResponse, QuestionCreate, QuestionUpdate

# Test data for a question
TEST_QUESTION_DATA = {
    "type": "multiple_choice",
    "title": "Test Question",
    "description": "Test question description",
    "is_quiz": True,
}

TEST_QUESTION_UPDATE = {
    "type": "true_false",
    "title": "Updated Question",
    "description": "Updated description",
    "is_quiz": False,
}

# Helper functions
def create_test_user(db_session):
    """
    Creates and returns a dummy User instance.
    Adjust attributes as needed for your User model.
    """
    # Minimal user data – adjust fields to match your User model
    user_data = {
        "username": "dummyuser",
        "email": "dummy@example.com",
        "password": "secret"
    }
    user = User(**user_data)
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

def create_test_voting_session(db_session):
    """
    Creates and returns a VotingSession instance.
    The VotingSession model now requires a title and a creator_id.
    """
    # First, create a dummy user to act as the creator.
    creator = create_test_user(db_session)
    voting_session = VotingSession(
        title="Test Voting Session",
        description="A session created for testing",
        creator_id=creator.id,
        is_published=True  # or False, as needed
        # The "whitelist" column is handled by the relationship, so no need to pass it here.
    )
    db_session.add(voting_session)
    db_session.commit()
    db_session.refresh(voting_session)
    return voting_session

def create_test_question(db_session, session_id, extra_data: dict = None):
    """
    Creates and returns a Question instance associated with the given voting session.
    """
    data = TEST_QUESTION_DATA.copy()
    if extra_data:
        data.update(extra_data)
    question = Question(session_id=session_id, **data)
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)
    return question

class TestQuestionRoutes:
    # Create Question Tests
    def test_create_question_success(self, client, db_session):
        # Create a valid voting session first.
        voting_session = create_test_voting_session(db_session)
        payload = TEST_QUESTION_DATA.copy()

        response = client.post(
            f"/api/questions/{voting_session.id}/questions/",
            json=payload
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Verify returned data matches the input
        assert data["type"] == payload["type"]
        assert data["title"] == payload["title"]
        assert data["description"] == payload["description"]
        assert data["is_quiz"] == payload["is_quiz"]
        assert data["session_id"] == voting_session.id

    def test_create_question_session_not_found(self, client):
        # Use a non-existent session id.
        payload = TEST_QUESTION_DATA.copy()
        response = client.post(
            "/api/questions/9999/questions/",
            json=payload
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "voting session not found" in response.json()["detail"].lower()

    # Get Questions Tests
    def test_get_questions_success(self, client, db_session):
        # Create a voting session and add a question.
        voting_session = create_test_voting_session(db_session)
        created_question = create_test_question(db_session, voting_session.id)

        response = client.get(f"/api/questions/{voting_session.id}/questions/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Expect at least one question.
        assert isinstance(data, list)
        assert len(data) >= 1
        # Verify our created question is in the list.
        returned_ids = [q["id"] for q in data]
        assert created_question.id in returned_ids

    def test_get_questions_no_questions(self, client, db_session):
        # Create a voting session without any questions.
        voting_session = create_test_voting_session(db_session)
        response = client.get(f"/api/questions/{voting_session.id}/questions/")
        # The route raises 404 if no questions are found.
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "no questions found" in response.json()["detail"].lower()

    # Get Single Question Tests
    def test_get_question_success(self, client, db_session):
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, voting_session.id)

        response = client.get(f"/api/questions/questions/{question.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == question.id
        assert data["title"] == question.title
        assert data["session_id"] == voting_session.id

    def test_get_question_not_found(self, client):
        response = client.get("/api/questions/questions/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "question not found" in response.json()["detail"].lower()

    # Update Question Tests
    def test_update_question_success(self, client, db_session):
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, voting_session.id)
        update_payload = TEST_QUESTION_UPDATE.copy()

        response = client.put(
            f"/api/questions/questions/{question.id}",
            json=update_payload
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Verify update was applied
        assert data["type"] == update_payload["type"]
        assert data["title"] == update_payload["title"]
        assert data["description"] == update_payload["description"]
        assert data["is_quiz"] == update_payload["is_quiz"]

        # Optionally, check the DB directly
        updated_question = db_session.query(Question).get(question.id)
        assert updated_question.title == update_payload["title"]

    def test_update_question_not_found(self, client):
        update_payload = TEST_QUESTION_UPDATE.copy()
        response = client.put("/api/questions/questions/9999", json=update_payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "question not found" in response.json()["detail"].lower()

    # Delete Question Tests
    def test_delete_question_success(self, client, db_session):
        voting_session = create_test_voting_session(db_session)
        question = create_test_question(db_session, voting_session.id)

        response = client.delete(f"/api/questions/questions/{question.id}")
        assert response.status_code == status.HTTP_200_OK
        # Verify deletion by attempting to retrieve the question
        deleted_question = db_session.query(Question).get(question.id)
        assert deleted_question is None

    def test_delete_question_not_found(self, client):
        response = client.delete("/api/questions/questions/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "question not found" in response.json()["detail"].lower()
