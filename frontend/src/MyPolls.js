import React, { useState, useEffect } from 'react';

const MyPolls = ({ polls = [], setPolls = () => {} }) => {
  
  const [newPoll, setNewPoll] = useState("");
  const [questions, setQuestions] = useState([
    { text: "", options: ["", ""] }, 
  ]);
  const [timeLimit, setTimeLimit] = useState("");
  const [pollType, setPollType] = useState("public");

  
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/questions/${sesions_id}/questions');
        if (!response.ok) {
          throw new Error("Failed to fetch questions.");
        }
        const questionsData = await response.json();
        setQuestions(questionsData);
      } catch (error) {
        console.error(error.message);
      }
    };

    fetchQuestions();
  }, []);

  const handleAddOption = (questionIndex) => {
    const lastOption = questions[questionIndex].options[questions[questionIndex].options.length - 1];
    
    if (lastOption.trim()) {
      setQuestions(prevQuestions => {
        const updatedQuestions = [...prevQuestions];
        updatedQuestions[questionIndex].options.push(""); 
        return updatedQuestions;
      });
    } else {
      alert("Please fill in the previous option before adding a new one.");
    }
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setQuestions(prevQuestions => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[questionIndex].options[optionIndex] = value;
      return updatedQuestions;
    });
  };

  const handleAddQuestion = () => {
    setQuestions(prevQuestions => [
      ...prevQuestions,
      { text: "", options: ["", ""] }, 
    ]);
  };

  const handleQuestionChange = (index, value) => {
    setQuestions(prevQuestions => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[index].text = value;
      return updatedQuestions;
    });
  };

  const handlePollSubmit = async () => {
  
    if (!newPoll.trim()) {
      alert("Poll title is required.");
      return;
    }
    if (questions.some(q => !q.text.trim())) {
      alert("Please fill in all questions.");
      return;
    }
    if (questions.some(q => q.options.some(option => !option.trim()))) {
      alert("Please fill out all options.");
      return;
    }
    if (questions.some(q => q.options.length < 2)) {
      alert("Please add at least two options for each question.");
      return;
    }

    if (!timeLimit || isNaN(timeLimit) || timeLimit <= 0) {
      alert("Please enter a valid time limit in minutes.");
      return;
    }

    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + parseInt(timeLimit)); 

    

    const sessionData = {
      title: newPoll,
      questions,
      expiration: expirationTime.toISOString(), 
      type: pollType,
    };

    try {
      
      
      const sessionResponse = await fetch("http://127.0.0.1:8000/api/voting-sessions/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      if (!sessionResponse.ok) {
        throw new Error("Failed to create session.");
      }

      const sessionResult = await sessionResponse.json();
      const sessionId = sessionResult.id; 

      
      for (const question of questions) {
        const questionData = {
          text: question.text,
          options: question.options,
        };

        const questionResponse = await fetch("http://127.0.0.1:8000/api/questions/${sesion_id}/questions/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(questionData),
        });

        if (!questionResponse.ok) {
          throw new Error("Failed to create question.");
        }
      }

  
      if (typeof setPolls === "function") {
        setPolls(prevPolls => [...prevPolls, { ...sessionData, sessionId }]);
      }

     
      setNewPoll("");
      setQuestions([{ text: "", options: ["", ""] }]);
      setTimeLimit("");
    } catch (error) {
      console.error(error.message);
      alert("An error occurred while submitting the poll.");
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
     
      const deleteSessionResponse = await fetch(`http://127.0.0.1:8000/api/sessions-settings/settings/${sessionId}/`, {
        method: "DELETE",
      });
      
      if (!deleteSessionResponse.ok) {
        throw new Error("Failed to delete session.");
      }

      setPolls(prevPolls => prevPolls.filter(poll => poll.sessionId !== sessionId));
    } catch (error) {
      console.error(error.message);
      alert("An error occurred while deleting the poll and session.");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Create Poll</h2>

      <div>
        <input
          type="text"
          placeholder="Poll Title"
          value={newPoll}
          onChange={(e) => setNewPoll(e.target.value)}
          style={styles.input}
        />
      </div>

      {questions.map((question, qIndex) => (
        <div key={qIndex}>
          <input
            type="text"
            placeholder={`Question ${qIndex + 1}`}
            value={question.text}
            onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
            style={styles.input}
          />
          {question.options.map((option, oIndex) => (
            <div key={oIndex} style={styles.optionContainer}>
              <input
                type="text"
                value={option}
                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                placeholder={`Option ${oIndex + 1}`}
                style={styles.input}
              />
            </div>
          ))}
          <button onClick={() => handleAddOption(qIndex)} style={styles.addButton}>
            Add Option
          </button>
        </div>
      ))}
      <br />

      <button onClick={handleAddQuestion} style={styles.addButton}>Add Question</button>
      <br />
      <br />

      <div>
        <input
          type="number"
          placeholder="Time Limit (in minutes)"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          style={styles.input}
        />
      </div>
      <br />

      <div>
        <select
          value={pollType}
          onChange={(e) => setPollType(e.target.value)}
          style={styles.input}
        >
          <option value="public">Public Poll</option>
        </select>
      </div>

      

      <button onClick={handlePollSubmit} style={styles.submitButton}>Submit Poll</button>

      
      <div>
        <h3>Your Polls</h3>
        {polls.length === 0 ? (
          <p>No polls created yet.</p>
        ) : (
          polls.map((poll, index) => (
            <div key={index} style={styles.pollContainer}>
              <h4>{poll.title}</h4>
              {poll.questions.map((question, qIndex) => (
                <div key={qIndex}>
                  <p><strong>Q{qIndex + 1}:</strong> {question.text}</p>
                  <ul>
                    {question.options.map((option, oIndex) => (
                      <li key={oIndex}>{option}</li>
                    ))}
                  </ul>
                </div>
              ))}
              
              <button onClick={() => handleDeleteSession(poll.sessionId)} style={styles.deleteButton}>
                Delete Poll
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '30px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    width: '500px',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
    boxShadow: '0px 4px 6px rgba(0,0,0,0.1)',
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginBottom: '10px',
  },
  optionContainer: {
    marginBottom: '10px',
  },
  addButton: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: '#28a745',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  pollContainer: {
    marginTop: '20px',
    padding: '15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
};

export default MyPolls;