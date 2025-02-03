import React, { useState } from 'react';

const MyPolls = ({ polls = [], setPolls = () => {} }) => {
  const [newPoll, setNewPoll] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  // Add a new option field
  const handleAddOption = () => {
    if (options[options.length - 1].trim()) {
      setOptions(prevOptions => [...prevOptions, ""]);
    } else {
      alert("Please fill in the previous option before adding a new one.");
    }
  };

  // Handle option text change
  const handleOptionChange = (index, value) => {
    setOptions(prevOptions => {
      const updatedOptions = [...prevOptions];
      updatedOptions[index] = value;
      return updatedOptions;
    });
  };

  // Function to create and submit a new poll
  const handlePollSubmit = () => {
    // Validate inputs
    if (!newPoll.trim()) {
      alert("Poll title is required.");
      return;
    }
    if (!newQuestion.trim()) {
      alert("Poll question is required.");
      return;
    }
    if (options.some(option => !option.trim())) {
      alert("Please fill out all options.");
      return;
    }
    if (options.length < 2) {
      alert("Please add at least two options.");
      return;
    }

    // Create new poll data
    const newPollData = {
      id: polls.length + 1,  // Assign a unique ID
      title: newPoll,
      questions: [
        {
          text: newQuestion,
          options,
        },
      ],
    };

    // Update polls state safely using previous state
    if (typeof setPolls === "function") {
      setPolls(prevPolls => [...prevPolls, newPollData]);
    } else {
      console.error("setPolls is not a function! Ensure it is passed as a prop.");
    }

    // Reset form fields
    setNewPoll("");
    setNewQuestion("");
    setOptions(["", ""]);
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

      <div>
        <input
          type="text"
          placeholder="Question"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          style={styles.input}
        />
      </div>

      <div>
        {options.map((option, index) => (
          <div key={index} style={styles.optionContainer}>
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              style={styles.input}
            />
          </div>
        ))}
        <button onClick={handleAddOption} style={styles.addButton}>Add Option</button>
      </div>

      <button onClick={handlePollSubmit} style={styles.submitButton}>Submit Poll</button>

      {/* Display Created Polls */}
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
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Styles for the component
const styles = {
  container: {
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    width: '400px',
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
    padding: '8px',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    marginBottom: '10px',
  },
  submitButton: {
    padding: '8px',
    backgroundColor: '#28A745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  },
  pollContainer: {
    marginTop: '20px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#fff',
  },
};

export default MyPolls;
