import React, { useState } from 'react';
import PollCreation from './PollCreation';
import MyPolls from './MyPolls';

const Home = () => {
  const [isYearly, setIsYearly] = useState(false);
 
  
  

  

  const togglePricing = () => {
    setIsYearly(!isYearly);
  };

  const getPrice = (monthlyPrice) => {
    return isYearly ? monthlyPrice * 12 * 0.8 : monthlyPrice;
  };

  return (
    <div style={styles.container}>

<div>
        <h1>Welcome to PollHub</h1>
        <p>PollHub is your go-to platform for creating, managing, and participating in polls and surveys. Whether you're looking to gather opinions, make decisions, or simply engage with your community, PollHub provides the tools you need to create effective and engaging polls.</p>
        <p><strong>Features:</strong></p>
        <ul>
          <li><strong>Create Polls:</strong> Easily create public polls with multiple questions and options. Customize your polls to suit your needs and gather valuable insights from your audience.</li>
          <li><strong>Participate in Polls:</strong> Join polls created by others and share your opinions. Your feedback helps shape decisions and provides valuable insights.</li>
          <li><strong>Manage Polls:</strong> Keep track of your polls, view results in real-time, and analyze the data to make informed decisions.</li>
          <li><strong>User-Friendly Interface:</strong> Our intuitive interface makes it easy for anyone to create and participate in polls, regardless of technical expertise.</li>
          <li><strong>Secure and Private:</strong> We prioritize your privacy and security. Your data is protected and only accessible to you and those you choose to share it with.</li>
        </ul>
        <p><strong>Why Choose PollHub?</strong></p>
        <p>PollHub is designed to be a comprehensive solution for all your polling needs. Whether you're a business looking to gather customer feedback, a teacher conducting classroom surveys, or an organization seeking member input, PollHub has you covered. Our platform is flexible, reliable, and easy to use, making it the perfect choice for anyone looking to create and manage polls.</p>
        <p>Join PollHub today and start making your voice heard!</p>
      </div>
      
      {/* Pricing Toggle */}
      <div style={styles.toggleContainer}>
        <button
          onClick={togglePricing}
          style={{
            ...styles.toggleButton,
            backgroundColor: !isYearly ? '#007BFF' : '#f0f0f0',
            color: !isYearly ? '#fff' : '#333',
          }}
        >
          Monthly
        </button>
        <button
          onClick={togglePricing}
          style={{
            ...styles.toggleButton,
            backgroundColor: isYearly ? '#007BFF' : '#f0f0f0',
            color: isYearly ? '#fff' : '#333',
          }}
        >
          Yearly
        </button>
      </div>

      {/* Pricing Boxes */}
      <div style={styles.pricingContainer}>
        <div style={styles.pricingBox}>
          <h2>Basic</h2>
          <p>${getPrice(0)}/{isYearly ? 'yr' : 'mo'}</p>
          <ul style={styles.list}>
            <li>List Item</li>
            <li>List Item</li>
            <li>List Item</li>
            <li>List Item</li>
            <li>List Item</li>
          </ul>
          <button style={styles.button}>Buy</button>
        </div>

        {/* Pro Box with Black Background */}
        <div
          style={{
            ...styles.pricingBox,
            backgroundColor: '#000',
            color: '#fff',
          }}
        >
          <h2>Pro</h2>
          <p>${getPrice(20)}/{isYearly ? 'yr' : 'mo'}</p>
          <ul style={{ ...styles.list, color: '#fff' }}>
            <li>List Item</li>
            <li>List Item</li>
            <li>List Item</li>
            <li>List Item</li>
            <li>List Item</li>
          </ul>
          <button
            style={{
              ...styles.button,
              backgroundColor: '#FF8C00',
              color: '#fff',
            }}
          >
            Buy
          </button>
        </div>

        <div style={styles.pricingBox}>
          <h2>Ultra</h2>
          <p>${getPrice(50)}/{isYearly ? 'yr' : 'mo'}</p>
          <ul style={styles.list}>
            <li>List Item</li>
            <li>List Item</li>
            <li>List Item</li>
            <li>List Item</li>
            <li>List Item</li>
          </ul>
          <button style={styles.button}>Buy</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  passcodeContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  passcodeInput: {
    padding: '10px',
    width: '300px',
    marginRight: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
  },
  passcodeButton: {
    padding: '10px 20px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  createPollButton: {
    display: 'block',
    margin: '0 auto 40px auto',
    padding: '10px 20px',
    backgroundColor: '#28A745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  toggleContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  toggleButton: {
    padding: '10px 20px',
    backgroundColor: '#f0f0f0',
    color: '#333',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    margin: '0 5px',
  },
  pricingContainer: {
    display: 'flex',
    justifyContent: 'space-around',
    marginTop: '40px',
    gap: '20px',
  },
  pricingBox: {
    border: '1px solid #ccc',
    padding: '20px',
    borderRadius: '10px',
    width: '30%',
    textAlign: 'center',
    backgroundColor: '#fff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  list: {
    listStyleType: 'none',
    padding: '0',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#FF8C00',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '20px',
  },
};

export default Home;