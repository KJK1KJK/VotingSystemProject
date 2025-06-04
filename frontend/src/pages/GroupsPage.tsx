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
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import Cookies from 'js-cookie';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';

interface UserGroup {
  id: number;
  name: string;
  description: string;
  creator_id: number;
}

interface User {
  id: number;
  username: string;
  email: string;
  time_created: string;
}

interface GroupMember {
  user_id: number;
  id: number;
  group_id: number;
  time_joined: string;
}

interface WhitelistEntry {
  id: number;
  user_id: number;
  session_id: number;
  group_id: number;
}

const GroupsPage = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<UserGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [inGroups, setInGroups] = useState<UserGroup[]>([]);
  const queryClient = useQueryClient();
  const userId = Cookies.get('userId');

  const { data: groups, isLoading } = useQuery<UserGroup[]>({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/user-groups/');
      return response.data;
    },
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:8000/api/users/');
      return response.data;
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; creator_id: number }) => {
      const response = await axios.post('http://localhost:8000/api/user-groups/', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      await axios.delete(`http://localhost:8000/api/user-groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setSelectedGroup(null);
      setGroupMembers([]);
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }) => {
      await axios.post(`http://localhost:8000/api/user-groups/${groupId}/members`, {
        user_id: userId
      });
    },
    onSuccess: () => {
      if (selectedGroup) {
        fetchGroupMembers(selectedGroup.id);
      }
      setSelectedUser(null);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }) => {
      await axios.delete(`http://localhost:8000/api/user-groups/${groupId}/members`, {
        data: { user_id: userId }
      });
    },
    onSuccess: () => {
      if (selectedGroup) {
        fetchGroupMembers(selectedGroup.id);
      }
    },
  });

  const fetchGroupMembers = async (groupId: number) => {
    try {
      const response = await axios.post('http://localhost:8000/api/user-groups/groups/members/by-id', {
        group_id: groupId
      });
      setGroupMembers(response.data);
    } catch (error) {
      console.error('Error fetching group members:', error);
    }
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      alert('Please enter a group name');
      return;
    }

    createGroupMutation.mutate({
      name: newGroupName,
      description: newGroupDescription,
      creator_id: Number(userId)
    });
  };

  const handleGroupClick = async (group: UserGroup) => {
    setSelectedGroup(group);
    await fetchGroupMembers(group.id);
  };

  const handleAddMember = async () => {
    if (!selectedUser) {
      alert('Please select a user');
      return;
    }

    // Check if user is already a member
    if (groupMembers.some(member => member.user_id === selectedUser.id)) {
      alert('This user is already a member of the group');
      return;
    }

    if (selectedGroup) {
      try {
        // Add user to group
        await addMemberMutation.mutateAsync({
          groupId: selectedGroup.id,
          userId: selectedUser.id
        });

        // Get all polls that this group is whitelisted for
        const whitelistResponse = await axios.get('http://localhost:8000/api/whitelist/');
        const whitelistEntries = whitelistResponse.data as WhitelistEntry[];
        const groupWhitelistEntries = whitelistEntries.filter(entry => 
          entry.group_id === selectedGroup.id
        );

        // Add user to whitelist for each poll
        for (const entry of groupWhitelistEntries) {
          await axios.post('http://localhost:8000/api/whitelist/', {
            user_id: selectedUser.id,
            session_id: entry.session_id
          });
        }

        setSelectedUser(null);
      } catch (error) {
        console.error('Error adding member:', error);
        alert('Failed to add member to group');
      }
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (selectedGroup) {
      try {
        // Get the user ID from the membership
        const member = groupMembers.find(m => m.id === memberId);
        if (!member) {
          console.error('Member not found');
          return;
        }

        // Get all polls that this group is whitelisted for
        const whitelistResponse = await axios.get('http://localhost:8000/api/whitelist/');
        const whitelistEntries = whitelistResponse.data as WhitelistEntry[];
        const groupWhitelistEntries = whitelistEntries.filter(entry => 
          entry.group_id === selectedGroup.id
        );

        // Remove user from whitelist for each poll
        for (const entry of groupWhitelistEntries) {
          await axios.delete('http://localhost:8000/api/whitelist/', {
            data: {
              user_id: member.user_id,
              session_id: entry.session_id
            }
          });
        }

        // Remove user from group
        await removeMemberMutation.mutateAsync({
          groupId: selectedGroup.id,
          userId: member.user_id
        });
      } catch (error) {
        console.error('Error removing member:', error);
        alert('Failed to remove member from group');
      }
    }
  };

  const handleDeleteGroup = (groupId: number) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      deleteGroupMutation.mutate(groupId);
    }
  };

  // Check membership for each group
  React.useEffect(() => {
    const checkMemberships = async () => {
      if (!groups || !userId) return;
      
      const membershipChecks = groups.map(async (group) => {
        if (group.creator_id === Number(userId)) return null;
        
        try {
          const response = await axios.post('http://localhost:8000/api/user-groups/groups/check-membership', {
            user_id: Number(userId),
            group_id: group.id
          });
          return response.data.is_member ? group : null;
        } catch (error) {
          console.error('Error checking membership:', error);
          return null;
        }
      });

      const results = await Promise.all(membershipChecks);
      const memberGroups = results.filter((group): group is UserGroup => group !== null);
      setInGroups(memberGroups);
    };

    checkMemberships();
  }, [groups, userId]);

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Loading groups...</Typography>
      </Container>
    );
  }

  const myGroups = groups?.filter(group => group.creator_id === Number(userId)) || [];

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">
          Groups
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create Group
        </Button>
      </Box>

      {/* My Groups Section */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        My Groups
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3, mb: 4 }}>
        {myGroups.map((group) => (
          <Card 
            key={group.id}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 6,
              },
              display: 'flex',
              flexDirection: 'row',
            }}
            onClick={() => handleGroupClick(group)}
          >
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h6" component="h2">
                {group.name}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                {group.description}
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
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteGroup(group.id);
              }}
            >
              <DeleteIcon sx={{ color: 'white' }} />
            </Box>
          </Card>
        ))}
      </Box>

      {/* In Groups Section */}
      <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
        In Groups
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
        {inGroups.map((group) => (
          <Card 
            key={group.id}
            sx={{ 
              cursor: 'pointer',
              '&:hover': {
                boxShadow: 6,
              },
            }}
            onClick={() => handleGroupClick(group)}
          >
            <CardContent>
              <Typography variant="h6" component="h2">
                {group.name}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                {group.description}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Create Group Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
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
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateGroup}
            variant="contained"
            color="primary"
            disabled={createGroupMutation.isPending}
          >
            {createGroupMutation.isPending ? <CircularProgress size={24} /> : 'Create Group'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Group Details Dialog */}
      <Dialog 
        open={!!selectedGroup} 
        onClose={() => {
          setSelectedGroup(null);
          setGroupMembers([]);
        }}
        maxWidth="sm"
        fullWidth
      >
        {selectedGroup && (
          <>
            <DialogTitle>{selectedGroup.name}</DialogTitle>
            <DialogContent>
              <Typography color="textSecondary" paragraph>
                {selectedGroup.description}
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Members
              </Typography>
              <List>
                {groupMembers.map((member) => {
                  const user = users?.find(u => u.id === member.user_id);
                  return (
                    <ListItem key={member.id}>
                      <ListItemText
                        primary={
                          <Typography variant="body1" color="text.primary">
                            {user?.username || 'Unknown User'}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {user?.email || 'No email'}
                          </Typography>
                        }
                      />
                      {selectedGroup.creator_id === Number(userId) && (
                        <ListItemSecondaryAction>
                          <IconButton
                            edge="end"
                            aria-label="remove"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <CloseIcon />
                          </IconButton>
                        </ListItemSecondaryAction>
                      )}
                    </ListItem>
                  );
                })}
              </List>

              {selectedGroup.creator_id === Number(userId) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Autocomplete
                      options={users?.filter(user => 
                        !groupMembers.some(member => member.user_id === user.id)
                      ) || []}
                      getOptionLabel={(option) => `${option.username} (${option.email})`}
                      value={selectedUser}
                      onChange={(_, newValue) => {
                        setSelectedUser(newValue);
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Add User"
                          size="small"
                          sx={{ minWidth: 300 }}
                        />
                      )}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      renderOption={(props, option) => (
                        <li {...props}>
                          <Box>
                            <Typography variant="body1">{option.username}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.email}
                            </Typography>
                          </Box>
                        </li>
                      )}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddMember}
                      disabled={addMemberMutation.isPending || !selectedUser}
                    >
                      Add Member
                    </Button>
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setSelectedGroup(null);
                setGroupMembers([]);
              }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default GroupsPage; 