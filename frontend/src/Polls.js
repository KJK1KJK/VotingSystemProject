import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = "http://127.0.0.1:8000/api"; 

const Polls = () => {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPolls, setFilteredPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [hasJoinedPoll, setHasJoinedPoll] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [userId, setUserId] = useState();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId"); 
  
    if (storedUserId) {
      setUserId(storedUserId); 
    } else {
      fetch("${API_BASE_URL}/users/id/${user_id}") 
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch user");
          }
          return res.json();
        })
        .then((data) => {
          setUserId(data.id);
          localStorage.setItem("userId", data.id); 
        })
        .catch((err) => console.error("Error fetching user:", err));
    }
  }, []);




  useEffect(() => {
    fetchPolls();
  }, []);

 
  const fetchPolls = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/voting-sessions`);
      const data = await response.json();
      setPolls(data);
      setFilteredPolls(data);
    } catch (error) {
      console.error("Error fetching polls:", error);
    }
  };

  
  const fetchQuestionsAndCandidates = async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${sessionId}/questions`);
      const questionData = await response.json();

      
      const updatedQuestions = await Promise.all(
        questionData.map(async (question) => {
          const candidatesResponse = await fetch(`${API_BASE_URL}/candidates/${question.id}/candidates`);
          const candidatesData = await candidatesResponse.json();
          return { ...question, candidates: candidatesData };
        })
      );

      setQuestions(updatedQuestions);
    } catch (error) {
      console.error("Error fetching questions and candidates:", error);
    }
  };

  
  const handleSearch = async (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    try {
      const response = await fetch(`${API_BASE_URL}/search/my-polls?title=${term}`);
      const data = await response.json();
      setFilteredPolls(data);
    } catch (error) {
      console.error("Error searching for polls:", error);
    }
  };

  
  const handleSelectPoll = async (pollId) => {
    if (selectedPoll === pollId) {
      setSelectedPoll(null);
      setQuestions([]);
    } else {
      setSelectedPoll(pollId);
      await fetchQuestionsAndCandidates(pollId);
      setHasJoinedPoll(true);
    }
  };

  const handleSelectCandidate = (candidateId) => {
    setSelectedCandidate(candidateId);
  };

  
  const handleSubmitVote = async (questionId) => {
    if (!selectedCandidate) {
      alert("Please select a candidate first!");
      return;
    }

    try {
      const voteResponse = await fetch(`${API_BASE_URL}/votes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, candidate_id: selectedCandidate }),
      });

      if (!voteResponse.ok) {
        throw new Error("Error submitting vote");
      }

      const answerResponse = await fetch(`${API_BASE_URL}/answers/${questionId}/answers/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `Voted for candidate ${selectedCandidate}` }),
      });

      if (!answerResponse.ok) {
        throw new Error("Error saving answer");
      }
      alert("Vote submitted successfully!");
      //navigate(/pollresults/${selectedPoll});
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Public Polls</h1>

      {/* Search Polls */}
      {!hasJoinedPoll && (
        <input
          type="text"
          placeholder="Search polls by title..."
          value={searchTerm}
          onChange={handleSearch}
          style={styles.searchInput}
        />
      )}

      {/* Polls List */}
      <div style={styles.pollsContainer}>
        {Array.isArray(filteredPolls) && filteredPolls.length > 0 ? (
          filteredPolls.map((poll) => (
            <div
              key={poll.id}
              style={{
                ...styles.pollCard,
                border: selectedPoll === poll.id ? "2px solid #007BFF" : "1px solid #ccc",
              }}
              onClick={() => handleSelectPoll(poll.id)}
            >
              <h3 style={styles.pollTitle}>{poll.title}</h3>
            </div>
          ))
        ) : (
          <div style={styles.selectedPollContainer}>
            <h2 style={styles.selectedPollTitle}>{Array.isArray(polls) ? polls.find((p) => p.id === selectedPoll)?.title : ''}</h2>
          </div>
        )}
      </div>

      {/* Questions & Candidates List */}
      {selectedPoll && hasJoinedPoll && (
        <div style={styles.questionsContainer}>
          <h3>Questions & Candidates</h3>
          {questions.map((question) => (
            <div key={question.id} style={styles.questionCard}>
              <h4>{question.title}</h4>
              <div style={styles.candidatesContainer}>
                {question.candidates.length > 0 ? (
                  question.candidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      style={{
                        ...styles.optionButton,
                        backgroundColor: selectedCandidate === candidate.id ? "#007BFF" : "#f0f0f0",
                        color: selectedCandidate === candidate.id ? "#fff" : "#000",
                      }}
                      onClick={() => handleSelectCandidate(candidate.id)}
                    >
                      {candidate.name}
                    </button>
                  ))
                ) : (
                  <p>No candidates available</p>
                )}
              </div>
              {/* Submit Vote Button */}
              <button onClick={() => handleSubmitVote(question.id)} style={styles.submitButton}>
                Submit Vote
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
  },
  title: {
    fontSize: "32px",
    marginBottom: "20px",
    color: "#333",
  },
  searchInput: {
    width: "100%",
    maxWidth: "500px",
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    marginBottom: "20px",
  },
  pollCard: {
    width: "300px",
    padding: "15px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    cursor: "pointer",
  },
  questionCard: {
    padding: "10px",
    border: "1px solid #ccc",
    margin: "5px",
    borderRadius: "5px",
  },
  candidatesContainer: {
    marginTop: "10px",
  },
  optionButton: {
    padding: "10px",
    margin: "5px",
    borderRadius: "5px",
    cursor: "pointer",
  },
  submitButton: {
    padding: "10px",
    backgroundColor: "#28A745",
    color: "#fff",
    borderRadius: "5px",
    cursor: "pointer",
    marginTop: "10px",
  },
};

export default Polls;
