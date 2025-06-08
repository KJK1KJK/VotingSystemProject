import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import PollIcon from '@mui/icons-material/Poll';
import Cookies from 'js-cookie';

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const userId = Cookies.get('userId');
  const username = Cookies.get('username');

  // Add console log to debug cookie state
  console.log('Current userId:', userId);
  console.log('Current username:', username);

  const handleTabChange = (newValue: string) => {
    navigate(newValue);
  };

  const handleSignIn = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        Cookies.set('userId', data.id, { expires: 7 });
        Cookies.set('username', data.username, { expires: 7 });
        setOpen(false);
        setFormData({ username: '', email: '', password: '' });
        setError('');
        window.location.reload();
      } else {
        setError('Failed to sign in');
      }
    } catch (error) {
      setError('Failed to sign in');
    }
  };

  const handleSignUp = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        await handleSignIn();
      } else {
        setError('Failed to sign up');
      }
    } catch (error) {
      setError('Failed to sign up');
    }
  };

  const handleLogout = () => {
    Cookies.remove('userId');
    Cookies.remove('username');
    navigate('/');
  };

  const handleKeycloakLogin = () => {
    window.location.href = 'http://localhost:8000/auth/login';
  };

  if (!userId) {
    return (
      <AppBar position="static">
        <Toolbar>
          <PollIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              VotingApplication
            </RouterLink>
          </Typography>
          <Button color="inherit" onClick={() => handleTabChange('/')}>
            Home
          </Button>
          <Button color="inherit" onClick={() => setOpen(true)}>
            Login
          </Button>
        </Toolbar>

        <Dialog open={open} onClose={() => setOpen(false)}>
          <DialogTitle>{isSignUp ? 'Sign Up' : 'Sign In'}</DialogTitle>
          <DialogContent>
            {error && (
              <Typography color="error" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}
            {isSignUp && (
              <TextField
                autoFocus
                margin="dense"
                label="Username"
                fullWidth
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            )}
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Button
              fullWidth
              variant="outlined"
              onClick={handleKeycloakLogin}
              sx={{ mt: 2, backgroundColor: '#f0f0f0' }}
            >
              <img 
                src="https://www.keycloak.org/resources/images/icon.svg" 
                alt="Keycloak" 
                width="20" 
                style={{ marginRight: 8 }}
              />
              Sign in with Keycloak
            </Button>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsSignUp(!isSignUp)}>
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Button>
            <Button onClick={isSignUp ? handleSignUp : handleSignIn}>
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </DialogActions>
        </Dialog>
      </AppBar>
    );
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <PollIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          <RouterLink to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            VotingPage
          </RouterLink>
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          gap: 2,
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)'
        }}>
          <Button 
            color="inherit" 
            onClick={() => handleTabChange('/')}
            sx={{ 
              backgroundColor: location.pathname === '/' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            onClick={() => handleTabChange('/my-polls')}
            sx={{ 
              backgroundColor: location.pathname === '/my-polls' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            My Polls
          </Button>
          <Button 
            color="inherit" 
            onClick={() => handleTabChange('/vote')}
            sx={{ 
              backgroundColor: location.pathname === '/vote' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            Vote
          </Button>
          <Button 
            color="inherit" 
            onClick={() => handleTabChange('/groups')}
            sx={{ 
              backgroundColor: location.pathname === '/groups' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            Groups
          </Button>
          <Button 
            color="inherit" 
            onClick={() => handleTabChange('/results')}
            sx={{ 
              backgroundColor: location.pathname === '/results' ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
            }}
          >
            Results
          </Button>
        </Box>
        <Button color="inherit" onClick={handleLogout}>
          Logout
        </Button>
        <Typography variant="body1" sx={{ ml: 2 }}>
          Logged as: {username}
        </Typography>
      </Toolbar>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{isSignUp ? 'Sign Up' : 'Sign In'}</DialogTitle>
        <DialogContent>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}
          {isSignUp && (
            <TextField
              autoFocus
              margin="dense"
              label="Username"
              fullWidth
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          )}
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <Button
            fullWidth
            variant="outlined"
            onClick={handleKeycloakLogin}
            sx={{ mt: 2, backgroundColor: '#f0f0f0' }}
          >
            <img 
              src="https://www.keycloak.org/resources/images/keycloak_logo_200px.svg" 
              alt="Keycloak" 
              width="20" 
              style={{ marginRight: 8 }}
            />
            Sign in with Keycloak
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsSignUp(!isSignUp)}>
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </Button>
          <Button onClick={isSignUp ? handleSignUp : handleSignIn}>
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
};

export default Navbar; 