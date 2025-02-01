import React, { useState } from 'react';
import logo from './images/logo.webp'; 

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
        <p>Welcome to our website. We are a team of passionate individuals dedicated to providing the best services.</p>
      </div>
    </div>
  );
};

export default About;
