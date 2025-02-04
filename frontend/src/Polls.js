import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from 'js-cookie';

const API_BASE_URL = "http://127.0.0.1:8000/api"; 

const Polls = () => {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPolls, setFilteredPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [hasJoinedPoll, setHasJoinedPoll] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [userId, setUserId] = useState();

  useEffect(() => {
    const storedUserId = Cookies.get("userId");
    if (storedUserId) {
      setUserId(storedUserId); 
    } else {
      fetch("${API_BASE_URL}/users/id/${user_id}") 
        .then((res) => res.json())
        .then((data) => {
          setUserId(data.id);
          Cookies.set("userId", data.id);
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
    setSelectedCandidates((prev) => 
      prev.includes(candidateId) ? prev.filter((id) => id !== candidateId) : [...prev, candidateId]
    );
  };

  const handleSubmitVote = async (questionId) => {
    if (selectedCandidates.length === 0) {
      alert("Please select at least one candidate first!");
      return;
    }

    try {
      await Promise.all(selectedCandidates.map(async (candidateId) => {
        const voteResponse = await fetch(`${API_BASE_URL}/votes/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: Number(Cookies.get("userId")),
            candidate_id: candidateId
          }),
        });

        if (!voteResponse.ok) {
          throw new Error("Error submitting vote");
        }
      }));

      alert("Votes submitted successfully!");
      setSelectedCandidates([]); // Clear selections after voting
    } catch (error) {
      console.error("Error submitting vote:", error);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style ={styles.title}>Public Polls</h1>

      {!hasJoinedPoll && (
        <input
          type="text"
          placeholder="Search polls by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      )}

      <div style={styles.pollsContainer}>
        {filteredPolls.map((poll) => (
          <div
            key={poll.id}
            style={{
              ...styles.pollCard,
              border: selectedPoll === poll.id ? "2px solid #007BFF" : "1px solid #ccc",
            }}
            onClick={() => handleSelectPoll(poll.id)}
            //style={{ cursor: "pointer", border: "1px solid", margin: "10px", padding: "10px" }}
          >
            <h3 style={styles.pollTitle}>{poll.title}</h3>
          </div>
        ))
        }
      </div>

      {selectedPoll && hasJoinedPoll && (
        <div style={styles.questionsContainer}>
          <h3>Questions</h3>
          {questions.map((question) => (
            <div key={question.id}>
              <h4>{question.title}</h4>
              <div style={styles.candidatesContainer}>
                {question.candidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => handleSelectCandidate(candidate.id)}
                    style={{ backgroundColor: selectedCandidates.includes(candidate.id) ? "#007BFF" : "#f0f0f0" }}
                  >
                    {candidate.name}
                  </button>
                ))}
                 <br></br>
              </div>
              <button onClick={() => handleSubmitVote(question.id)} style={styles.submitButton}>
                Submit Vote
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "24px",
    marginBottom: "20px",
  },
  searchInput: {
    padding: "10px",
    width: "80%",
    maxWidth: "400px",
    marginBottom: "20px",
    borderRadius: "5px",
    border: "1px solid #ccc",
  },
  pollsContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  pollCard: {
    width: "80%",
    maxWidth: "400px",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "border 0.3s ease",
  },
  pollTitle: {
    margin: "0",
    fontSize: "18px",
  },
  selectedPollContainer: {
    width: "80%",
    maxWidth: "400px",
    padding: "10px",
    borderRadius: "5px",
    border: "2px solid #007BFF",
  },
  selectedPollTitle: {
    margin: "0",
    fontSize: "18px",
  },
  questionsContainer: {
    marginTop: "20px",
  },
  questionCard: {
    marginBottom: "20px",
  },
  candidatesContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  optionButton: {
    padding: "10px",
    margin: "5px 0",
    borderRadius: "5px",
    border: "1px solid #ccc",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  submitButton: {
    padding: "10px 20px",
    backgroundColor: "#007BFF",
    color: "#fff",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
};


export default Polls;
