import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import Cookies from 'js-cookie';

const HomePage = () => {
  const userId = Cookies.get('userId');

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome to VotingPage
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          {userId
            ? "Welcome back! You can now create and manage polls, join groups, and participate in voting sessions."
            : "Sign in to create polls, join groups, and participate in voting sessions."}
        </Typography>
      </Paper>

      <Box sx={{ display: 'grid', gap: 3 }}>
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            What is VotingPage?
          </Typography>
          <Typography variant="body1" paragraph>
            VotingPage is a modern polling application that allows you to create and participate in polls within groups. 
            Whether you're organizing a team vote, gathering feedback, or making group decisions, VotingPage makes it easy 
            and efficient.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Key Features
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>Create and manage polls with multiple options</li>
              <li>Join or create groups to organize your polls</li>
              <li>Real-time results and statistics</li>
              <li>Secure voting system</li>
              <li>Easy-to-use interface</li>
            </ul>
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Getting Started
          </Typography>
          <Typography variant="body1" paragraph>
            To get started, simply sign in to your account. Once logged in, you can:
          </Typography>
          <Typography variant="body1" component="div">
            <ul>
              <li>Browse and join existing groups</li>
              <li>Create your own groups</li>
              <li>Create new polls</li>
              <li>Participate in active polls</li>
              <li>View results of completed polls</li>
            </ul>
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default HomePage; 