# tests/test_answer_routes.py
import pytest
from fastapi import status
from app.models.question import Question
from app.models.answer import Answer
from app.schemas.answer import AnswerResponse, AnswerCreate, AnswerUpdate

# Test data
TEST_QUESTION = {
    "session_id": 1,
    "type": "multiple_choice",
    "title": "Test Question",
    "description": "Sample description",
    "is_quiz": True,
}

TEST_ANSWER = {
    "text": "Test Answer"
}

# Helper functions to create test objects directly in the DB
def create_test_question(db_session, is_quiz=True):
    """Creates and returns a Question instance."""
    question_data = {**TEST_QUESTION, "is_quiz": is_quiz}
    question = Question(**question_data)
    db_session.add(question)
    db_session.commit()
    db_session.refresh(question)
    return question

def create_test_answer(db_session, question_id):
    """Creates and returns an Answer instance linked to a given question."""
    answer = Answer(question_id=question_id, **TEST_ANSWER)
    db_session.add(answer)
    db_session.commit()
    db_session.refresh(answer)
    return answer

class TestAnswerRoutes:
    # Create Answer Tests
    def test_create_answer_success(self, client, db_session):
        # Create a quiz question so that answers can be added.
        question = create_test_question(db_session, is_quiz=True)

        response = client.post(
            f"/api/answers/{question.id}/answers/",
            json=TEST_ANSWER
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["text"] == TEST_ANSWER["text"]
        assert data["question_id"] == question.id

    def test_create_answer_non_quiz_question(self, client, db_session):
        # Create a non-quiz question.
        question = create_test_question(db_session, is_quiz=False)

        response = client.post(
            f"/api/answers/{question.id}/answers/",
            json=TEST_ANSWER
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        # Check that the error message mentions quiz questions.
        assert "answers can only be added to quiz questions" in response.json()["detail"].lower()

    def test_create_answer_question_not_found(self, client):
        # Attempt to create an answer for a non-existent question.
        response = client.post(
            "/api/answers/9999/answers/",
            json=TEST_ANSWER
        )
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "question not found" in response.json()["detail"].lower()

    # Get Answers Tests
    def test_get_answers_for_question(self, client, db_session):
        # Create a quiz question and add an answer.
        question = create_test_question(db_session, is_quiz=True)
        answer = create_test_answer(db_session, question.id)

        response = client.get(f"/api/answers/{question.id}/answers/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["id"] == answer.id
        assert data[0]["text"] == answer.text
        assert data[0]["question_id"] == question.id

    # Get Single Answer Tests
    def test_get_single_answer_success(self, client, db_session):
        # Create a quiz question and add an answer.
        question = create_test_question(db_session, is_quiz=True)
        answer = create_test_answer(db_session, question.id)

        response = client.get(f"/api/answers/answers/{answer.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["id"] == answer.id
        assert data["text"] == answer.text
        assert data["question_id"] == question.id

    def test_get_single_answer_not_found(self, client):
        response = client.get("/api/answers/answers/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "answer not found" in response.json()["detail"].lower()

    # Update Answer Tests
    def test_update_answer_success(self, client, db_session):
        # Create a quiz question and add an answer.
        question = create_test_question(db_session, is_quiz=True)
        answer = create_test_answer(db_session, question.id)
        update_payload = {"text": "Updated Answer"}

        response = client.put(
            f"/api/answers/answers/{answer.id}",
            json=update_payload
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["text"] == update_payload["text"]

        # Verify the update in the database.
        updated_answer = db_session.query(Answer).get(answer.id)
        assert updated_answer.text == update_payload["text"]

    def test_update_answer_not_found(self, client):
        update_payload = {"text": "Updated Answer"}
        response = client.put("/api/answers/answers/9999", json=update_payload)
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "answer not found" in response.json()["detail"].lower()

    # Delete Answer Tests
    def test_delete_answer_success(self, client, db_session):
        # Create a quiz question and add an answer.
        question = create_test_question(db_session, is_quiz=True)
        answer = create_test_answer(db_session, question.id)

        response = client.delete(f"/api/answers/answers/{answer.id}")
        assert response.status_code == status.HTTP_200_OK

        # Verify that the answer is deleted.
        deleted = db_session.query(Answer).get(answer.id)
        assert deleted is None

    def test_delete_answer_not_found(self, client):
        response = client.delete("/api/answers/answers/9999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "answer not found" in response.json()["detail"].lower()
