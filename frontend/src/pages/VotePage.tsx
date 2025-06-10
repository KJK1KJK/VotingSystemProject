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
  TextField,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';

interface WhitelistEntry {
  user_id: number;
  session_id: number;
  id: number;
}

interface GroupWhitelistEntry {
  group_id: number;
  session_id: number;
  id: number;
}

interface GroupMember {
  user_id: number;
  id: number;
  group_id: number;
  time_joined: string;
}

interface Poll {
  id: number;
  title: string;
  description: string;
  is_published: boolean;
  group_member_count?: number;
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
  const [selectedCandidates, setSelectedCandidates] = useState<number[]>([]);
  const [openAnswerText, setOpenAnswerText] = useState<string>('');
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);
  const [hasJoinedPoll, setHasJoinedPoll] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const queryClient = useQueryClient();
  const userId = Cookies.get('userId');

  // Step 1: Fetch group whitelist entries
  const { data: groupWhitelist } = useQuery<GroupWhitelistEntry[]>({
    queryKey: ['groupWhitelist'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/group-whitelist/');
      return response.data;
    },
    enabled: !!userId,
  });

  const { data: polls, isLoading, error } = useQuery<Poll[]>({
    queryKey: ['publishedPolls'],
    queryFn: async () => {
      // Get all voting sessions
      const pollsResponse = await axios.get('http://localhost:8000/api/voting-sessions/');
      const allPolls = pollsResponse.data;

      // Filter polls based on group membership and published status
      const filteredPolls = await Promise.all(allPolls.map(async (poll: Poll) => {
        // 1. Check if poll is published
        if (!poll.is_published) {
          return { poll, shouldShow: false };
        }

        // Step 2a: Check if this session is in group whitelist
        const sessionGroupWhitelist = groupWhitelist?.filter(entry => entry.session_id === poll.id) || [];
        
        // Check if poll has any whitelisted groups
        if (sessionGroupWhitelist.length === 0) {
          return { poll, shouldShow: false };
        }

        // 2. Get all group IDs for this poll
        const groupIds = sessionGroupWhitelist.map(entry => entry.group_id);

        // Step 2c & 2d: Check membership for each group
        let isMemberOfAnyGroup = false;
        
        for (const groupId of groupIds) {
          try {
            const response = await axios.post('http://localhost:8000/api/user-groups/groups/members/by-id', {
              group_id: groupId
            });
            const groupMembers = response.data as GroupMember[];
            
            const isMember = groupMembers.some(member => member.user_id == Number(userId));

            if (isMember) {
              isMemberOfAnyGroup = true;
              break;
            }
          } catch (error) {
            console.error(`Error checking group membership for group ${groupId}:`, error);
          }
        }

        return { poll, shouldShow: isMemberOfAnyGroup };
      }));

      // Filter out polls that shouldn't be shown
      return filteredPolls.filter(result => result.shouldShow).map(result => result.poll);
    },
    enabled: !!userId && !!groupWhitelist,
    refetchInterval: 5000, // Refetch every 5 seconds to keep the list updated
  });

  // Add query for session votes
  const { data: sessionVotes } = useQuery({
    queryKey: ['sessionVotes'],
    queryFn: async () => {
      if (!polls) return {};
      const votesMap: Record<number, any[]> = {};
      
      // Fetch votes for each session
      await Promise.all(polls.map(async (poll) => {
        try {
          const response = await axios.get(`http://localhost:8000/api/votes/session/${poll.id}/results`);
          votesMap[poll.id] = response.data;
        } catch (error) {
          console.error(`Error fetching votes for session ${poll.id}:`, error);
          votesMap[poll.id] = [];
        }
      }));
      
      return votesMap;
    },
    enabled: !!userId && !!polls,
  });

  const handlePollClick = async (poll: Poll) => {
    if (selectedPoll?.id === poll.id) {
      setSelectedPoll(null);
      setSelectedCandidates([]);
      setCurrentQuestionId(null);
      setHasJoinedPoll(false);
      setHasVoted(false);
    } else {
      try {
        // Check if user has already voted in this poll
        const hasVotedInPoll = sessionVotes?.[poll.id]?.some(
          (vote: any) => vote.user_id === Number(userId)
        );

        if (hasVotedInPoll) {
          alert("You have already voted in this poll!");
          return;
        }

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

        // Set the poll with all questions and their candidates
        setSelectedPoll({
          ...sessionData,
          questions: questionsWithCandidates
        });
        
        // Reset selections and set first question as current
        setSelectedCandidates([]);
        if (questionsWithCandidates.length > 0) {
          setCurrentQuestionId(questionsWithCandidates[0].id);
        }
        setHasJoinedPoll(true);
      } catch (error) {
        console.error('Error fetching poll details:', error);
        alert('Failed to load poll details. Please try again.');
      }
    }
  };

  const handleSelectCandidate = (candidateId: number) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId) 
        : [...prev, candidateId]
    );
  };

  const handleSubmitVote = async () => {
    if (selectedCandidates.length === 0 && !openAnswerText.trim()) {
      alert("Please select at least one candidate or provide an answer!");
      return;
    }

    if (!currentQuestionId || !selectedPoll) {
      alert("No question selected!");
      return;
    }

    // Check if user has already voted in this poll
    const hasVotedInPoll = sessionVotes?.[selectedPoll.id]?.some(
      (vote: any) => vote.user_id === Number(userId)
    );

    if (hasVotedInPoll) {
      alert("You have already voted in this poll!");
      setSelectedPoll(null);
      setSelectedCandidates([]);
      setOpenAnswerText('');
      setCurrentQuestionId(null);
      setHasJoinedPoll(false);
      return;
    }

    try {
      // Handle regular candidate selections
      await Promise.all(selectedCandidates.map(async (candidateId) => {
        const response = await axios.post('http://localhost:8000/api/votes/', {
          user_id: Number(userId),
          candidate_id: candidateId
        });
        return response.data;
      }));

      // Handle open answer if present
      if (openAnswerText.trim()) {
        const currentQuestion = selectedPoll.questions?.find(q => q.id === currentQuestionId);
        const openAnswerCandidate = currentQuestion?.candidates.find(c => c.description === "open");
        
        if (openAnswerCandidate) {
          await axios.post('http://localhost:8000/api/votes/', {
            user_id: Number(userId),
            candidate_id: openAnswerCandidate.id,
            user_input: openAnswerText.trim()
          });
        }
      }

      alert("Votes submitted successfully!");
      setSelectedCandidates([]); // Clear selections
      setOpenAnswerText(''); // Clear open answer text

      // Move to next question or close dialog if it's the last question
      if (selectedPoll.questions) {
        const currentIndex = selectedPoll.questions.findIndex(q => q.id === currentQuestionId);
        if (currentIndex < selectedPoll.questions.length - 1) {
          // Move to next question
          setCurrentQuestionId(selectedPoll.questions[currentIndex + 1].id);
        } else {
          // All questions answered, close dialog
          setSelectedPoll(null);
          setCurrentQuestionId(null);
          setHasJoinedPoll(false);
          // Invalidate both polls and session votes queries to refresh the data
          queryClient.invalidateQueries({ queryKey: ['publishedPolls'] });
          queryClient.invalidateQueries({ queryKey: ['sessionVotes'] });
        }
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
      alert("Failed to submit votes. Please try again.");
    }
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

      {!polls || polls.length === 0 ? (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            There are no polls available for you to take part in at the moment.
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
            You will be able to vote in polls once you are added to their whitelist.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {polls.map((poll) => {
              // Check if user has already voted in this poll
              const hasVotedInPoll = sessionVotes?.[poll.id]?.some(
                (vote: any) => vote.user_id === Number(userId)
              );

              // Skip polls that have been voted on - they'll go in the Finished section
              if (hasVotedInPoll) return null;

              return (
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
              );
            })}
          </Box>

          {/* Finished Polls Section */}
          {polls.some(poll => sessionVotes?.[poll.id]?.some(
            (vote: any) => vote.user_id === Number(userId)
          )) && (
            <>
              <Typography variant="h4" gutterBottom sx={{ mt: 6 }}>
                Finished Polls
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
                {polls.map((poll) => {
                  // Check if user has already voted in this poll
                  const hasVotedInPoll = sessionVotes?.[poll.id]?.some(
                    (vote: any) => vote.user_id === Number(userId)
                  );

                  // Only show polls that have been voted on
                  if (!hasVotedInPoll) return null;

                  return (
                    <Card 
                      key={poll.id}
                      sx={{ 
                        cursor: 'not-allowed',
                        opacity: 0.7,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        '&:hover': {
                          boxShadow: 1,
                        },
                      }}
                    >
                      <CardContent>
                        <Typography variant="h6" component="h2">
                          {poll.title}
                        </Typography>
                        <Typography color="textSecondary" gutterBottom>
                          {poll.description}
                        </Typography>
                        <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                          ✓ You have completed this poll
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </>
          )}
        </>
      )}

      {/* Poll Dialog */}
      <Dialog 
        open={!!selectedPoll} 
        onClose={() => {
          setSelectedPoll(null);
          setSelectedCandidates([]);
          setOpenAnswerText('');
          setCurrentQuestionId(null);
        }}
        maxWidth="md"
        fullWidth
      >
        {selectedPoll && currentQuestionId && (
          <>
            <DialogTitle>{selectedPoll.title}</DialogTitle>
            <DialogContent>
              <Typography color="textSecondary" paragraph>
                {selectedPoll.description}
              </Typography>
              {selectedPoll.questions?.map((question) => (
                question.id === currentQuestionId && (
                  <FormControl key={question.id} component="fieldset" sx={{ mb: 3, width: '100%' }}>
                    <FormLabel component="legend">{question.title}</FormLabel>
                    {question.description && (
                      <Typography color="textSecondary" paragraph>
                        {question.description}
                      </Typography>
                    )}
                    <Box sx={{ mt: 2 }}>
                      {question.candidates.map((candidate) => (
                        candidate.description === "open" ? (
                          <TextField
                            key={candidate.id}
                            fullWidth
                            multiline
                            rows={3}
                            label="Your Answer"
                            value={openAnswerText}
                            onChange={(e) => setOpenAnswerText(e.target.value)}
                            sx={{ mb: 2 }}
                          />
                        ) : (
                          <FormControlLabel
                            key={candidate.id}
                            control={
                              <Checkbox
                                checked={selectedCandidates.includes(candidate.id)}
                                onChange={() => handleSelectCandidate(candidate.id)}
                              />
                            }
                            label={
                              <Box>
                                <Typography>{candidate.name}</Typography>
                                {candidate.description && candidate.description !== "closed" && (
                                  <Typography variant="body2" color="textSecondary">
                                    {candidate.description}
                                  </Typography>
                                )}
                              </Box>
                            }
                          />
                        )
                      ))}
                    </Box>
                  </FormControl>
                )
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setSelectedPoll(null);
                setSelectedCandidates([]);
                setOpenAnswerText('');
                setCurrentQuestionId(null);
              }}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitVote}
                variant="contained"
                color="primary"
              >
                Submit Vote
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default VotePage; 