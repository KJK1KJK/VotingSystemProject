import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Box,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';
import Cookies from 'js-cookie';

interface Group {
  id: number;
  name: string;
  description: string;
  creator: User;
}

interface User {
  id: number;
  name: string;
  email: string;
}

interface GroupWithMembers extends Group {
  memberCount: number;
}

const GroupsPage = () => {
  const [open, setOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const queryClient = useQueryClient();
  const currentUserId = Number(Cookies.get('userId'));

  const { data: groups, isLoading: isLoadingGroups } = useQuery<Group[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/user-groups/');
      return response.data;
    },
  });

  const { data: groupsWithMembers, isLoading: isLoadingMembers } = useQuery<GroupWithMembers[]>({
    queryKey: ['groupsWithMembers', groups],
    queryFn: async () => {
      if (!groups) return [];
      
      const memberCounts = await Promise.all(
        groups.map(async (group) => {
          try {
            const response = await axios.get(`http://localhost:8000/api/user-groups/groups/members/by-name?group_name=${encodeURIComponent(group.name)}`);
            return {
              ...group,
              memberCount: response.data.length
            };
          } catch (error) {
            console.error(`Error fetching members for group ${group.name}:`, error);
            return {
              ...group,
              memberCount: 0
            };
          }
        })
      );
      
      return memberCounts;
    },
    enabled: !!groups,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (newGroup: { name: string; description: string; creator_id: number }) => {
      const response = await axios.post('http://localhost:8000/api/user-groups/', newGroup);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
    },
  });

  const handleCreateGroup = () => {
    createGroupMutation.mutate({
      name: newGroupName,
      description: newGroupDescription,
      creator_id: currentUserId
    });
  };

  if (isLoadingGroups || isLoadingMembers) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const sortedGroups = groupsWithMembers?.sort((a, b) => {
    // First sort by creator status (groups created by current user first)
    const aIsCreator = a.creator?.id === currentUserId;
    const bIsCreator = b.creator?.id === currentUserId;
    
    if (aIsCreator && !bIsCreator) return -1;
    if (!aIsCreator && bIsCreator) return 1;
    // Then sort by name
    return a.name.localeCompare(b.name);
  }) || [];

  const createdGroups = sortedGroups.filter(group => group.creator?.id === currentUserId);
  const joinedGroups = sortedGroups.filter(group => group.creator?.id !== currentUserId);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1">
          My Groups
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Create New Group
        </Button>
      </Box>

      {createdGroups.length > 0 && (
        <>
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Groups I Created
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3, mb: 4 }}>
            {createdGroups.map((group) => (
              <Box key={group.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2">
                      {group.name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {group.description}
                    </Typography>
                    <Typography variant="subtitle1">
                      Members: {group.memberCount}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </>
      )}

      {joinedGroups.length > 0 && (
        <>
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            Groups I Joined
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
            {joinedGroups.map((group) => (
              <Box key={group.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" component="h2">
                      {group.name}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      {group.description}
                    </Typography>
                    <Typography variant="subtitle1">
                      Members: {group.memberCount}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </>
      )}

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            color="primary"
            disabled={!newGroupName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GroupsPage; 