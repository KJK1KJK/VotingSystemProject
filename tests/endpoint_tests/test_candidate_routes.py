# tests/test_candidate_routes.py
import pytest
from fastapi import status
from app.models.question import Question
from app.models.candidate import Candidate
from app.schemas.candidate import CandidateResponse, CandidateCreate, CandidateUpdate

# Test data for Question and Candidate
TEST_QUESTION = {
    "session_id": 1,
    "type": "multiple_choice",
    "title": "Test Question",
    "description": "Sample description",
    "is_quiz": True,
}

TEST_CANDIDATE = {
    "name": "Test Candidate",
    "description": "Test candidate description",
    "user_input": "Some user input"
}

# Helper functions to create test objects in the DB
def create_test_question(db_session):
    """Creates and returns a Question instance."""
    question = Question(**TEST_QUESTION)
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)
    return question

def create_test_candidate(db_session, question_id):
    """Creates and returns a Candidate instance associated with a given question."""
    candidate = Candidate(
        question_id=question_id,
        name=TEST_CANDIDATE["name"],
        description=TEST_CANDIDATE["description"],
        user_input=TEST_CANDIDATE["user_input"]
    )
    db_session.add(candidate)
    db_session.commit()
    db_session.refresh(candidate)
    return candidate

class TestCandidateRoutes:
    # Create Candidate Tests
    def test_create_candidate_success(self, client, db_session):
        # Create a test question so that a candidate can be added.
        question = create_test_question(db_session)

        response = client.post(
            f"/api/candidates/{question.id}/candidates/",
            json=TEST_CANDIDATE
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        # Validate response payload
        assert data["name"] == TEST_CANDIDATE["name"]
        assert data["description"] == TEST_CANDIDATE["description"]
        assert data["user_input"] == TEST_CANDIDATE["user_input"]
        assert data["question_id"] == question.id

    def test_create_candidate_question_not_found(self, client):
        # Use an invalid question_id to trigger the error.
        response = client.post(
            "/api/candidates/9999/candidates/",
            json=TEST_CANDIDATE
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "question not found" in response.json()["detail"].lower()

    # Get Candidates Tests
    def test_get_candidates_for_question(self, client, db_session):
        question = create_test_question(db_session)
        candidate = create_test_candidate(db_session, question.id)

        response = client.get(f"/api/candidates/{question.id}/candidates/")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == candidate.id
        assert data[0]["name"] == candidate.name
        assert data[0]["question_id"] == question.id

    # Get Single Candidate Tests
    def test_get_single_candidate_success(self, client, db_session):
        question = create_test_question(db_session)
        candidate = create_test_candidate(db_session, question.id)

        response = client.get(f"/api/candidates/candidates/{candidate.id}")
        assert response.status_code == status.HTTP_200_OK

        data = response.json()
        assert data["id"] == candidate.id
        assert data["name"] == candidate.name
        assert data["description"] == candidate.description
        assert data["user_input"] == candidate.user_input
        assert data["question_id"] == question.id

    def test_get_single_candidate_not_found(self, client):
        response = client.get("/api/candidates/candidates/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "candidate not found" in response.json()["detail"].lower()

    # Update Candidate Tests
    def test_update_candidate_success(self, client, db_session):
        question = create_test_question(db_session)
        candidate = create_test_candidate(db_session, question.id)
        update_payload = {
            "name": "Updated Candidate",
            "description": "Updated description",
            "user_input": "Updated input"
        }

        response = client.put(
            f"/api/candidates/candidates/{candidate.id}",
            json=update_payload
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["name"] == update_payload["name"]
        assert data["description"] == update_payload["description"]
        assert data["user_input"] == update_payload["user_input"]

        # Confirm update in the database
        updated_candidate = db_session.query(Candidate).get(candidate.id)
        assert updated_candidate.name == update_payload["name"]

    def test_update_candidate_not_found(self, client):
        update_payload = {
            "name": "Updated Candidate",
            "description": "Updated description",
            "user_input": "Updated input"
        }
        response = client.put(
            "/api/candidates/candidates/9999",
            json=update_payload
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "candidate not found" in response.json()["detail"].lower()

    # Delete Candidate Tests
    def test_delete_candidate_success(self, client, db_session):
        question = create_test_question(db_session)
        candidate = create_test_candidate(db_session, question.id)

        response = client.delete(f"/api/candidates/candidates/{candidate.id}")
        assert response.status_code == status.HTTP_200_OK
        # Verify candidate removal from the database.
        deleted = db_session.query(Candidate).get(candidate.id)
        assert deleted is None

    def test_delete_candidate_not_found(self, client):
        response = client.delete("/api/candidates/candidates/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "candidate not found" in response.json()["detail"].lower()
