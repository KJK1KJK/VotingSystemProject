# tests/test_routes_whitelist.py
import pytest
from app.models.user import User
from app.models.voting_session import VotingSession
from app.models.whitelist import Whitelist

# Test data
TEST_USER = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "password",
    "type": "user"
}

TEST_SESSION = {
    "title": "Test Session",
    "description": "Test Description",
    "is_published": False
}

# Add to whitelist tests
def test_add_to_whitelist_success(client, db_session):
    # Setup
    user = User(**TEST_USER)
    session = VotingSession(**TEST_SESSION, creator_id=1)
    db_session.add_all([user, session])
    db_session.commit()
    
    # Test
    response = client.post("/api/whitelist/", json={
        "user_id": user.id,
        "session_id": session.id
    })
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == user.id
    assert data["session_id"] == session.id
    assert db_session.query(Whitelist).count() == 1

def test_add_to_whitelist_user_not_found(client, db_session):
    response = client.post("/api/whitelist/", json={
        "user_id": 999,
        "session_id": 1
    })
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"

def test_add_to_whitelist_session_not_found(client, db_session):
    user = User(**TEST_USER)
    db_session.add(user)
    db_session.commit()
    
    response = client.post("/api/whitelist/", json={
        "user_id": user.id,
        "session_id": 999
    })
    assert response.status_code == 404
    assert response.json()["detail"] == "Session not found"

# Get all whitelist entries tests
def test_get_all_whitelist_entries(client, db_session):
    # Setup
    user = User(**TEST_USER)
    session = VotingSession(**TEST_SESSION, creator_id=1)
    wl_entry = Whitelist(user_id=user.id, session_id=session.id)
    db_session.add_all([user, session, wl_entry])
    db_session.commit()
    
    # Test
    response = client.get("/api/whitelist/")
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["user_id"] == user.id

def test_get_all_whitelist_empty(client):
    response = client.get("/api/whitelist/")
    assert response.status_code == 404
    assert response.json()["detail"] == "Not whitelists found"

# Get sessions by user tests
def test_get_sessions_by_user(client, db_session):
    # Setup
    user = User(**TEST_USER)
    session = VotingSession(**TEST_SESSION, creator_id=1)
    wl_entry = Whitelist(user_id=user.id, session_id=session.id)
    db_session.add_all([user, session, wl_entry])
    db_session.commit()
    
    # Test
    response = client.get(f"/api/whitelist/user/{user.id}")
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["session_id"] == session.id

def test_get_sessions_by_user_not_found(client):
    response = client.get("/api/whitelist/user/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "No whitelisted sessions for user found"

# Get users by session tests
def test_get_users_by_session(client, db_session):
    # Setup
    user = User(**TEST_USER)
    session = VotingSession(**TEST_SESSION, creator_id=1)
    wl_entry = Whitelist(user_id=user.id, session_id=session.id)
    db_session.add_all([user, session, wl_entry])
    db_session.commit()
    
    # Test
    response = client.get(f"/api/whitelist/session/{session.id}")
    
    # Assert
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["user_id"] == user.id

def test_get_users_by_session_not_found(client):
    response = client.get("/api/whitelist/session/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "No whitelisted user for session found"

# Remove from whitelist tests
def test_remove_from_whitelist_success(client, db_session):
    # Setup
    user = User(**TEST_USER)
    session = VotingSession(**TEST_SESSION, creator_id=1)
    wl_entry = Whitelist(user_id=user.id, session_id=session.id)
    db_session.add_all([user, session, wl_entry])
    db_session.commit()
    
    # Test
    response = client.delete("/api/whitelist/", json={
        "user_id": user.id,
        "session_id": session.id
    })
    
    # Assert
    assert response.status_code == 200
    assert db_session.query(Whitelist).count() == 0

def test_remove_from_whitelist_not_found(client):
    response = client.delete("/api/whitelist/", json={
        "user_id": 1,
        "session_id": 1
    })
    assert response.status_code == 404
    assert response.json()["detail"] == "Whitelist entry not found"