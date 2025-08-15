import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta


class TestPolls:
    """Poll API tests"""
    
    @pytest.fixture
    def test_circle_with_user(self, client: TestClient, auth_headers):
        """Create a test circle with authenticated user"""
        circle_data = {"name": "Test Circle", "description": "Test circle for polls"}
        response = client.post("/v1/circles", json=circle_data, headers=auth_headers)
        return response.json()
    
    def test_create_poll(self, client: TestClient, auth_headers, test_circle_with_user):
        """Test poll creation"""
        circle_id = test_circle_with_user["id"]
        poll_data = {
            "title": "Test Poll",
            "description": "A test poll",
            "question_template": "Who is the best?",
            "circle_id": circle_id,
            "is_anonymous": True,
            "options": [
                {"text": "Option 1", "order_index": 0},
                {"text": "Option 2", "order_index": 1}
            ]
        }
        
        response = client.post("/v1/polls", json=poll_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Test Poll"
        assert data["question_template"] == "Who is the best?"
        assert len(data["options"]) == 2
        assert data["total_votes"] == 0
    
    def test_create_poll_not_member(self, client: TestClient, auth_headers):
        """Test poll creation when not a circle member"""
        # Create another user and their circle
        login_response = client.post("/v1/auth/login", json={"device_id": "other_device_999"})
        other_auth_headers = {"Authorization": f"Bearer {login_response.json()['access_token']}"}
        
        circle_response = client.post("/v1/circles", json={"name": "Other Circle"}, headers=other_auth_headers)
        circle_id = circle_response.json()["id"]
        
        # Try to create poll in other's circle
        poll_data = {
            "title": "Unauthorized Poll",
            "question_template": "Should not work",
            "circle_id": circle_id,
            "options": [{"text": "Option 1"}]
        }
        
        response = client.post("/v1/polls", json=poll_data, headers=auth_headers)
        assert response.status_code == 403
    
    def test_get_circle_polls(self, client: TestClient, auth_headers, test_circle_with_user):
        """Test getting polls for a circle"""
        circle_id = test_circle_with_user["id"]
        
        # Initially no polls
        response = client.get(f"/v1/circles/{circle_id}/polls", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []
        
        # Create a poll
        poll_data = {
            "title": "Test Poll",
            "question_template": "Test question",
            "circle_id": circle_id,
            "options": [{"text": "Yes"}, {"text": "No"}]
        }
        client.post("/v1/polls", json=poll_data, headers=auth_headers)
        
        # Now should have one poll
        response = client.get(f"/v1/circles/{circle_id}/polls", headers=auth_headers)
        assert response.status_code == 200
        polls = response.json()
        assert len(polls) == 1
        assert polls[0]["title"] == "Test Poll"
    
    def test_get_poll_details(self, client: TestClient, auth_headers, test_circle_with_user):
        """Test getting specific poll details"""
        circle_id = test_circle_with_user["id"]
        
        # Create a poll
        poll_data = {
            "title": "Detailed Poll",
            "description": "Poll with description",
            "question_template": "What do you think?",
            "circle_id": circle_id,
            "options": [
                {"text": "Great", "order_index": 0},
                {"text": "Good", "order_index": 1},
                {"text": "Okay", "order_index": 2}
            ]
        }
        
        create_response = client.post("/v1/polls", json=poll_data, headers=auth_headers)
        poll_id = create_response.json()["id"]
        
        # Get poll details
        response = client.get(f"/v1/polls/{poll_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Detailed Poll"
        assert data["description"] == "Poll with description"
        assert len(data["options"]) == 3
        assert data["user_voted"] == False
    
    def test_vote_on_poll(self, client: TestClient, auth_headers, test_circle_with_user):
        """Test voting on a poll"""
        circle_id = test_circle_with_user["id"]
        
        # Create a poll
        poll_data = {
            "title": "Voting Poll",
            "question_template": "Vote for your choice",
            "circle_id": circle_id,
            "options": [{"text": "Choice A"}, {"text": "Choice B"}]
        }
        
        create_response = client.post("/v1/polls", json=poll_data, headers=auth_headers)
        poll_id = create_response.json()["id"]
        option_id = create_response.json()["options"][0]["id"]
        
        # Vote on the poll
        vote_response = client.post(
            f"/v1/polls/{poll_id}/vote",
            json={"option_id": option_id},
            headers=auth_headers
        )
        assert vote_response.status_code == 200
        assert vote_response.json()["message"] == "Vote recorded successfully"
        
        # Check that vote was recorded
        poll_response = client.get(f"/v1/polls/{poll_id}", headers=auth_headers)
        poll_data = poll_response.json()
        assert poll_data["user_voted"] == True
        assert poll_data["total_votes"] == 1
        assert poll_data["options"][0]["vote_count"] == 1
        assert poll_data["options"][1]["vote_count"] == 0
    
    def test_change_vote(self, client: TestClient, auth_headers, test_circle_with_user):
        """Test changing vote on a poll"""
        circle_id = test_circle_with_user["id"]
        
        # Create poll and vote
        poll_data = {
            "title": "Change Vote Poll",
            "question_template": "Change your mind?",
            "circle_id": circle_id,
            "options": [{"text": "First"}, {"text": "Second"}]
        }
        
        create_response = client.post("/v1/polls", json=poll_data, headers=auth_headers)
        poll_id = create_response.json()["id"]
        first_option_id = create_response.json()["options"][0]["id"]
        second_option_id = create_response.json()["options"][1]["id"]
        
        # Vote for first option
        client.post(f"/v1/polls/{poll_id}/vote", json={"option_id": first_option_id}, headers=auth_headers)
        
        # Change vote to second option
        change_response = client.post(
            f"/v1/polls/{poll_id}/vote",
            json={"option_id": second_option_id},
            headers=auth_headers
        )
        assert change_response.status_code == 200
        
        # Check vote counts
        poll_response = client.get(f"/v1/polls/{poll_id}", headers=auth_headers)
        poll_data = poll_response.json()
        assert poll_data["total_votes"] == 1  # Still only one vote total
        assert poll_data["options"][0]["vote_count"] == 0  # First option should have 0
        assert poll_data["options"][1]["vote_count"] == 1  # Second option should have 1
    
    def test_vote_invalid_option(self, client: TestClient, auth_headers, test_circle_with_user):
        """Test voting with invalid option ID"""
        circle_id = test_circle_with_user["id"]
        
        # Create a poll
        poll_data = {
            "title": "Invalid Vote Poll",
            "question_template": "Try invalid vote",
            "circle_id": circle_id,
            "options": [{"text": "Valid Option"}]
        }
        
        create_response = client.post("/v1/polls", json=poll_data, headers=auth_headers)
        poll_id = create_response.json()["id"]
        
        # Try to vote with invalid option ID
        response = client.post(
            f"/v1/polls/{poll_id}/vote",
            json={"option_id": 99999},
            headers=auth_headers
        )
        assert response.status_code == 404
    
    def test_vote_nonexistent_poll(self, client: TestClient, auth_headers):
        """Test voting on nonexistent poll"""
        response = client.post(
            "/v1/polls/99999/vote",
            json={"option_id": 1},
            headers=auth_headers
        )
        assert response.status_code == 404
    
    def test_create_poll_validation(self, client: TestClient, auth_headers, test_circle_with_user):
        """Test poll creation validation"""
        circle_id = test_circle_with_user["id"]
        
        # Test missing title
        response = client.post("/v1/polls", json={
            "question_template": "Test",
            "circle_id": circle_id,
            "options": []
        }, headers=auth_headers)
        assert response.status_code == 422
        
        # Test missing question_template
        response = client.post("/v1/polls", json={
            "title": "Test Poll",
            "circle_id": circle_id,
            "options": []
        }, headers=auth_headers)
        assert response.status_code == 422