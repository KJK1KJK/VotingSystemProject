import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Cookies from 'js-cookie';
import SignIn from './SignIn';
import Home from './Home'; 
import avatar from './images/avatari.png';
import SignUp from './SignUp';
import Polls from './Polls';
import MyPolls from './MyPolls';
import About from './About';
import PollResults from './pollResults';

const MainScreen = ({ polls, setPolls }) => {
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');

  useEffect(() => {
    const storedUsername = Cookies.get('username');
    const storedUserId = Cookies.get('userId');
    if (storedUsername) {
      setUsername(storedUsername);
    }
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const handleLogout = () => {
    Cookies.remove('username');
    Cookies.remove('userId');
    setUsername('');
    setUserId('');
  };

  return (
    <Router>
      <div style={styles.container}>
        {/*Up navigation */}
        <nav style={styles.nav}>
          <div style={styles.navLeft}>
            <Link to="/" style={styles.navItem}>Home</Link>
            <span style={styles.separator}>|</span>
            <Link to="/polls" style={styles.navItem}>Polls</Link>
            <span style={styles.separator}>|</span>
            <Link to="/mypolls" style={styles.navItem}>MyPolls</Link>
            <span style={styles.separator}>|</span>
            <Link to="/about" style={styles.navItem}>About</Link>
          </div>
          <div style={styles.navRight}>
            <img
              src={avatar} 
              alt="Avatar"
              style={styles.avatar}
            />
            {username ? (
              <>
                <span style={styles.username}>{username}</span>
                <button onClick={handleLogout} style={styles.logoutButton}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/signin" style={styles.signInButton}>Sign In</Link>
                <Link to="/signup" style={styles.signUpButton}>Sign Up</Link>
              </>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Home />} /> 
          <Route path="/signin" element={<SignIn setUsername={setUsername} />} /> 
          <Route path="/signup" element={<SignUp />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/mypolls" element={<MyPolls />} />
          <Route path="/about" element={<About />} />
          <Route path="/results" element={<PollResults />} />
        </Routes>
      </div>
    </Router>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFA500', 
    padding: '20px 40px',
    borderRadius: '5px',
    marginBottom: '20px',
  },
  navLeft: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  navItem: {
    textDecoration: 'none',
    color: '#000',
    fontWeight: 'bold',
  },
  separator: {
    color: '#000',
    fontSize: '18px',
    margin: '0 5px',
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
  },
  signInButton: {
    padding: '8px 16px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize:'14px',
  },
  signUpButton: {
    padding: '8px 16px',
    backgroundColor: '#28A745',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: '14px',
  },
  username: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#000',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#DC3545',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    textDecoration: 'none',
    fontSize: '14px',
  },
};

export default MainScreen;