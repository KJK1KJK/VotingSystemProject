import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Pages
import HomePage from './pages/HomePage';
import GroupsPage from './pages/GroupsPage';
import ResultsPage from './pages/ResultsPage';
import MyPollsPage from './pages/MyPollsPage';
import VotePage from './pages/VotePage';
import AuthCallback from './pages/AuthCallback';

// Components
import Navbar from './components/Navbar';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/my-polls" element={<MyPollsPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/results/:pollId" element={<ResultsPage />} />
            <Route path="/vote" element={<VotePage />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
