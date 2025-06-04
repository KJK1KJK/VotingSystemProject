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
  Divider,
  TextField,
  IconButton,
  Checkbox,
  Autocomplete,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PublishIcon from '@mui/icons-material/Publish';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface Poll {
  id: number;
  title: string;
  description: string;
  is_published: boolean;
  creator_id: number;
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

interface Question {
  text: string;
  options: {
    text: string;
    isOpenAnswer: boolean;
  }[];
}

interface WhitelistEntry {
  user_id: number;
  session_id: number;
  id: number;
}

interface UserGroup {
  id: number;
  name: string;
  description: string;
  creator_id: number;
}

const MyPollsPage = () => {
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPollTitle, setNewPollTitle] = useState('');
  const [newPollDescription, setNewPollDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([{ 
    text: '', 
    options: [{ text: '', isOpenAnswer: false }] 
  }]);
  const queryClient = useQueryClient();
  const userId = Cookies.get('userId');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);
  const [selectedGroups, setSelectedGroups] = useState<UserGroup[]>([]);

  // Fetch whitelist data
  const { data: whitelist } = useQuery<WhitelistEntry[]>({
    queryKey: ['whitelist'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/whitelist/');
      return response.data;
    },
    enabled: !!userId,
  });

  const { data: polls, isLoading, error } = useQuery<Poll[]>({
    queryKey: ['polls'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/voting-sessions/');
      return response.data;
    },
    enabled: !!userId,
  });

  // Filter polls based on creator only
  const filteredPolls = polls?.filter(poll => {
    // Only show polls created by the current user
    return poll.creator_id === Number(userId);
  });

  // Add query for user groups
  const { data: userGroups } = useQuery<UserGroup[]>({
    queryKey: ['userGroups'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/user-groups/');
      return response.data;
    },
  });

  const createPollMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      questions: Question[];
      creator_id: number;
      selectedGroups: UserGroup[];
    }) => {
      // 1. Create voting session
      const sessionResponse = await axios.post('http://localhost:8000/api/voting-sessions/', {
        title: data.title,
        description: data.description,
        creator_id: data.creator_id
      });
      const sessionId = sessionResponse.data.id;

      // 2. Create questions
      for (const question of data.questions) {
        const questionResponse = await axios.post(`http://localhost:8000/api/questions/${sessionId}/questions/`, {
          type: "multiple_choice",
          title: question.text,
          description: "",
          is_quiz: false
        });

        // 3. Create candidates for each question
        for (const option of question.options) {
          await axios.post(`http://localhost:8000/api/candidates/${questionResponse.data.id}/candidates/`, {
            name: option.text,
            description: option.isOpenAnswer ? "open" : "closed",
            user_input: ""
          });
        }
      }

      // 4. Add selected groups to whitelist
      for (const group of data.selectedGroups) {
        await axios.post('http://localhost:8000/api/whitelist/group', {
          group_id: group.id,
          session_id: sessionId
        });
      }

      return sessionResponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setCreateDialogOpen(false);
      resetCreateForm();
      setSelectedPoll(null);
      setSelectedGroups([]);
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (data: { pollId: number; answers: Record<number, number> }) => {
      const response = await axios.post('http://localhost:8000/api/votes/', {
        user_id: Number(userId),
        poll_id: data.pollId,
        creator_id: Number(userId),
        answers: Object.entries(data.answers).map(([questionId, optionId]) => ({
          question_id: Number(questionId),
          option_id: optionId,
        })),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setSelectedPoll(null);
      setSelectedAnswers({});
    },
  });

  const publishPollMutation = useMutation({
    mutationFn: async (pollId: number) => {
      const response = await axios.patch(`http://localhost:8000/api/voting-sessions/${pollId}/publish/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setSelectedPoll(null);
    },
  });

  const finishPollMutation = useMutation({
    mutationFn: async (pollId: number) => {
      const response = await axios.put(`http://localhost:8000/api/voting-sessions/${pollId}/finish/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setSelectedPoll(null);
    },
  });

  const deletePollMutation = useMutation({
    mutationFn: async (pollId: number) => {
      const response = await axios.delete(`http://localhost:8000/api/voting-sessions/${pollId}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls'] });
      setDeleteConfirmOpen(false);
      setPollToDelete(null);
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

  const handleAnswerSelect = (questionId: number, optionId: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitVote = () => {
    if (!selectedPoll || !selectedPoll.questions) return;
    
    const allQuestionsAnswered = selectedPoll.questions.every(
      question => selectedAnswers[question.id] !== undefined
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

  const handleEditPoll = async (poll: Poll) => {
    setNewPollTitle(poll.title);
    setNewPollDescription(poll.description);
    setQuestions(poll.questions?.map(q => ({
      text: q.title,
      options: q.candidates.map(c => ({
        text: c.name,
        isOpenAnswer: c.description === "open"
      }))
    })) || [{ text: '', options: [{ text: '', isOpenAnswer: false }] }]);
    setCreateDialogOpen(true);
    setSelectedPoll(poll);
    setSelectedGroups([]); // Reset selected groups
  };

  const handleUpdatePoll = async () => {
    if (!selectedPoll) return;

    if (!newPollTitle.trim() || !newPollDescription.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (questions.some(q => !q.text.trim() || q.options.some(o => !o.isOpenAnswer && !o.text.trim()))) {
      alert('Please fill in all questions and non-open answer options');
      return;
    }

    try {
      // 1. Update voting session
      await axios.put(`http://localhost:8000/api/voting-sessions/${selectedPoll.id}/`, {
        title: newPollTitle,
        description: newPollDescription,
        is_published: selectedPoll.is_published
      });

      // 2. Get existing questions
      const questionsResponse = await axios.get(`http://localhost:8000/api/questions/${selectedPoll.id}/questions/`);
      const existingQuestions = questionsResponse.data;

      // 3. Update or create questions
      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        if (i < existingQuestions.length) {
          // Update existing question
          await axios.put(`http://localhost:8000/api/questions/questions/${existingQuestions[i].id}/`, {
            type: "multiple_choice",
            title: question.text,
            description: "",
            is_quiz: false
          });

          // Get existing candidates for this question
          const candidatesResponse = await axios.get(`http://localhost:8000/api/candidates/${existingQuestions[i].id}/candidates/`);
          const existingCandidates = candidatesResponse.data;

          // Update or create candidates
          for (let j = 0; j < question.options.length; j++) {
            const option = question.options[j];
            if (j < existingCandidates.length) {
              // Update existing candidate
              await axios.put(`http://localhost:8000/api/candidates/candidates/${existingCandidates[j].id}/`, {
                name: option.text,
                description: option.isOpenAnswer ? "open" : "closed",
                user_input: ""
              });
            } else {
              // Create new candidate
              await axios.post(`http://localhost:8000/api/candidates/${existingQuestions[i].id}/candidates/`, {
                name: option.text,
                description: option.isOpenAnswer ? "open" : "closed",
                user_input: ""
              });
            }
          }
        } else {
          // Create new question
          const questionResponse = await axios.post(`http://localhost:8000/api/questions/${selectedPoll.id}/questions/`, {
            type: "multiple_choice",
            title: question.text,
            description: "",
            is_quiz: false
          });

          // Create candidates for new question
          for (const option of question.options) {
            await axios.post(`http://localhost:8000/api/candidates/${questionResponse.data.id}/candidates/`, {
              name: option.text,
              description: option.isOpenAnswer ? "open" : "closed",
              user_input: ""
            });
          }
        }
      }

      // Delete any extra questions and their candidates
      for (let i = questions.length; i < existingQuestions.length; i++) {
        await axios.delete(`http://localhost:8000/api/questions/questions/${existingQuestions[i].id}/`);
      }

      // Update whitelist groups
      // First, get current whitelist entries
      const whitelistResponse = await axios.post(`http://localhost:8000/api/whitelist/session`, {
        session_id: selectedPoll.id
      });
      const currentWhitelist = whitelistResponse.data;

      // Remove all current whitelist entries
      for (const entry of currentWhitelist) {
        await axios.delete('http://localhost:8000/api/whitelist/', {
          data: { user_id: entry.user_id, session_id: selectedPoll.id }
        });
      }

      // Add new selected groups to whitelist
      for (const group of selectedGroups) {
        await axios.post('http://localhost:8000/api/whitelist/group', {
          group_id: group.id,
          session_id: selectedPoll.id
        });
      }

      // Reset form and close dialog
      setCreateDialogOpen(false);
      resetCreateForm();
      setSelectedPoll(null);
      setSelectedGroups([]);
      
      // Refresh the polls list
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    } catch (error) {
      console.error('Error updating poll:', error);
      alert('Failed to update poll. Please try again.');
    }
  };

  const handleCreatePoll = () => {
    if (!newPollTitle.trim() || !newPollDescription.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (questions.some(q => !q.text.trim() || q.options.some(o => !o.isOpenAnswer && !o.text.trim()))) {
      alert('Please fill in all questions and non-open answer options');
      return;
    }

    createPollMutation.mutate({
      title: newPollTitle,
      description: newPollDescription,
      questions,
      creator_id: Number(userId),
      selectedGroups
    });
  };

  const resetCreateForm = () => {
    setNewPollTitle('');
    setNewPollDescription('');
    setQuestions([{ text: '', options: [{ text: '', isOpenAnswer: false }] }]);
    setSelectedGroups([]);
  };

  const addQuestion = () => {
    setQuestions([...questions, { text: '', options: [{ text: '', isOpenAnswer: false }] }]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options.push({ text: '', isOpenAnswer: false });
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setQuestions(newQuestions);
  };

  const updateQuestionText = (index: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = text;
    setQuestions(newQuestions);
  };

  const updateOptionText = (questionIndex: number, optionIndex: number, text: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex].text = text;
    setQuestions(newQuestions);
  };

  const toggleOptionType = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex].isOpenAnswer = 
      !newQuestions[questionIndex].options[optionIndex].isOpenAnswer;
    setQuestions(newQuestions);
  };

  const handlePublishPoll = () => {
    if (selectedPoll) {
      publishPollMutation.mutate(selectedPoll.id);
    }
  };

  const handleFinishPoll = () => {
    if (selectedPoll) {
      finishPollMutation.mutate(selectedPoll.id);
    }
  };

  const handleDeleteClick = (poll: Poll, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the poll click event
    setPollToDelete(poll);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (pollToDelete) {
      deletePollMutation.mutate(pollToDelete.id);
    }
  };

  if (!userId) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Please sign in to view your polls
        </Typography>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading your polls...</Typography>
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

  const publishedPolls = filteredPolls?.filter(poll => poll.is_published) || [];
  const unpublishedPolls = filteredPolls?.filter(poll => !poll.is_published) || [];

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          My Polls
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Poll
        </Button>
      </Box>

      {publishedPolls.length === 0 && unpublishedPolls.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h6" color="textSecondary">
            You haven't created any polls yet. Click the "Create Poll" button to get started!
          </Typography>
        </Box>
      )}

      {publishedPolls.length > 0 && (
        <>
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Published Polls
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3, mb: 4 }}>
            {publishedPolls.map((poll) => (
              <Card 
                key={poll.id}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                  },
                  display: 'flex',
                  flexDirection: 'row',
                }}
                onClick={() => handlePollClick(poll)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2">
                    {poll.title}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {poll.description}
                  </Typography>
                </CardContent>
                <Box
                  sx={{
                    backgroundColor: 'error.main',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    px: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'error.dark',
                    },
                  }}
                  onClick={(e) => handleDeleteClick(poll, e)}
                >
                  <DeleteIcon sx={{ color: 'white' }} />
                </Box>
              </Card>
            ))}
          </Box>
        </>
      )}

      {unpublishedPolls.length > 0 && (
        <>
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Draft Polls
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {unpublishedPolls.map((poll) => (
              <Card 
                key={poll.id}
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 6,
                  },
                  display: 'flex',
                  flexDirection: 'row',
                }}
                onClick={() => handlePollClick(poll)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2">
                    {poll.title}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {poll.description}
                  </Typography>
                </CardContent>
                <Box
                  sx={{
                    backgroundColor: 'error.main',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    px: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'error.dark',
                    },
                  }}
                  onClick={(e) => handleDeleteClick(poll, e)}
                >
                  <DeleteIcon sx={{ color: 'white' }} />
                </Box>
              </Card>
            ))}
          </Box>
        </>
      )}

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
                <Box key={question.id} sx={{ mb: 4, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {question.title}
                  </Typography>
                  {question.description && (
                    <Typography color="textSecondary" paragraph>
                      {question.description}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Candidates:
                    </Typography>
                    {question.candidates.map((candidate) => (
                      <Box key={candidate.id} sx={{ ml: 2, mb: 1 }}>
                        <Typography>
                          • {candidate.name}
                          {candidate.description && ` - ${candidate.description}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedPoll(null)}>Cancel</Button>
              {!selectedPoll.is_published ? (
                <>
                  <Button
                    onClick={() => handleEditPoll(selectedPoll)}
                    startIcon={<EditIcon />}
                    color="primary"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={handlePublishPoll}
                    startIcon={<PublishIcon />}
                    variant="contained"
                    color="primary"
                    disabled={publishPollMutation.isPending}
                  >
                    {publishPollMutation.isPending ? <CircularProgress size={24} /> : 'Publish'}
                  </Button>
                </>
              ) : null}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Create/Edit Poll Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => {
          setCreateDialogOpen(false);
          resetCreateForm();
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedPoll ? 'Edit Poll' : 'Create New Poll'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Poll Title"
            fullWidth
            value={newPollTitle}
            onChange={(e) => setNewPollTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newPollDescription}
            onChange={(e) => setNewPollDescription(e.target.value)}
          />
          
          {questions.map((question, questionIndex) => (
            <Box key={questionIndex} sx={{ mt: 3, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Question {questionIndex + 1}</Typography>
                <IconButton 
                  onClick={() => removeQuestion(questionIndex)}
                  disabled={questions.length === 1}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
              <TextField
                margin="dense"
                label="Question Text"
                fullWidth
                value={question.text}
                onChange={(e) => updateQuestionText(questionIndex, e.target.value)}
              />
              {question.options.map((option, optionIndex) => (
                <Box key={optionIndex} display="flex" alignItems="center" mt={1}>
                  <TextField
                    margin="dense"
                    label={`Option ${optionIndex + 1}`}
                    fullWidth
                    value={option.text}
                    onChange={(e) => updateOptionText(questionIndex, optionIndex, e.target.value)}
                    disabled={option.isOpenAnswer}
                  />
                  <Box sx={{ ml: 2 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={option.isOpenAnswer}
                          onChange={() => toggleOptionType(questionIndex, optionIndex)}
                        />
                      }
                      label="Open Answer"
                    />
                  </Box>
                  <IconButton 
                    onClick={() => removeOption(questionIndex, optionIndex)}
                    disabled={question.options.length === 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                onClick={() => addOption(questionIndex)}
                sx={{ mt: 1 }}
              >
                Add Option
              </Button>
            </Box>
          ))}
          
          <Button
            onClick={addQuestion}
            sx={{ mt: 2 }}
          >
            Add Question
          </Button>
          <Autocomplete
            multiple
            options={userGroups || []}
            getOptionLabel={(option) => option.name}
            value={selectedGroups}
            onChange={(_, newValue) => setSelectedGroups(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Whitelist Groups"
                placeholder="Select groups"
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            resetCreateForm();
          }}>Cancel</Button>
          <Button 
            onClick={selectedPoll ? handleUpdatePoll : handleCreatePoll}
            variant="contained"
            color="primary"
            disabled={createPollMutation.isPending}
          >
            {selectedPoll ? 'Save Changes' : 'Create Poll'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setPollToDelete(null);
        }}
      >
        <DialogTitle>Delete Poll</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{pollToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setDeleteConfirmOpen(false);
              setPollToDelete(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deletePollMutation.isPending}
          >
            {deletePollMutation.isPending ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyPollsPage; 