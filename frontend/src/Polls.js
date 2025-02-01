
import React, { useState, useEffect, useRef } from 'react';

const Polls = () => {
  const [polls, setPolls] = useState([
    { id: 1, title: 'Adrian' },
    { id: 2, title: 'Kacper' },
    { id: 3, title: 'Ziyad' },
    { id: 4, title: 'Niggas' },
    { id: 5, title: 'Artun is best' },
  ]);
  const [poll, setPoll] = useState({
    questions: [
        'Is Adrian is hot?',
        'Is Kacper a victim of woke culture ',
        'Is Black lives really matter ?',
        'Does Ziyad have oil money? ',
        'Do u love Artun?'
    ],
    options: [
      { type: 'rating', label: 'Rate from 1 to 5', value: null },
      { type: 'checkbox', label: 'Select all that apply', choices: [] },
      { type: 'radio', label: 'Choose one option', selected: null },
    ],
  });

  const [rating, setRating] = useState(null);
  const [checkboxes, setCheckboxes] = useState([
    { id: 1, label: 'Option 1', checked: false },
    { id: 2, label: 'Option 2', checked: false },
    { id: 3, label: 'Option 3', checked: false },
  ]);
  const [selectedRadio, setSelectedRadio] = useState(null);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPolls, setFilteredPolls] = useState(polls);
  const [hasJoinedPoll, setHasJoinedPoll] = useState(false);
  const [randomQuestion, setRandomQuestion] = useState('');

  const handleRatingChange = (value) => {
    setRating(value);
  };

  const handleCheckboxChange = (id) => {
    const updatedCheckboxes = checkboxes.map((checkbox) =>
      checkbox.id === id ? { ...checkbox, checked: !checkbox.checked } : checkbox
    );
    setCheckboxes(updatedCheckboxes);
  };

  const handleRadioChange = (value) => {
    setSelectedRadio(value);
  };

  const handleSubmit = () => {
    const responses = {
      rating,
      checkboxes: checkboxes.filter((cb) => cb.checked).map((cb) => cb.label),
      selectedRadio,
    };
    console.log('Poll Responses:', responses);
    alert('Thank you for participating in the poll!');
  };

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);

    const results = polls.filter(poll =>
      poll.title.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredPolls(results);
  };

  const handleSelectPoll = (pollId) => {
    if (selectedPoll === pollId) {
      setSelectedPoll(null);
    } else {
      setSelectedPoll(pollId);
    }
  };

  const handleJoinPoll = () => {
    if (selectedPoll) {
      setHasJoinedPoll(true);
      // Rastgele bir soru seç
      const randomIndex = Math.floor(Math.random() * poll.questions.length);
      setRandomQuestion(poll.questions[randomIndex]);
      console.log(`Joined poll with ID: ${selectedPoll}`);
      alert(`You joined the poll with ID: ${selectedPoll}`);
    } else {
      alert('Please select a poll first!');
    }
  };

  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setSelectedPoll(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div style={styles.container} ref={containerRef}>
      <h1 style={styles.title}>Public Polls</h1>

      {/* Searching bar */}
      {!hasJoinedPoll && (
        <input
          type="text"
          placeholder="Search polls by title..."
          value={searchTerm}
          onChange={handleSearch}
          style={styles.searchInput}
        />
      )}

      {/* Poll list */}
      {!hasJoinedPoll ? (
        <div style={styles.pollsContainer}>
          {filteredPolls.map((poll) => (
            <div
              key={poll.id}
              style={{
                ...styles.pollCard,
                border: selectedPoll === poll.id ? '2px solid #007BFF' : '1px solid #ccc',
                backgroundColor: selectedPoll === poll.id ? '#f0f8ff' : '#fff',
              }}
              onClick={() => handleSelectPoll(poll.id)}
            >
              <h3 style={styles.pollTitle}>{poll.title}</h3>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.selectedPollContainer}>
          <h2 style={styles.selectedPollTitle}>{polls.find(p => p.id === selectedPoll)?.title}</h2>
          <p style={styles.question}>{randomQuestion}</p>
        </div>
      )}

      {/* Join Poll Button */}
      {!hasJoinedPoll && (
        <button
          onClick={handleJoinPoll}
          style={styles.joinButton}
          disabled={!selectedPoll}
        >
          Join Poll
        </button>
      )}

      {/* Conditionally render poll options if the user has joined a poll */}
      {hasJoinedPoll && (
        <>
          {/* Puanlama (1-5) */}
          <div style={styles.section}>
            <h3>{poll.options[0].label}</h3>
            <div style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  style={{
                    ...styles.ratingButton,
                    backgroundColor: rating === value ? '#007BFF' : '#f0f0f0',
                    color: rating === value ? '#fff' : '#000',
                  }}
                  onClick={() => handleRatingChange(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {/* Checkbox seçenekleri */}
          <div style={styles.section}>
            <h3>{poll.options[1].label}</h3>
            {checkboxes.map((checkbox) => (
              <label key={checkbox.id} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={checkbox.checked}
                  onChange={() => handleCheckboxChange(checkbox.id)}
                />
                {checkbox.label}
              </label>
            ))}
          </div>

          {/* Radio button seçenekleri */}
          <div style={styles.section}>
            <h3>{poll.options[2].label}</h3>
            {['Option A', 'Option B', 'Option C'].map((option) => (
              <label key={option} style={styles.radioLabel}>
                <input
                  type="radio"
                  name="radioOption"
                  checked={selectedRadio === option}
                  onChange={() => handleRadioChange(option)}
                />
                {option}
              </label>
            ))}
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            style={styles.submitButton}
          >
            Submit
          </button>
        </>
      )}
    </div>
  );
};

// Stiller
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    textAlign: 'center',
  },
  title: {
    fontSize: '32px',
    marginBottom: '20px',
    color: '#333',
  },
  question: {
    fontSize: '24px',
    marginBottom: '30px',
    color: '#555',
  },
  section: {
    marginBottom: '30px',
  },
  ratingContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
  },
  ratingButton: {
    padding: '10px 20px',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  checkboxLabel: {
    display: 'block',
    margin: '10px 0',
    fontSize: '16px',
  },
  radioLabel: {
    display: 'block',
    margin: '10px 0',
    fontSize: '16px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#28A745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  searchInput: {
    width: '100%',
    maxWidth: '500px',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    marginBottom: '20px',
    fontSize: '16px',
  },
  pollsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '20px',
  },
  pollCard: {
    position: 'relative',
    width: '300px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    overflow: 'hidden',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.3s ease',
    cursor: 'pointer',
  },
  pollTitle: {
    padding: '15px',
    fontSize: '20px',
    color: '#333',
  },
  joinButton: {
    padding: '10px 20px',
    backgroundColor: '#FF8C00',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '20px',
  },
  selectedPollContainer: {
    marginTop: '20px',
  },
  selectedPollTitle: {
    fontSize: '24px',
    color: '#333',
  },
};

export default Polls;