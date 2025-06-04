import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  IconButton,
  CardActions,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';
import DownloadIcon from '@mui/icons-material/Download';

interface Vote {
  id: number;
  session_id: number;
  user_id: number;
  candidate_id: number;
  time_voted: string;
}

interface Poll {
  id: number;
  title: string;
  description: string;
  is_published: boolean;
  creator_id: number;
}

interface Question {
  id: number;
  session_id: number;
  text: string;
}

interface Candidate {
  id: number;
  question_id: number;
  text: string;
  votes: number;
}

interface PollResult {
  poll: Poll;
  questions: {
    question: Question;
    candidates: Candidate[];
    userVote: Vote | null;
  }[];
}

const ResultsPage = () => {
  const userId = Cookies.get('userId');

  const { data: userVotes, isLoading: isLoadingVotes } = useQuery<Vote[]>({
    queryKey: ['userVotes'],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:8000/api/votes/user/${userId}`);
      return response.data;
    },
    enabled: !!userId,
  });

  const { data: polls, isLoading: isLoadingPolls } = useQuery<Poll[]>({
    queryKey: ['polls'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/voting-sessions/');
      return response.data;
    },
  });

  const { data: results, isLoading: isLoadingResults } = useQuery<PollResult[]>({
    queryKey: ['pollResults', userVotes, polls],
    queryFn: async () => {
      if (!userVotes || !polls) return [];

      const results: PollResult[] = [];

      for (const poll of polls) {
        // Only include polls where the current user is the creator
        if (!poll.is_published || poll.creator_id !== Number(userId)) continue;

        // Get questions for this poll
        const questionsResponse = await axios.get(`http://localhost:8000/api/questions/${poll.id}/questions/`);
        const questions: Question[] = questionsResponse.data;

        const pollQuestions = [];

        for (const question of questions) {
          // Get candidates for this question
          const candidatesResponse = await axios.get(`http://localhost:8000/api/candidates/${question.id}/candidates/`);
          const candidates: Candidate[] = candidatesResponse.data;

          // Find user's vote for this question
          const userVote = userVotes.find(vote => 
            candidates.some(candidate => candidate.id === vote.candidate_id)
          ) || null;

          pollQuestions.push({
            question,
            candidates,
            userVote
          });
        }

        // Only include polls where the user has voted
        
        results.push({
          poll,
          questions: pollQuestions
        });
        
      }

      return results;
    },
    enabled: !!userVotes && !!polls,
  });

  const handleDownloadResults = async (sessionId: number) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/votes/session/${sessionId}/results`);
      const votes = response.data;
      
      const prettyJson = JSON.stringify(votes, null, 2);
      
      const url = window.URL.createObjectURL(new Blob([prettyJson], { type: 'application/json' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `poll_${sessionId}_results.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading results:', error);
      alert('Failed to download results');
    }
  };

  if (isLoadingVotes || isLoadingPolls || isLoadingResults) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!results || results.length === 0) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="info">
          You haven't completed any polls yet. Results will appear here after you vote in published polls.
        </Alert>
      </Container>
    );
  }

  if (!userId) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please sign in to view results
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Poll Results
      </Typography>
      <Box sx={{ display: 'grid', gap: 3 }}>
        {results.map((result) => (
          <Card key={result.poll.id}>
            <Box sx={{ display: 'flex' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {result.poll.title}
                </Typography>
                <Typography color="textSecondary" paragraph>
                  {result.poll.description}
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {result.questions.map(({ question, candidates, userVote }) => (
                    <Box key={question.id} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" gutterBottom>
                        {question.text}
                      </Typography>
                      {candidates.map((candidate) => (
                        <Box key={candidate.id} sx={{ mb: 1, ml: 2 }}>
                          <Typography variant="body1">
                            {candidate.text}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ))}
                </Box>
              </CardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                p: 2,
                borderLeft: '1px solid',
                borderColor: 'divider'
              }}>
                <IconButton 
                  onClick={() => handleDownloadResults(result.poll.id)}
                  color="primary"
                  title="Download Results"
                  size="large"
                >
                  <DownloadIcon />
                </IconButton>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>
    </Container>
  );
};

export default ResultsPage; 