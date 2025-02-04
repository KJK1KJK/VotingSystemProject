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
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Public Polls</h1>

      {!hasJoinedPoll && (
        <input
          type="text"
          placeholder="Search polls by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      )}

      <div>
        {filteredPolls.map((poll) => (
          <div
            key={poll.id}
            onClick={() => handleSelectPoll(poll.id)}
            style={{ cursor: "pointer", border: "1px solid", margin: "10px", padding: "10px" }}
          >
            {poll.title}
          </div>
        ))}
      </div>

      {selectedPoll && hasJoinedPoll && (
        <div>
          {questions.map((question) => (
            <div key={question.id}>
              <h4>{question.title}</h4>
              {question.candidates.map((candidate) => (
                <button
                  key={candidate.id}
                  onClick={() => handleSelectCandidate(candidate.id)}
                  style={{ backgroundColor: selectedCandidates.includes(candidate.id) ? "#007BFF" : "#f0f0f0" }}
                >
                  {candidate.name}
                </button>
              ))}
              <button onClick={() => handleSubmitVote(question.id)}>Submit Vote</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Polls;
