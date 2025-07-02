import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { UserGroupsAPI } from '../../../services/userGroupService';
import { CreateUserGroupFormData, IGroup, CreateUserGroupPayload, IUser, IApplication } from './types';
import { UserGroupCard } from './UserGroupCard';
import { CreateUserGroupModal } from './CreateUserGroupModal';
import { EditUserGroupModal } from './EditUserGroupModal';
import "ojs/ojbutton";
import "oj-c/progress-circle";


export function UserGroups() {
  const [userGroups, setUserGroups] = useState<IGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletedGroup, setDeletedGroup] = useState<IGroup | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<IGroup | null>(null);
  const [createGroupLoading, setCreateGroupLoading] = useState(false);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Store users and applications for reference when creating groups
  const [availableUsers, setAvailableUsers] = useState<IUser[]>([]);
  const [availableApplications, setAvailableApplications] = useState<IApplication[]>([]);

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const backendResponse = await UserGroupsAPI.getUserGroups();
      console.log('Fetched user groups from API:', backendResponse);

      setUserGroups(backendResponse);
    } catch (err) {
      console.error('Error fetching user groups from API:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user groups');
    } finally {
      setLoading(false);
    }
  };

  // Load reference data (users and applications) for form usage
  const loadReferenceData = async () => {
    try {
      const [usersData, applicationsData] = await Promise.all([
        UserGroupsAPI.getUsers(),
        UserGroupsAPI.getApplications()
      ]);

      setAvailableUsers(usersData || []);
      setAvailableApplications(applicationsData || []);
      console.log('Loaded reference data:', { users: usersData?.length || 0, applications: applicationsData?.length || 0 });
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      // Find the group to be deleted
      const groupToDelete = userGroups.find(group => group._id === groupId);
      if (!groupToDelete) {
        throw new Error('Group not found');
      }

      // Call the API for soft delete FIRST (don't remove from UI until success)
      await UserGroupsAPI.deleteUserGroup(groupId);
      console.log(`User group ${groupId} deleted successfully`);

      // Only remove from UI after successful API call
      setUserGroups(prev => prev.filter(group => group._id !== groupId));

      // Store the deleted group for undo functionality
      setDeletedGroup(groupToDelete);

    } catch (error) {
      console.error('Error deleting user group:', error);
      
      // Create a user-friendly error message
      let errorMessage = 'Failed to delete user group';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Unable to connect to server. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'The request timed out. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      // Re-throw with user-friendly message to let the card component handle the error display
      throw new Error(errorMessage);
    }
  };

  const handleUndoDelete = async () => {
    if (deletedGroup) {
      try {
        // Call the API to restore the group
        await UserGroupsAPI.restoreUserGroup(deletedGroup._id);
        console.log(`User group "${deletedGroup.name}" restored from API`);

        // Restore the group to the list
        setUserGroups(prev => [...prev, deletedGroup].sort((a, b) => a.name.localeCompare(b.name)));

        // Clear the deleted group
        setDeletedGroup(null);
        console.log(`User group "${deletedGroup.name}" restored`);
      } catch (error) {
        console.error('Error restoring user group:', error);
      }
    }
  };

  const handleDismissUndo = () => {
    setDeletedGroup(null);
    console.log('Undo delete dismissed');
  };

  // Handle opening create modal
  const handleCreateGroup = async () => {
    // Load reference data before opening modal
    await loadReferenceData();
    setCreateGroupError(null); // Clear any previous errors
    setIsCreateModalOpen(true);
  };

  // Handle closing create modal
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateGroupError(null);
  };

  // Handle create group form submission
  const handleCreateGroupSubmit = async (formData: CreateUserGroupFormData) => {
    try {
      setCreateGroupLoading(true);
      setCreateGroupError(null);

      // Prepare the payload for the backend API
      const payload: CreateUserGroupPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        active: formData.active,
        members: formData.selectedUsers.length > 0 ? formData.selectedUsers : undefined,
        applications: formData.selectedApplications.length > 0 ? formData.selectedApplications : undefined,
      };

      console.log('Creating user group with payload:', payload);

      // Call the API to create the user group
      const createdGroup = await UserGroupsAPI.createUserGroup(payload);
      console.log('User group created successfully:', createdGroup);

      // Create an IGroup with the member and application objects for display
      const groupWithDetails: IGroup = {
        ...createdGroup,
        members: formData.selectedUsers.map(userId =>
          availableUsers.find(u => u._id === userId)
        ).filter((user): user is IUser => user !== undefined),
        applications: formData.selectedApplications.map(appId =>
          availableApplications.find(a => a._id === appId)
        ).filter((app): app is IApplication => app !== undefined)
      };

      setUserGroups(prev => [groupWithDetails, ...prev].sort((a, b) => a.name.localeCompare(b.name)));

      // Close the modal
      setIsCreateModalOpen(false);
      setCreateGroupError(null);

      // Show success message
      setSuccessMessage(`User group "${groupWithDetails.name}" was created successfully`);
      setTimeout(() => setSuccessMessage(null), 5000); // Clear after 5 seconds

      console.log(`User group "${groupWithDetails.name}" created and added to list`);

    } catch (error) {
      console.error('Error creating user group:', error);
      let errorMessage = 'Failed to create user group';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Unable to connect to server. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'The request timed out. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setCreateGroupError(errorMessage);

      // Re-throw the error so the modal stays open
      throw new Error(errorMessage);
    } finally {
      setCreateGroupLoading(false);
    }
  };

  // Handle opening edit modal
  const handleEditGroup = (group: IGroup) => {
    setSelectedGroupForEdit(group);
    setCreateGroupError(null); // Clear any previous errors
    setIsEditModalOpen(true);
  };

  // Handle closing edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedGroupForEdit(null);
    setCreateGroupError(null); // Clear any errors when closing
  };

  // Handle edit group form submission
  const handleEditGroupSubmit = async (formData: CreateUserGroupFormData) => {
    if (!selectedGroupForEdit) return;

    try {
      setCreateGroupLoading(true);
      setCreateGroupError(null);

      // Create payload for API
      const payload: CreateUserGroupPayload = {
        name: formData.name,
        description: formData.description,
        active: formData.active,
        members: formData.selectedUsers,
        applications: formData.selectedApplications
      };

      console.log('Updating user group with payload:', payload);

      // Call the API to update the user group
      const updatedGroup = await UserGroupsAPI.updateUserGroup(selectedGroupForEdit._id, payload);
      console.log('User group updated successfully:', updatedGroup);

      // Create an IGroup with the member and application objects for display
      const groupWithDetails: IGroup = {
        ...updatedGroup,
        members: formData.selectedUsers.map(userId =>
          availableUsers.find(u => u._id === userId)
        ).filter((user): user is IUser => user !== undefined),
        applications: formData.selectedApplications.map(appId =>
          availableApplications.find(a => a._id === appId)
        ).filter((app): app is IApplication => app !== undefined)
      };

      console.log('Group with details:', groupWithDetails);

      // Update the group in the list
      setUserGroups(prev =>
        prev.map(group =>
          group._id === selectedGroupForEdit._id ? groupWithDetails : group
        ).sort((a, b) => a.name.localeCompare(b.name))
      );

      // Close the modal
      setIsEditModalOpen(false);
      setSelectedGroupForEdit(null);

      // Show success message
      setSuccessMessage(`User group "${groupWithDetails.name}" was updated successfully`);
      setTimeout(() => setSuccessMessage(null), 5000); // Clear after 5 seconds

      console.log(`User group "${groupWithDetails.name}" updated successfully`);

    } catch (error) {
      console.error('Error updating user group:', error);
      let errorMessage = 'Failed to update user group';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
          errorMessage = 'Unable to connect to server. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'The request timed out. Please check your connection and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setCreateGroupError(errorMessage);
      
      // Re-throw the error so the modal stays open
      throw new Error(errorMessage);
    } finally {
      setCreateGroupLoading(false);
    }
  };

  useEffect(() => {
    fetchUserGroups();
    loadReferenceData(); // Load reference data when component mounts
  }, []);

  if (loading) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">Loading user groups...</div>
            <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <oj-c-progress-circle
              class="oj-sm-margin-4x-vertical oj-sm-padding-4x"
              aria-labelledby="lgLabel indetLabel"
              size="lg"
              value={-1}
            ></oj-c-progress-circle>
            </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom" style={{ color: 'var(--oj-core-color-danger)' }}>
            Error loading user groups
          </div>
          <p class="oj-typography-body-md oj-sm-margin-2x-bottom">{error}</p>
          <oj-button class="oj-button-primary" onojAction={fetchUserGroups}>
            Retry
          </oj-button>
        </div>
      </div>
    );
  }

  return (
    <div class="oj-sm-12">
      {/* Success Message */}
      {successMessage && (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-4x-bottom">
          <div class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-4x" style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724',
            minWidth: '400px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <div class="oj-flex oj-sm-flex-items-center" style={{ alignItems: 'center' }}>
              <span class="oj-ux-ico-checkmark-s oj-sm-margin-2x-end" style={{ fontSize: '18px', color: '#28a745' }}></span>
              <span class="oj-typography-body-md">{successMessage}</span>
            </div>
            <oj-button
              display="icons"
              chroming="borderless"
              onojAction={() => setSuccessMessage(null)}
              style={{ color: '#155724' }}
            >
              <span slot='startIcon' class='oj-ux-ico-close'></span>
            </oj-button>
          </div>
        </div>
      )}

      {/* Undo Delete Notification */}
      {deletedGroup && (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-4x-bottom">
          <div class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-4x" style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724',
            minWidth: '400px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <div class="oj-flex oj-sm-flex-items-center" style={{ alignItems: 'center' }}>
              <span class="oj-ux-ico-checkmark-s oj-sm-margin-2x-end" style={{ fontSize: '18px', color: '#28a745' }}></span>
              <span class="oj-typography-body-md">
                User group <strong>"{deletedGroup.name}"</strong> has been deleted.
              </span>
            </div>
            <div class="oj-flex oj-sm-flex-items-center" style={{ gap: '8px' }}>
              <oj-button
                chroming="outlined"
                onojAction={handleUndoDelete}
                style={{
                  borderColor: '#28a745',
                  color: '#28a745',
                  backgroundColor: 'transparent'
                }}
              >
                <span slot='startIcon' class='oj-ux-ico-undo'></span>
                Undo
              </oj-button>
              <oj-button
                display="icons"
                chroming="borderless"
                onojAction={handleDismissUndo}
                style={{ color: '#155724' }}
              >
                <span slot='startIcon' class='oj-ux-ico-close'></span>
              </oj-button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-4x-bottom">
        <div>
          <h1
            class="oj-typography-heading-xl oj-sm-margin-2x-bottom"
            style={{
              background: 'linear-gradient(to right, #8e2de2, #cbb4d4 80%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            User Groups
          </h1>
          <p class="oj-typography-body-md">Organize users into groups and manage their application access. All groups have full permissions.</p>
        </div>
        <div class="oj-flex oj-sm-flex-items-center oj-sm-flex-direction-column oj-sm-justify-content-center" style={{ minHeight: '120px' }}>
          <oj-button
            class="oj-button-primary"
            onojAction={handleCreateGroup}
          >
            <span slot='startIcon' class='oj-ux-ico-plus'></span>
            Create Group
          </oj-button>
        </div>
      </div>

      {/* User Group Cards */}
      {userGroups.length === 0 ? (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
          <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
            <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">No user groups found</div>
            <p class="oj-typography-body-md">Create your first user group to get started.</p>
          </div>
        </div>
      ) : (
        <div class="oj-flex oj-flex-row">
          {userGroups.map(group => (
            <UserGroupCard key={group._id} group={group} onDelete={handleDeleteGroup} onEdit={handleEditGroup} />
          ))}
        </div>
      )}

      {/* Create User Group Modal */}
      <CreateUserGroupModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateGroupSubmit}
        loading={createGroupLoading}
        error={createGroupError}
        existingGroups={userGroups}
      />

      {/* Edit User Group Modal */}
      {selectedGroupForEdit && (
        <EditUserGroupModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSubmit={handleEditGroupSubmit}
          userGroup={selectedGroupForEdit}
          loading={createGroupLoading}
          error={createGroupError}
          existingGroups={userGroups}
        />
      )}
    </div>
  );
}
