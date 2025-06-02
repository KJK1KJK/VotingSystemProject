import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';

import { useNavigate } from 'react-router-dom';

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const SignInDialog = ({ open, onClose, onLoginSuccess }: SignInDialogProps) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  //SSO variable
  const navigate = useNavigate();

  const signInMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const response = await axios.post('http://localhost:8000/api/users/login/', credentials);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Login response:', data); // Debug log
      // Store only the userID in cookie
      if (data && data.id) {
        Cookies.set('userId', data.id, { expires: 7 }); // Expires in 7 days
        Cookies.set('username', data.username, { expires: 7 }); // Expires in 7 days
        onLoginSuccess();
        onClose();
      } else {
        setError('Invalid response from server');
      }
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Failed to sign in');
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async (userData: { email: string; password: string; username: string }) => {
      const response = await axios.post('http://localhost:8000/api/users/', userData);
      return response.data;
    },
    onSuccess: () => {
      // After successful signup, automatically sign in
      signInMutation.mutate({ email, password });
    },
    onError: (error: any) => {
      console.error('Signup error:', error);
      setError(error.response?.data?.detail || 'Failed to sign up');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (mode === 'signin') {
      signInMutation.mutate({ email, password });
    } else {
      signUpMutation.mutate({ email, password, username });
    }
  };

  const handleClose = () => {
    setMode('signin');
    setEmail('');
    setPassword('');
    setUsername('');
    setError('');
    onClose();
  };

  //Handle Keycloak redirect
  const handleKeycloakLogin = () => {
    window.location.href = 'http://localhost:8000/auth/login';
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          <Tabs
            value={mode}
            onChange={(_, newValue) => setMode(newValue)}
            centered
            sx={{ mb: 2 }}
          >
            <Tab label="Sign In" value="signin" />
            <Tab label="Sign Up" value="signup" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {mode === 'signup' && (
              <TextField
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                fullWidth
              />
            )}
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
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
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={signInMutation.isPending || signUpMutation.isPending}
          >
            {mode === 'signin'
              ? signInMutation.isPending
                ? 'Signing in...'
                : 'Sign In'
              : signUpMutation.isPending
              ? 'Signing up...'
              : 'Sign Up'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SignInDialog; 