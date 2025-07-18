import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import { IUser } from './types';
import { UserGroupsAPI, GoogleDirectoryUser } from '../../../services/userGroupService';

import 'ojs/ojinputsearch';
import 'ojs/ojlabel';
import 'ojs/ojbutton';

interface UserSelectorProps {
  readonly users: IUser[];
  readonly selectedUsers: string[];
  readonly onSelectionChange: (selectedUsers: string[]) => void;
  readonly error?: string;
  readonly mode?: 'create' | 'edit';
  readonly groupId?: string; // Add groupId prop for adding users to existing groups
  readonly onGoogleUsersChange?: (googleUsers: GoogleDirectoryUser[]) => void; // Callback for selected Google users
  readonly clearGoogleUsers?: boolean; // Flag to clear selected Google users
  readonly onUsersToRemoveChange?: (usersToRemove: string[]) => void; // Callback for users marked for removal
}

export function UserSelector({ users, selectedUsers, onSelectionChange, error, mode = 'edit', groupId, onGoogleUsersChange, clearGoogleUsers, onUsersToRemoveChange }: UserSelectorProps) {
  const [activeTab, setActiveTab] = useState(mode === 'create' ? 'adduser' : 'existing');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleDirectoryUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string>('');
  const [selectedGoogleUsers, setSelectedGoogleUsers] = useState<GoogleDirectoryUser[]>([]);
  const [usersToRemove, setUsersToRemove] = useState<string[]>([]); // Track users marked for removal
  const searchTimeoutRef = useRef<number>();
  
  // Filter out inactive users
  const activeUsers = users.filter(user => user.active);

  // Create a memoized set of existing member emails for efficient lookup
  const existingMemberEmails = useMemo(() => {
    const emailSet = new Set<string>();
    activeUsers.forEach(user => {
      if (selectedUsers.includes(user._id) && !usersToRemove.includes(user._id)) {
        emailSet.add(user.email);
      }
    });
    return emailSet;
  }, [activeUsers, selectedUsers, usersToRemove]);

  // Create a separate set for all members (including those marked for removal) to show "Already in group" status
  const allMemberEmails = useMemo(() => {
    const emailSet = new Set<string>();
    activeUsers.forEach(user => {
      if (selectedUsers.includes(user._id)) {
        emailSet.add(user.email);
      }
    });
    return emailSet;
  }, [activeUsers, selectedUsers]);

  // Debounced search function
  const performSearch = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    
    try {
      const results = await UserGroupsAPI.searchGoogleDirectory(query.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching Google Directory:', error);
      setSearchError('Failed to search directory. Please try again.');
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle search input change with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchText.trim().length >= 2) {
      searchTimeoutRef.current = window.setTimeout(() => {
        performSearch(searchText);
      }, 1000); // 1 second delay
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchText]);

  // Notify parent when selected Google users change
  useEffect(() => {
    if (onGoogleUsersChange) {
      onGoogleUsersChange(selectedGoogleUsers);
    }
  }, [selectedGoogleUsers, onGoogleUsersChange]);

  // Notify parent when users to remove changes
  useEffect(() => {
    if (onUsersToRemoveChange) {
      onUsersToRemoveChange(usersToRemove);
    }
  }, [usersToRemove, onUsersToRemoveChange]);

  const handleSearchChange = (event: any) => {
    setSearchText(event.detail.value ?? '');
  };

  const handleUserSelect = (user: GoogleDirectoryUser) => {
    // Check if user is already selected in current session
    const isAlreadySelected = selectedGoogleUsers.some(selectedUser => selectedUser.id === user.id);
    
    if (isAlreadySelected) {
      return; // Don't add if already selected
    }

    // Check if user is already a member of the group (including those marked for removal)
    const isAnyTimeMember = allMemberEmails.has(user.primaryEmail);

    if (isAnyTimeMember) {
      return; // Don't add if they are/were ever a member
    }

    // Add user to selected Google users
    setSelectedGoogleUsers([...selectedGoogleUsers, user]);
    
    // Clear search and hide results
    setSearchText('');
    setSearchResults([]);
  };

  const removeGoogleUser = (userId: string) => {
    setSelectedGoogleUsers(selectedGoogleUsers.filter(user => user.id !== userId));
  };

  // Handle removing a user from the selected users list
  const handleRemoveUser = (userId: string) => {
    // Don't remove from selected users - keep them in the original list
    // Just add to users marked for removal (for display purposes)
    if (!usersToRemove.includes(userId)) {
      setUsersToRemove([...usersToRemove, userId]);
    }
  };

  // Function to clear selected Google users (can be called from parent)
  const clearSelectedGoogleUsers = () => {
    setSelectedGoogleUsers([]);
  };

  // Clear selected Google users when parent requests it
  useEffect(() => {
    if (clearGoogleUsers) {
      clearSelectedGoogleUsers();
      setUsersToRemove([]); // Also clear users marked for removal
    }
  }, [clearGoogleUsers]);

  return (
    <div class="user-selector">
      {/* Tab Navigation - Only show for edit mode or when both tabs are needed */}
      {mode === 'edit' && (
        <div class="oj-flex oj-sm-margin-2x-bottom" style={{ borderBottom: '1px solid #e0e0e0' }}>
          <oj-button
            chroming={activeTab === 'existing' ? 'outlined' : 'borderless'}
            onojAction={() => setActiveTab('existing')}
            style={{ 
              marginRight: '8px', 
              borderBottomLeftRadius: '0', 
              borderBottomRightRadius: '0',
              backgroundColor: activeTab === 'existing' ? '#f8f9fa' : 'transparent',
              borderBottom: activeTab === 'existing' ? '2px solid #0572ce' : '2px solid transparent'
            }}
          >
            Existing Users
          </oj-button>
          <oj-button
            chroming={activeTab === 'adduser' ? 'outlined' : 'borderless'}
            onojAction={() => setActiveTab('adduser')}
            style={{ 
              borderBottomLeftRadius: '0', 
              borderBottomRightRadius: '0',
              backgroundColor: activeTab === 'adduser' ? '#f8f9fa' : 'transparent',
              borderBottom: activeTab === 'adduser' ? '2px solid #0572ce' : '2px solid transparent'
            }}
          >
            Add User
          </oj-button>
        </div>
      )}
      
      {/* Tab Content */}
      {activeTab === 'existing' && (
        <div>
          {/* Group Members List - Read-only with remove icons */}
          <div class={`oj-panel oj-panel-alt1 ${error ? 'oj-invalid' : ''}`} style={{
            maxHeight: '200px',
            overflow: 'auto',
            border: error ? '1px solid #d32f2f' : '1px solid #e0e0e0',
            borderRadius: '4px',
            padding: '8px'
          }}>
            {selectedUsers.filter(userId => !usersToRemove.includes(userId)).length === 0 ? (
              <div class="oj-typography-body-sm" style={{ color: '#666', textAlign: 'center', padding: '16px' }}>
                No users in this group
              </div>
            ) : (
              <div>
                {selectedUsers
                  .filter(userId => !usersToRemove.includes(userId)) // Don't show users marked for removal
                  .map(userId => {
                  const user = activeUsers.find(u => u._id === userId);
                  return user ? (
                    <div key={userId} class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-2x" style={{
                      borderBottom: '1px solid #f0f0f0',
                      marginBottom: '4px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span class="oj-typography-body-md" style={{ fontWeight: '500' }}>{user.username}</span>
                        <span class="oj-typography-body-xs" style={{ color: '#666' }}>{user.email}</span>
                      </div>
                      <oj-button
                        display="icons"
                        chroming="borderless"
                        style={{ color: '#d32f2f' }}
                        title="Remove user from group"
                        onojAction={() => handleRemoveUser(userId)} // Use the new handler
                      >
                        <span slot='startIcon' class='oj-ux-ico-close'></span>
                      </oj-button>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Group Members Summary */}
          <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-2x-top">
            <span class="oj-typography-body-sm" style={{ color: '#666' }}>
              {selectedUsers.filter(userId => !usersToRemove.includes(userId)).length} user{selectedUsers.filter(userId => !usersToRemove.includes(userId)).length !== 1 ? 's' : ''} in this group
            </span>
          </div>

          {/* Users to be removed section */}
          {usersToRemove.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div class="oj-typography-body-md" style={{ fontWeight: '500', marginBottom: '8px', color: '#d32f2f' }}>
                Users to be removed ({usersToRemove.length})
              </div>
              <div class="oj-panel oj-panel-alt1" style={{
                maxHeight: '150px',
                overflow: 'auto',
                border: '1px solid #ffcdd2',
                borderRadius: '4px',
                padding: '8px',
                backgroundColor: '#ffedf0'
              }}>
                {usersToRemove.map((userId) => {
                  const user = activeUsers.find(u => u._id === userId);
                  return user ? (
                    <div key={userId} class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-2x" style={{
                      borderBottom: '1px solid #ffcdd2',
                      marginBottom: '4px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span class="oj-typography-body-md" style={{ fontWeight: '500' }}>{user.username}</span>
                        <span class="oj-typography-body-xs" style={{ color: '#666' }}>{user.email}</span>
                      </div>
                      <oj-button
                        display="icons"
                        chroming="borderless"
                        style={{ color: '#4caf50' }}
                        title="Cancel removal"
                        onojAction={() => {
                          // Remove from usersToRemove (user is still in selectedUsers)
                          setUsersToRemove(usersToRemove.filter(id => id !== userId));
                        }}
                      >
                        <span slot='startIcon' class='oj-ux-ico-undo'></span>
                      </oj-button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'adduser' && (
        <div>
          <oj-input-search
            value={searchText}
            placeholder="Search users by username or email..."
            onrawValueChanged={handleSearchChange}
            class="oj-form-control-full-width"
            style={{ marginBottom: '8px' }}
          />
          
          {searchLoading && (
            <div class="oj-flex oj-sm-justify-content-center oj-sm-padding-2x">
              <span class="oj-typography-body-sm" style={{ color: '#666' }}>
                Searching directory...
              </span>
            </div>
          )}
          
          {searchError && (
            <div class="oj-text-color-danger oj-typography-body-sm oj-sm-padding-2x">
              {searchError}
            </div>
          )}
          
          {/* Search Results - directly below search input, not as dropdown */}
          {(searchResults.length > 0 && searchText.trim().length >= 2) && (
            <div class="search-results" style={{
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              marginBottom: '16px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {(() => {
                const availableUsers: GoogleDirectoryUser[] = [];
                const unavailableUsers: GoogleDirectoryUser[] = [];
                
                searchResults.forEach((user) => {
                  const isSelectedInSession = selectedGoogleUsers.some(selectedUser => selectedUser.id === user.id);
                  const isAlreadyMember = existingMemberEmails.has(user.primaryEmail);
                  const isAnyTimeMember = allMemberEmails.has(user.primaryEmail); // Check if they were ever a member
                  const isDisabled = isSelectedInSession || isAnyTimeMember; // Disable if selected or any time member
                  
                  if (isDisabled) {
                    unavailableUsers.push(user);
                  } else {
                    availableUsers.push(user);
                  }
                });

                return [...availableUsers, ...unavailableUsers].map((user) => {
                  const isSelectedInSession = selectedGoogleUsers.some(selectedUser => selectedUser.id === user.id);
                  const isAlreadyMember = existingMemberEmails.has(user.primaryEmail);
                  const isAnyTimeMember = allMemberEmails.has(user.primaryEmail); // Check if they were ever a member
                  const isDisabled = isSelectedInSession || isAnyTimeMember; // Disable if selected or any time member
                  
                  let statusText = '';
                  if (isSelectedInSession) {
                    statusText = '✓ Selected';
                  } else if (isAnyTimeMember) {
                    statusText = '✓ Already in group';
                  }
                  
                  return (
                    <button
                      key={user.id}
                      type="button"
                      class="search-result-item"
                      disabled={isDisabled}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderBottom: '1px solid #f0f0f0',
                        border: 'none',
                        backgroundColor: isDisabled ? '#e8f5e8' : 'white',
                        cursor: isDisabled ? 'default' : 'pointer',
                        transition: 'background-color 0.2s',
                        textAlign: 'left',
                        opacity: isDisabled ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (!isDisabled) {
                          (e.target as HTMLElement).style.backgroundColor = '#f5f5f5';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDisabled) {
                          (e.target as HTMLElement).style.backgroundColor = 'white';
                        }
                      }}
                      onFocus={(e) => {
                        if (!isDisabled) {
                          (e.target as HTMLElement).style.backgroundColor = '#f5f5f5';
                        }
                      }}
                      onBlur={(e) => {
                        if (!isDisabled) {
                          (e.target as HTMLElement).style.backgroundColor = 'white';
                        }
                      }}
                      onClick={() => !isDisabled && handleUserSelect(user)}
                      onKeyDown={(e) => {
                        if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handleUserSelect(user);
                        }
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span class="oj-typography-body-md" style={{ fontWeight: '500' }}>
                          {user.name.fullName}
                          {statusText && (
                            <span style={{ color: '#4caf50', marginLeft: '8px' }}>{statusText}</span>
                          )}
                        </span>
                        <span class="oj-typography-body-sm" style={{ color: '#666' }}>
                          {user.primaryEmail}
                        </span>
                        {user.suspended && (
                          <span class="oj-typography-body-xs" style={{ color: '#d32f2f' }}>
                            (Suspended)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          )}
          
          {(searchResults.length === 0 && searchText.trim().length >= 2 && !searchLoading) && (
            <div class="search-no-results" style={{
              backgroundColor: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              padding: '16px',
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              <span class="oj-typography-body-sm" style={{ color: '#666' }}>
                No users found matching "{searchText}"
              </span>
            </div>
          )}
          
          {/* Selected Google Users List - moved to bottom */}
          {selectedGoogleUsers.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div class="oj-typography-body-md" style={{ fontWeight: '500', marginBottom: '8px' }}>
                Selected Users ({selectedGoogleUsers.length})
              </div>
              <div class="oj-panel oj-panel-alt1" style={{
                maxHeight: '150px',
                overflow: 'auto',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                padding: '8px'
              }}>
                {selectedGoogleUsers.map((user) => (
                  <div key={user.id} class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-2x" style={{
                    borderBottom: '1px solid #f0f0f0',
                    marginBottom: '4px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span class="oj-typography-body-md" style={{ fontWeight: '500' }}>{user.name.fullName}</span>
                      <span class="oj-typography-body-xs" style={{ color: '#666' }}>{user.primaryEmail}</span>
                    </div>
                    <oj-button
                      display="icons"
                      chroming="borderless"
                      style={{ color: '#d32f2f' }}
                      title="Remove user from selection"
                      onojAction={() => removeGoogleUser(user.id)}
                    >
                      <span slot='startIcon' class='oj-ux-ico-close'></span>
                    </oj-button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div class="oj-text-color-danger oj-typography-body-xs oj-sm-margin-1x-top">
          {error}
        </div>
      )}
    </div>
  );
}