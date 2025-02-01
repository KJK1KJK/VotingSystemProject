import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import SignIn from './SignIn';
import Home from './Home'; 
import avatar from './images/avatari.png';
import SignUp from './SignUp';
import Polls from './Polls';
import MyPolls from './MyPolls';
import About from './About';


const MainScreen = ({polls,setPolls}) => {
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
            <Link to="/signin" style={styles.signInButton}>Sign In</Link>
            
            <Link to="/signup" style={styles.signUpButton}>Sign Up</Link>
          </div>
        </nav>

        
        <Routes>
          <Route path="/" element={<Home />} /> 
          <Route path="/signin" element={<SignIn />} /> 
          <Route path="/signup" element={<SignUp />} />
          <Route path="/polls" element={<Polls />} />
          <Route path="/mypolls" element={<MyPolls />} />
          <Route path="/about" element={<About />} />

          {/* Next things we gona add here . but ig i added everything*/}
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
};

export default MainScreen;