import React from 'react';
import { Link } from 'react-router-dom';
import logo from './images/logo.webp';

const SignUp = () => {
  return (
    <div style={styles.container}>
      <div style={styles.loginContainer}>
        <div style={styles.logoContainer}>
          <img
            src={logo}
            alt="Logo"
            style={styles.logo}
          />
        </div>

        <h2 style={styles.loginTitle}>Sign Up</h2>
        <form style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="email" style={styles.label}>Email address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email address"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="username" style={styles.label}>Username</label>
            <input
              type="text"
              id="username"
              placeholder="Enter your username"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.loginButton}>Sign Up</button>
        </form>

        <div style={styles.signUpPrompt}>
          Already have an account? <Link to="/signin" style={styles.signUpLink}>Sign in</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
  },
  loginContainer: {
    width: '100%',
    maxWidth: '500px',
    padding: '40px',
    border: '1px solid #ccc',
    borderRadius: '10px',
    backgroundColor: '#fff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    position: 'relative',
  },
  logoContainer: {
    position: 'absolute',
    top: '-50px',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
  },
  logo: {
    width: '100px',
    height: 'auto',
    borderRadius: '50%',
    border: '2px solid #fff',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  loginTitle: {
    textAlign: 'center',
    marginTop: '60px',
    marginBottom: '20px',
    fontSize: '24px',
    color: '#333',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555',
  },
  input: {
    width: 'calc(100% - 20px)',
    padding: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    fontSize: '16px',
  },
  loginButton: {
    padding: '10px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    marginTop: '10px',
  },
  signUpPrompt: {
    textAlign: 'center',
    marginTop: '20px',
    color: '#555',
  },
  signUpLink: {
    textDecoration: 'none',
    color: '#007BFF',
    fontWeight: 'bold',
  },
};

export default SignUp;