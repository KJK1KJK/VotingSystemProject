import React, { useState } from 'react';

const MyPolls = ({ polls = [], setPolls }) => {
  const [newPoll, setNewPoll] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);

  const handleAddOption = () => {
    setOptions([...options, ""]);
  };

  const handleOptionChange = (index, value) => {
    const updatedOptions = [...options];
    updatedOptions[index] = value;
    setOptions(updatedOptions);
  };

  const handlePollSubmit = () => {
    // Validate inputs
    if (!newPoll.trim() || !newQuestion.trim() || options.some(option => !option.trim())) {
      alert("Please fill out all fields and ensure all options are filled.");
      return;
    }

    if (options.length < 2) {
      alert("Please add at least two options.");
      return;
    }

    // Create new poll data
    const newPollData = {
      title: newPoll,
      questions: [
        {
          text: newQuestion,
          options: options,
        },
      ],
    };

    // Update polls state
    setPolls([...polls, newPollData]);

    // Reset form
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

      <div>
        <h3>Your Polls</h3>
        {polls.map((poll, index) => (
          <div key={index} style={styles.pollContainer}>
            <h4>{poll.title}</h4>
            {poll.questions.map((question, qIndex) => (
              <div key={qIndex}>
                <p>{question.text}</p>
                <ul>
                  {question.options.map((option, oIndex) => (
                    <li key={oIndex}>{option}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

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