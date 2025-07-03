import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { IUser } from './types';

import 'ojs/ojcheckboxset';
import 'ojs/ojoption';
import 'ojs/ojinputsearch';

interface UserSelectorProps {
  users: IUser[];
  selectedUsers: string[];
  onSelectionChange: (selectedUsers: string[]) => void;
  error?: string;
}

export function UserSelector({ users, selectedUsers, onSelectionChange, error }: UserSelectorProps) {

  // const [searchText, setSearchText] = useState('');
  const [selectAllChecked, setSelectAllChecked] = useState(false);

  
  // Filter out inactive users and apply search filter
  const activeUsers = users.filter(user => user.active);
  
  // initially set filtered users to active users
  // const [filteredUsers, setFilteredUsers] = useState<IUser[]>(activeUsers);
  // console.log('Filtered Users:', filteredUsers);


    useEffect(() => {
    // Update select all state based on current selection
    setSelectAllChecked(selectedUsers.length === activeUsers.length && activeUsers.length > 0);
  }, [selectedUsers, activeUsers]);


  
  // const handleSearchChange = (event: any) => {
  //   setSearchText(event.detail.value || '');

  //   // Filter users based on search text
  //   const searchLower = event.detail.value.toLowerCase();
  //   const newFilteredUsers = activeUsers.filter(user => {
  //     return (
  //       user.username.toLowerCase().includes(searchLower) ||
  //       user.email.toLowerCase().includes(searchLower)
  //     );
  //   });
  //   setFilteredUsers(newFilteredUsers);
  //   // console.log('Filtered Users:', newFilteredUsers);
  // };

  const handleSelectAllToggle = () => {
    const isChecked = !selectAllChecked;
    setSelectAllChecked(isChecked);
    if (isChecked) {
      onSelectionChange(activeUsers.map(user => user._id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleUsersToggle = (newSelection: string[]) => {
    onSelectionChange(newSelection);
    // Update select all state based on new selection
    setSelectAllChecked(newSelection.length === activeUsers.length && activeUsers.length > 0);
  };

  return (
    <div class="user-selector">
      {/* Search Input
      <div class="oj-sm-margin-2x-bottom">
        <oj-input-search
          value={searchText}
          placeholder="Search users by username or email..."
          onrawValueChanged={handleSearchChange}
          class="oj-form-control-full-width"
        />
      </div> */}

      {/* Select All Option */}
      {activeUsers.length > 0 && (
        <div class="oj-flex oj-sm-flex-items-center oj-sm-margin-2x-bottom">
          <oj-checkboxset
            value={selectAllChecked ? ['selectAll'] : []}
            onvalueChanged={(event: any) => {
              const isChecked = event.detail.value.includes('selectAll');
              if (isChecked !== selectAllChecked) {
                handleSelectAllToggle();
              }
            }}
          >
            <oj-option value="selectAll">
              <span class="oj-typography-body-md" style={{ fontWeight: 'bold' }}>
                Select All Users ({activeUsers.length})
              </span>
            </oj-option>
          </oj-checkboxset>
        </div>
      )}

      {/* Users List */}
      {/* <div class="oj-panel oj-panel-alt1" style={{
        maxHeight: '250px',
        overflow: 'auto',
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '8px'
      }}>
        {filteredUsers.length === 0 ? (
          <div class="oj-typography-body-sm" style={{ color: '#666', textAlign: 'center', padding: '16px' }}>
            {searchText.trim() ? `No users found matching "${searchText}"` : 'No users available'}
          </div>
        ) : (
          <oj-checkboxset
            value={selectedUsers}
            onvalueChanged={handleUserSelectionChange}
            class="oj-sm-padding-2x"
          >
            {filteredUsers.map(user => (
              <oj-option key={user._id} value={user._id}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span class="oj-typography-body-md" style={{ fontWeight: '500' }}>
                    {user.username}
                  </span>
                  <span class="oj-typography-body-xs" style={{ color: '#666' }}>
                    {user.email}
                  </span>
                </div>
              </oj-option>
            ))}
          </oj-checkboxset>
        )}
      </div> */}

      <div class={`oj-panel oj-panel-alt1 ${error ? 'oj-invalid' : ''}`} style={{
        maxHeight: '200px',
        overflow: 'auto',
        border: error ? '1px solid #d32f2f' : '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '8px'
      }}>
        {activeUsers.length === 0 ? (
          <div class="oj-typography-body-sm" style={{ color: '#666', textAlign: 'center', padding: '16px' }}>
            No users available
          </div>
        ) : (
          <oj-checkboxset
            value={selectedUsers}
            onvalueChanged={(event: any) => handleUsersToggle(event.detail.value)}
            class="oj-sm-padding-2x"
          >
            {activeUsers.map(user => (
              <oj-option key={user._id} value={user._id}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span class="oj-typography-body-md" style={{ fontWeight: '500' }}>{user.username}</span>
                  <span class="oj-typography-body-xs" style={{ color: '#666' }}>{user.email}</span>
                </div>
              </oj-option>
            ))}
          </oj-checkboxset>
        )}
      </div>

      {/* Selection Summary */}
      {/* <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-2x-top">
        <span class="oj-typography-body-sm" style={{ color: '#666' }}>
          {selectedUsers.length} of {activeUsers.length} users selected
          {searchText.trim() && ` (${filteredUsers.length} shown)`}
        </span>
      </div> */}

      {/* Error Message */}
      {error && (
        <div class="oj-text-color-danger oj-typography-body-xs oj-sm-margin-1x-top">
          {error}
        </div>
      )}

      {/* Selection Summary */}
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-2x-top">
        <span class="oj-typography-body-sm" style={{ color: '#666' }}>
          {selectedUsers.length} of {activeUsers.length} users selected
        </span>
      </div>

      {/* Selected Users Summary */}
      {selectedUsers.length > 0 && (
        <div class="oj-sm-margin-2x-top">
          <div class="oj-typography-body-sm" style={{ color: '#666', marginBottom: '4px' }}>
            Selected Users:
          </div>
          <div class="oj-flex oj-sm-flex-wrap" style={{ gap: '4px' }}>
            {selectedUsers.map(userId => {
              const user = activeUsers.find(u => u._id === userId);
              return user ? (
                <span key={userId} class="oj-badge oj-badge-info oj-typography-body-xs">
                  {user.username}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>

  );
}