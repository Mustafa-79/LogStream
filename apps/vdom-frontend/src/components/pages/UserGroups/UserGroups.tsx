import { useState, useEffect } from 'preact/hooks';
import { UserGroupsAPI, GoogleDirectoryUser } from '../../../services/userGroupService';
import { CreateUserGroupFormData, IGroup, CreateUserGroupPayload, IUser, IApplication } from './types';
import { UserGroupCard } from './UserGroupCard';
import { CreateUserGroupModal } from './CreateUserGroupModal';
import { EditUserGroupModal } from './EditUserGroupModal';
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "ojs/ojbutton";
import "oj-c/progress-circle";
import "ojs/ojinputsearch";
import "oj-c/select-multiple";

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalGroups: number;
  groupsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}


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

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalGroups: 0,
    groupsPerPage: 4,
    hasNext: false,
    hasPrev: false
  });

  // Store users and applications for reference when creating groups
  const [availableUsers, setAvailableUsers] = useState<IUser[]>([]);
  const [availableApplications, setAvailableApplications] = useState<IApplication[]>([]);

  // Search state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  
  // Status filter state - default to both selected (equivalent to 'all')
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(new Set(['active', 'inactive']));
  
  // Application filter state - default to none selected (show all)
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set());
  
  // Data provider for status dropdown
  const [statusDataProvider] = useState(
    new ArrayDataProvider([
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ], { keyAttributes: 'value' })
  );
  
  // Data provider for application dropdown
  const [applicationDataProvider, setApplicationDataProvider] = useState(
    new ArrayDataProvider([], { keyAttributes: 'value' })
  );

  const fetchUserGroups = async (page: number = 1, search?: string, status?: 'active' | 'inactive' | 'all', applicationIds?: string[]) => {
    try {
      setLoading(true);
      setError(null);

      const backendResponse = await UserGroupsAPI.getUserGroups(page, search, status, applicationIds);
      console.log('Fetched user groups from API:', backendResponse);
      console.log('Response groups count:', backendResponse.groups?.length || 0);

      // Update userGroups with the groups array from the response
      setUserGroups(backendResponse.groups || []);
      
      // Update pagination state
      setPagination(backendResponse.pagination);
      
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
      
      // Update application data provider for the dropdown
      const applicationOptions = (applicationsData || []).map(app => ({
        value: app._id,
        label: app.name
      }));
      setApplicationDataProvider(new ArrayDataProvider(applicationOptions, { keyAttributes: 'value' }));
      
      console.log('Loaded reference data:', { users: usersData || 0, applications: applicationsData || 0 });
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  // Search handlers
  const handleSearchChange = async (event: any) => {
    const newSearchTerm = event.detail.value.trim();
    setSearchTerm(newSearchTerm);
    
    // Trigger search immediately
    setIsSearching(true);
    const statusValue = getStatusFilterValue();
    const applicationIds = Array.from(selectedApplications);
    console.log('Auto-search parameters:', { searchTerm: newSearchTerm, statusValue, applicationIds });
    await fetchUserGroups(1, newSearchTerm, statusValue, applicationIds.length > 0 ? applicationIds : undefined);
    setIsSearching(false);
  };

  const handleStatusFilterChange = (event: any) => {
    const selectedKeys = event.detail.value;
    if (selectedKeys instanceof Set) {
      setSelectedStatuses(selectedKeys);
    } else {
      // Handle array case
      const values = selectedKeys || [];
      const newSelectedStatuses = new Set(values as string[]);
      setSelectedStatuses(newSelectedStatuses);
    }
  };

  const handleApplicationFilterChange = (event: any) => {
    const selectedKeys = event.detail.value;
    if (selectedKeys instanceof Set) {
      setSelectedApplications(selectedKeys);
    } else {
      // Handle array case
      const values = selectedKeys || [];
      const newSelectedApplications = new Set(values as string[]);
      setSelectedApplications(newSelectedApplications);
    }
  };

  const getStatusFilterValue = (): 'active' | 'inactive' | 'all' => {
    if (selectedStatuses.size === 0) {
      return 'all'; // No selection means show all
    } else if (selectedStatuses.size === 2) {
      return 'all'; // Both selected means show all
    } else if (selectedStatuses.has('active')) {
      return 'active';
    } else if (selectedStatuses.has('inactive')) {
      return 'inactive';
    } else {
      return 'all';
    }
  };

  const handleSearchSubmit = async () => {
    setIsSearching(true);
    const statusValue = getStatusFilterValue();
    const applicationIds = Array.from(selectedApplications);
    console.log('Search parameters:', { searchTerm, statusValue, applicationIds });
    await fetchUserGroups(1, searchTerm, statusValue, applicationIds.length > 0 ? applicationIds : undefined); // Reset to first page when searching
    setIsSearching(false);
  };

  const clearSearch = async () => {
    setSearchTerm('');
    setSelectedStatuses(new Set(['active', 'inactive'])); // Reset to default (both selected)
    setSelectedApplications(new Set()); // Reset to default (none selected)
    await fetchUserGroups(1);
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

      // Store the deleted group for undo functionality
      setDeletedGroup(groupToDelete);

      // Refresh to first page to get updated data from backend with current search
      await fetchUserGroups(1, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined);

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

        // Clear the deleted group
        setDeletedGroup(null);

        // Refresh to first page to get updated data from backend with current search
        await fetchUserGroups(1, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined);
        
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
  const handleCreateGroupSubmit = async (formData: CreateUserGroupFormData, googleUsers?: GoogleDirectoryUser[]) => {
    try {
      setCreateGroupLoading(true);
      setCreateGroupError(null);

      // Prepare the payload for the backend API
      const payload: CreateUserGroupPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        active: formData.active,
        memberIDs: formData.selectedUsers.length > 0 ? formData.selectedUsers : undefined,
        applicationIDs: formData.selectedApplications.length > 0 ? formData.selectedApplications : undefined,
      };

      console.log('Creating user group with payload:', payload);

      // Call the API to create the user group
      const createdGroup = await UserGroupsAPI.createUserGroup(payload);
      console.log('User group created successfully:', createdGroup);

      // Process Google Directory users if any were selected
      if (googleUsers && googleUsers.length > 0) {
        console.log('Processing Google Directory users:', googleUsers);
        try {
          await UserGroupsAPI.processGoogleDirectoryUsers(googleUsers, createdGroup._id);
          console.log('Google Directory users processed successfully');
        } catch (error) {
          console.error('Error processing Google Directory users:', error);
        }
      }

      // Close the modal
      setIsCreateModalOpen(false);
      setCreateGroupError(null);

      // Show success message
      setSuccessMessage(`User group "${createdGroup.name}" was created successfully`);
      setTimeout(() => setSuccessMessage(null), 5000); // Clear after 5 seconds

      // Refresh to first page to get updated data from backend with current search
      await fetchUserGroups(1, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined);
      
      // Refresh available users to include any newly created ones
      await loadReferenceData();

      console.log(`User group "${createdGroup.name}" created and added to list`);

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
  const handleEditGroupSubmit = async (formData: CreateUserGroupFormData, googleUsers?: GoogleDirectoryUser[], usersToRemove?: string[]) => {
    if (!selectedGroupForEdit) return;

    try {
      setCreateGroupLoading(true);
      setCreateGroupError(null);

      // Create payload for API
      const payload: CreateUserGroupPayload = {
        name: formData.name,
        description: formData.description,
        active: formData.active,
        memberIDs: formData.selectedUsers,
        applicationIDs: formData.selectedApplications
      };

      console.log('Updating user group with payload:', payload);

      // Call the API to update the user group
      const updatedGroup = await UserGroupsAPI.updateUserGroup(selectedGroupForEdit._id, payload);
      console.log('User group updated successfully:', updatedGroup);

      // Process Google Directory users if any were selected
      if (googleUsers && googleUsers.length > 0) {
        console.log('Processing Google Directory users:', googleUsers);
        try {
          await UserGroupsAPI.processGoogleDirectoryUsers(googleUsers, updatedGroup._id);
          console.log('Google Directory users processed successfully');
        } catch (error) {
          console.error('Error processing Google Directory users:', error);
        }
      }

      // Remove users from group if any were marked for removal
      if (usersToRemove && usersToRemove.length > 0) {
        console.log('Removing users from group:', usersToRemove);
        for (const userId of usersToRemove) {
          try {
            await UserGroupsAPI.removeUserFromGroup(updatedGroup._id, userId);
            console.log(`User ${userId} removed from group successfully`);
          } catch (error) {
            console.error(`Error removing user ${userId} from group:`, error);
          }
        }
      }

      // Close the modal
      setIsEditModalOpen(false);
      setSelectedGroupForEdit(null);

      // Show success message
      setSuccessMessage(`User group "${updatedGroup.name}" was updated successfully`);
      setTimeout(() => setSuccessMessage(null), 5000); // Clear after 5 seconds

      // Refresh current page to get updated data from backend with current search
      await fetchUserGroups(pagination.currentPage, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined);
      
      // Also refresh available users to include any newly created ones
      await loadReferenceData();

      console.log(`User group "${updatedGroup.name}" updated successfully`);

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

  // Pagination handlers
  const handlePageChange = async (page: number) => {
    await fetchUserGroups(page, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined);
  };

  const handleFirstPage = async () => {
    await fetchUserGroups(1, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined);
  };

  const handlePrevPage = async () => {
    if (pagination.hasPrev) {
      await fetchUserGroups(pagination.currentPage - 1, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined);
    }
  };

  const handleNextPage = async () => {
    if (pagination.hasNext) {
      await fetchUserGroups(pagination.currentPage + 1, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined);
    }
  };

  const handleLastPage = async () => {
    await fetchUserGroups(pagination.totalPages, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined);
  };

  // Generate page numbers for pagination
  const getVisiblePageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const visiblePages: number[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
      }
    }
    
    return visiblePages;
  };

  useEffect(() => {
    fetchUserGroups();
    loadReferenceData(); // Load reference data when component mounts
  }, []);

  return (
    <div class="oj-web-applayout-page" style="padding: 40px;">
      {/* Success Message */}
      {successMessage && (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-1x-vertical">
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
        <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-1x-vertical">
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
      <div class="oj-flex oj-justify-content-space-between oj-align-items-start" style="margin-bottom: 24px;">
        <div style="flex: 1;">
          <h1 class="oj-typography-heading-lg" style="margin: 0;">
            User Groups
          </h1>
          <p class="oj-typography-body-md" style="color: #6b7280; margin-top: 4px;">
            Organize users into groups and manage their application access.
          </p>
        </div>
        <div style="flex-shrink: 0; margin-left: 16px;">
          <oj-button
            class="oj-button-primary"
            onojAction={handleCreateGroup}
            disabled={loading || isSearching}
          >
            <span slot='startIcon' class='oj-ux-ico-plus'></span>
            Create Group
          </oj-button>
        </div>
      </div>

      {/* Search Controls */}
      <div class="oj-panel oj-panel-shadow-sm" style="padding: 20px; margin-bottom: 20px; border-radius: 8px;">
        {/* Header and Action Buttons */}
        <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center" style="margin-bottom: 16px;">
          <h3 style="margin: 0; color: #374151; font-size: 1.125rem; font-weight: 600;">
            Filter User Groups
          </h3>
          <div class="oj-flex oj-sm-align-items-center">
            <oj-button
              class="oj-button-sm oj-button-outlined-chrome"
              onojAction={clearSearch}
              disabled={loading || isSearching}
            >
              <span slot="startIcon" class="oj-ux-ico-eraser"></span>
              Clear All
            </oj-button>

            <oj-button
              class="oj-button-sm oj-button-primary"
              onojAction={handleSearchSubmit}
              style="margin-left: 8px;"
              disabled={loading || isSearching}
            >
              <span slot="startIcon" class={isSearching ? "oj-ux-ico-clock" : "oj-ux-ico-filter"}></span>
              {isSearching ? "Searching..." : "Apply Filters"}
            </oj-button>
          </div>
        </div>

        <div class="oj-flex oj-flex-wrap oj-sm-align-items-stretch oj-sm-flex-direction-row">
          {/* Search Input */}
          <div class="oj-flex-item oj-sm-12 oj-md-6 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
            <oj-label for="search-input">
              Search by name
            </oj-label>
            <oj-input-search
              id="search-input"
              value={searchTerm}
              placeholder="Search user groups..."
              onvalueChanged={handleSearchChange}
              style="min-height: 40px;"
            ></oj-input-search>
          </div>

          {/* Status Filter */}
          <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
            <oj-label for="status-filter">
              Status
            </oj-label>
            <div class="oj-flex oj-sm-align-items-center">
              <oj-c-select-multiple
                id="status-filter"
                value={selectedStatuses}
                label-hint="Select status..."
                label-edge="inside"
                onvalueChanged={handleStatusFilterChange}
                data={statusDataProvider}
                item-text="label"
                style="flex: 1; margin-right: 8px; min-height: 40px;"
              ></oj-c-select-multiple>
            </div>
          </div>

          {/* Application Filter */}
          <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
            <oj-label for="application-filter">
              Applications
            </oj-label>
            <div class="oj-flex oj-sm-align-items-center">
              <oj-c-select-multiple
                id="application-filter"
                value={selectedApplications}
                label-hint="Select applications..."
                label-edge="inside"
                onvalueChanged={handleApplicationFilterChange}
                data={applicationDataProvider}
                item-text="label"
                style="flex: 1; margin-right: 8px; min-height: 40px;"
              ></oj-c-select-multiple>
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <div class="oj-typography-body-sm" style="color: #6b7280;">
            <strong>Active Filters:</strong>
            {searchTerm && (
              <span style="margin-left: 8px;">
                Search: "{searchTerm}"
              </span>
            )}
            {(selectedStatuses.size === 0 || selectedStatuses.size === 2) ? (
              <span style="margin-left: 8px;">
              Status: All
              </span>
            ) : (
              <span style="margin-left: 8px;">
              Status: {Array.from(selectedStatuses).join(', ')}
              </span>
            )}
            {selectedApplications.size > 0 && (
              <span style="margin-left: 8px;">
                Apps: {selectedApplications.size} selected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* User Group Cards */}
      {loading ? (
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
      ) : error ? (
        <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
          <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
            <div class="oj-typography-heading-md oj-sm-margin-2x-bottom" style={{ color: 'var(--oj-core-color-danger)' }}>
              Error loading user groups
            </div>
            <p class="oj-typography-body-md oj-sm-margin-2x-bottom">{error}</p>
            <oj-button class="oj-button-primary" onojAction={() => fetchUserGroups(1, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined)}>
              Retry
            </oj-button>
          </div>
        </div>
      ) : userGroups.length === 0 ? (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
          <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
            <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">No user groups found</div>
          </div>
        </div>
      ) : (
        <>
          <div class="oj-flex oj-flex-row">
            {userGroups.map(group => (
              <UserGroupCard key={group._id} group={group} onDelete={handleDeleteGroup} onEdit={handleEditGroup} />
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div style="padding: 20px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
              <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center">
                <div class="oj-typography-body-sm" style="color: #6b7280;">
                  Showing {((pagination.currentPage - 1) * pagination.groupsPerPage) + 1} to {Math.min(pagination.currentPage * pagination.groupsPerPage, pagination.totalGroups)} of {pagination.totalGroups} entries
                </div>
                
                <div class="oj-flex oj-sm-align-items-center" style="gap: 8px;">
                  <oj-button
                    class="oj-button-outlined-chrome"
                    disabled={!pagination.hasPrev}
                    onojAction={handleFirstPage}
                    style="min-width: auto; padding: 8px 12px;"
                  >
                    <span class="oj-typography-body-sm">First</span>
                  </oj-button>
                  
                  <oj-button
                    class="oj-button-outlined-chrome"
                    disabled={!pagination.hasPrev}
                    onojAction={handlePrevPage}
                    style="min-width: auto; padding: 8px 12px;"
                  >
                    <span class="oj-typography-body-sm">‹ Prev</span>
                  </oj-button>
                  
                  {getVisiblePageNumbers().map((pageNum) => (
                    <oj-button
                      key={pageNum}
                      class={pageNum === pagination.currentPage ? "oj-button-primary" : "oj-button-outlined-chrome"}
                      onojAction={() => handlePageChange(pageNum)}
                      style="min-width: 40px; padding: 8px 12px;"
                    >
                      <span class="oj-typography-body-sm">{pageNum}</span>
                    </oj-button>
                  ))}
                  
                  <oj-button
                    class="oj-button-outlined-chrome"
                    disabled={!pagination.hasNext}
                    onojAction={handleNextPage}
                    style="min-width: auto; padding: 8px 12px;"
                  >
                    <span class="oj-typography-body-sm">Next ›</span>
                  </oj-button>
                  
                  <oj-button
                    class="oj-button-outlined-chrome"
                    disabled={!pagination.hasNext}
                    onojAction={handleLastPage}
                    style="min-width: auto; padding: 8px 12px;"
                  >
                    <span class="oj-typography-body-sm">Last</span>
                  </oj-button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && userGroups.length > 0 && (
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 0.875rem; color: #6b7280;">
          <p style="margin: 0;">
            Page {pagination.currentPage} of {pagination.totalPages} • 
            Last updated: {new Date().toLocaleTimeString()}
          </p>
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



// TODOs:
// TODO: [Alerts] [Backend] Add JOI validations and error handling middleware
// TODO: [Refactor] Refactor entire code to be more modular and readable