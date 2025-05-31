import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';

interface Group {
  id: number;
  name: string;
}

interface Question {
  text: string;
  answers: string[];
}

const CreatePollPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<Question[]>([
    { text: '', answers: [''] },
  ]);
  const creator_id = Number(Cookies.get('userId'));
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  const { data: groups } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/user-groups/');
      return response.data;
    },
  });

  const createPollMutation = useMutation({
    mutationFn: async (pollData: {
      title: string;
      description: string;
      questions: Question[];
      creator_id: number;
      groupIds: number[];
    }) => {
      const response = await axios.post('http://localhost:8000/api/voting-sessions/', pollData);
      return response.data;
    },
    onSuccess: () => {
      navigate('/');
    },
  });

  const handleAddQuestion = () => {
    setQuestions([...questions, { text: '', answers: [''] }]);
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    setQuestions(newQuestions);
  };

  const handleAddAnswer = (questionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].answers.push('');
    setQuestions(newQuestions);
  };

  const handleRemoveAnswer = (questionIndex: number, answerIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].answers = newQuestions[questionIndex].answers.filter(
      (_, i) => i !== answerIndex
    );
    setQuestions(newQuestions);
  };

  const handleQuestionChange = (index: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[index].text = value;
    setQuestions(newQuestions);
  };

  const handleAnswerChange = (questionIndex: number, answerIndex: number, value: string) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].answers[answerIndex] = value;
    setQuestions(newQuestions);
  };

  const handleGroupChange = (event: SelectChangeEvent<number[]>) => {
    const value = event.target.value as number[];
    setSelectedGroups(value);
  };

  const handleSubmit = () => {
    createPollMutation.mutate({
      title,
      description,
      creator_id,
      questions,
      groupIds: selectedGroups,
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Create New Poll
      </Typography>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <TextField
            fullWidth
            label="Poll Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
            multiline
            rows={4}
          />
        </CardContent>
      </Card>

      {questions.map((question, questionIndex) => (
        <Card key={questionIndex} sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <TextField
                fullWidth
                label={`Question ${questionIndex + 1}`}
                value={question.text}
                onChange={(e) => handleQuestionChange(questionIndex, e.target.value)}
              />
              <IconButton
                onClick={() => handleRemoveQuestion(questionIndex)}
                color="error"
                sx={{ ml: 1 }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>

            {question.answers.map((answer, answerIndex) => (
              <Box key={answerIndex} display="flex" alignItems="center" mb={1}>
                <TextField
                  fullWidth
                  label={`Answer ${answerIndex + 1}`}
                  value={answer}
                  onChange={(e) =>
                    handleAnswerChange(questionIndex, answerIndex, e.target.value)
                  }
                />
                <IconButton
                  onClick={() => handleRemoveAnswer(questionIndex, answerIndex)}
                  color="error"
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={() => handleAddAnswer(questionIndex)}
              sx={{ mt: 1 }}
            >
              Add Answer
            </Button>
          </CardContent>
        </Card>
      ))}

      <Box display="flex" justifyContent="space-between" mb={4}>
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleAddQuestion}
        >
          Add Question
        </Button>
      </Box>

      <FormControl fullWidth sx={{ mb: 4 }}>
        <InputLabel>Select Groups</InputLabel>
        <Select
          multiple
          value={selectedGroups}
          onChange={handleGroupChange}
          input={<OutlinedInput label="Select Groups" />}
          renderValue={(selected) => (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((value) => (
                <Chip
                  key={value}
                  label={groups?.find((g) => g.id === value)?.name}
                />
              ))}
            </Box>
          )}
        >
          {groups?.map((group) => (
            <MenuItem key={group.id} value={group.id}>
              {group.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        onClick={handleSubmit}
        disabled={!title.trim() || questions.some((q) => !q.text.trim())}
      >
        Create Poll
      </Button>
    </Container>
  );
};

export default CreatePollPage; 