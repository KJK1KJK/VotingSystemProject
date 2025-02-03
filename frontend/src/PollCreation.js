import React, { useState } from 'react';

const PollCreation = ({ onClose, onCreatePoll }) => {
  const [questions, setQuestions] = useState([]);

  // Add a new question
  const handleAddQuestion = () => {
    setQuestions(prevQuestions => [...prevQuestions, { text: '', type: 'text', options: [] }]);
  };

  // Update question text
  const handleQuestionChange = (index, text) => {
    setQuestions(prevQuestions => {
      const updatedQuestions = [...prevQuestions];
      updatedQuestions[index].text = text;
      return updatedQuestions;
    });
  };

  // Handle poll submission
  const handleCreate = () => {
    if (questions.length === 0) {
      alert("Please add at least one question.");
      return;
    }
    onCreatePoll(questions);  // Pass questions to parent component
    onClose();  // Close the modal
  };

  return (
    <div style={styles.container}>
      <h2>Create a New Poll</h2>
      
      {questions.map((question, index) => (
        <div key={index} style={styles.questionBox}>
          <input
            type="text"
            value={question.text}
            onChange={(e) => handleQuestionChange(index, e.target.value)}
            placeholder={`Question ${index + 1}`}
            style={styles.input}
          />
        </div>
      ))}
      
      <button onClick={handleAddQuestion} style={styles.addButton}>Add Question</button>
      <button onClick={handleCreate} style={styles.createButton}>Create Poll</button>
      <button onClick={onClose} style={styles.closeButton}>Cancel</button>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    width: '300px',
    margin: '0 auto',
    backgroundColor: '#fff',
    boxShadow: '0px 4px 6px rgba(0,0,0,0.1)',
  },
  questionBox: {
    marginBottom: '10px',
  },
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  addButton: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#007BFF',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  },
  createButton: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#28A745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  },
  closeButton: {
    marginTop: '10px',
    padding: '8px',
    backgroundColor: '#FF4D4D',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
  }
};

export default PollCreation;
