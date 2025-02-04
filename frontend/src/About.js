import React, { useState } from 'react';
import logo from './images/logo.png'; 

const About = () => {
  const [showContact, setShowContact] = useState(false);

  const handleContactClick = () => {
    setShowContact(!showContact);
  };

  return (
    <div style={{ position: 'relative', padding: '20px' }}>
      <div style={{ position: 'absolute', top: '20px', right: '20px', textAlign: 'right' }}>
        <button 
          onClick={handleContactClick} 
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            backgroundColor: '#4CAF50', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            transition: 'background-color 0.3s ease' 
          }}
          onMouseOver={e => e.currentTarget.style.backgroundColor = '#45a049'}
          onMouseOut={e => e.currentTarget.style.backgroundColor = '#4CAF50'}
        >
          📞 Contact Us
        </button>
        {showContact && (
          <div style={{ marginTop: '10px' }}>
            <p style={{ margin: 0 }}>
              <a href="tel:+48571937316" style={{ textDecoration: 'none', color: '#FF8C00' }}>Phone: +48 571937316</a>
            </p>
            <p style={{ margin: 0 }}>
              <a href="mailto:votingapp@example.com" style={{ textDecoration: 'none', color: '#FF8C00' }}>Email: votingapp@example.com</a>
            </p>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>About Us</h1>
        <img src={logo} alt="Logo" style={{ width: '200px', marginBottom: '20px' }} />
        <p>Welcome to PollHub, your trusted platform for creating, managing, and participating in polls and surveys. Our mission is to empower individuals and organizations to make informed decisions through effective and engaging polling tools.</p>
        <p><strong>Project Aims:</strong></p>
        <ul style={styles.list}>
          <li>Provide a user-friendly interface for creating and managing polls.</li>
          <li>Ensure the privacy and security of user data.</li>
          <li>Offer real-time results and analytics to help users make informed decisions.</li>
          <li>Foster community engagement through interactive polling.</li>
        </ul>
        <p><strong>Our Ambitions:</strong></p>
        <ul style={styles.list}>
          <li>Continuously improve our platform based on user feedback.</li>
          <li>Expand our features to cater to a wider range of polling needs.</li>
          <li>Build a strong community of users who trust and rely on PollHub for their polling requirements.</li>
          <li>Promote transparency and inclusivity in decision-making processes.</li>
        </ul>
        <p>Thank you for choosing PollHub. We are committed to providing you with the best polling experience possible.</p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  contactContainer: {
    textAlign: 'center',
    marginBottom: '20px',
  },
  contactButton: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
  list: {
    textAlign: 'left',
    display: 'inline-block',
    margin: '0 auto',
    padding: '0',
    listStyleType: 'disc',
  },
};
export default About;
