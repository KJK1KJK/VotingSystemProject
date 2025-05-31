import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

interface Poll {
  id: number;
  title: string;
  description: string;
  end_date: string;
  questions: {
    id: number;
    text: string;
    options: {
      id: number;
      text: string;
      votes: number;
    }[];
  }[];
}

const ResultsPage = () => {
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const userId = Cookies.get('userId');

  const { data: polls, isLoading, error } = useQuery<Poll[]>({
    queryKey: ['finishedPolls'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/voting-sessions/finished/');
      return response.data;
    },
    enabled: !!userId,
  });

  const handlePollClick = async (poll: Poll) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/voting-sessions/${poll.id}/results/`);
      setSelectedPoll(response.data);
    } catch (error) {
      console.error('Error fetching poll results:', error);
      alert('Failed to load poll results. Please try again.');
    }
  };

  const handleExportResults = async () => {
    if (!selectedPoll) return;

    try {
      const response = await axios.get(
        `http://localhost:8000/api/voting-sessions/${selectedPoll.id}/export/`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedPoll.title}_results.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error exporting results:', error);
      alert('Failed to export results. Please try again.');
    }
  };

  if (!userId) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please sign in to view results
        </Typography>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading results...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error">Error loading results</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Poll Results
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
        {polls?.map((poll) => (
          <Card 
            key={poll.id}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 6,
              },
            }}
            onClick={() => handlePollClick(poll)}
          >
            <CardContent>
              <Typography variant="h6" component="h2">
                {poll.title}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                {poll.description}
              </Typography>
              <Typography variant="subtitle2" color="textSecondary">
                Ended: {new Date(poll.end_date).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Results Dialog */}
      <Dialog 
        open={!!selectedPoll} 
        onClose={() => setSelectedPoll(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedPoll && (
          <>
            <DialogTitle>{selectedPoll.title}</DialogTitle>
            <DialogContent>
              <Typography color="textSecondary" paragraph>
                {selectedPoll.description}
              </Typography>
              {selectedPoll.questions.map((question) => {
                const totalVotes = question.options.reduce((sum, option) => sum + option.votes, 0);
                return (
                  <Box key={question.id} sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom>
                      {question.text}
                    </Typography>
                    {question.options.map((option) => {
                      const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
                      return (
                        <Box key={option.id} sx={{ mb: 2 }}>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography>{option.text}</Typography>
                            <Typography>
                              {option.votes} votes ({percentage.toFixed(1)}%)
                            </Typography>
                          </Box>
                          <LinearProgress 
                            variant="determinate" 
                            value={percentage} 
                            sx={{ height: 10, borderRadius: 5 }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                );
              })}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPoll(null)}>Cancel</Button>
              <Button
                onClick={handleExportResults}
                startIcon={<FileDownloadIcon />}
                variant="contained"
                color="primary"
              >
                Export Results
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default ResultsPage; 