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
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  CircularProgress,
  Checkbox,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';

interface Poll {
  id: number;
  title: string;
  description: string;
  questions?: {
    id: number;
    text: string;
    type: string;
    title: string;
    description: string;
    is_quiz: boolean;
    candidates: {
      id: number;
      name: string;
      description: string;
      user_input: string;
    }[];
  }[];
}

const VotePage = () => {
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number[]>>({});
  const queryClient = useQueryClient();
  const userId = Cookies.get('userId');

  const { data: polls, isLoading, error } = useQuery<Poll[]>({
    queryKey: ['publishedPolls'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/voting-sessions/');
      return response.data;
    },
    enabled: !!userId,
  });

  const voteMutation = useMutation({
    mutationFn: async (data: { pollId: number; answers: Record<number, number[]> }) => {
      const response = await axios.post('http://localhost:8000/api/votes/', {
        user_id: Number(userId),
        poll_id: data.pollId,
        creator_id: Number(userId),
        answers: Object.entries(data.answers).map(([questionId, candidateIds]) => ({
          question_id: Number(questionId),
          candidate_ids: candidateIds,
        })),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['publishedPolls'] });
      setSelectedPoll(null);
      setSelectedAnswers({});
    },
  });

  const handlePollClick = async (poll: Poll) => {
    try {
      // Fetch the voting session with its questions
      const sessionResponse = await axios.get(`http://localhost:8000/api/voting-sessions/${poll.id}`);
      const sessionData = sessionResponse.data;

      // Fetch questions for this session
      const questionsResponse = await axios.get(`http://localhost:8000/api/questions/${poll.id}/questions/`);
      const questionsData = questionsResponse.data;

      // Fetch candidates for each question
      const questionsWithCandidates = await Promise.all(
        questionsData.map(async (question: any) => {
          const candidatesResponse = await axios.get(`http://localhost:8000/api/candidates/${question.id}/candidates/`);
          return {
            ...question,
            candidates: candidatesResponse.data
          };
        })
      );

      setSelectedPoll({
        ...sessionData,
        questions: questionsWithCandidates
      });
      setSelectedAnswers({});
    } catch (error) {
      console.error('Error fetching poll details:', error);
      alert('Failed to load poll details. Please try again.');
    }
  };

  const handleAnswerSelect = (questionId: number, candidateId: number, isChecked: boolean) => {
    setSelectedAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      if (isChecked) {
        return {
          ...prev,
          [questionId]: [...currentAnswers, candidateId]
        };
      } else {
        return {
          ...prev,
          [questionId]: currentAnswers.filter(id => id !== candidateId)
        };
      }
    });
  };

  const handleSubmitVote = () => {
    if (!selectedPoll || !selectedPoll.questions) return;
    
    const allQuestionsAnswered = selectedPoll.questions.every(
      question => selectedAnswers[question.id]?.length > 0
    );

    if (!allQuestionsAnswered) {
      alert('Please answer all questions before submitting.');
      return;
    }

    voteMutation.mutate({
      pollId: selectedPoll.id,
      answers: selectedAnswers,
    });
  };

  if (!userId) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please sign in to view available polls
        </Typography>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading available polls...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography color="error">Error loading polls</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Available Polls
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
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Poll Dialog */}
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
              {selectedPoll.questions?.map((question) => (
                <FormControl key={question.id} component="fieldset" sx={{ mb: 3, width: '100%' }}>
                  <FormLabel component="legend">{question.title}</FormLabel>
                  {question.description && (
                    <Typography color="textSecondary" paragraph>
                      {question.description}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2 }}>
                    {question.candidates.map((candidate) => (
                      <FormControlLabel
                        key={candidate.id}
                        control={
                          <Checkbox
                            checked={selectedAnswers[question.id]?.includes(candidate.id) || false}
                            onChange={(e) => handleAnswerSelect(question.id, candidate.id, e.target.checked)}
                          />
                        }
                        label={
                          <Box>
                            <Typography>{candidate.name}</Typography>
                            {candidate.description && (
                              <Typography variant="body2" color="textSecondary">
                                {candidate.description}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    ))}
                  </Box>
                </FormControl>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPoll(null)}>Cancel</Button>
              <Button
                onClick={handleSubmitVote}
                variant="contained"
                color="primary"
                disabled={voteMutation.isPending}
              >
                {voteMutation.isPending ? <CircularProgress size={24} /> : 'Submit Vote'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default VotePage; 