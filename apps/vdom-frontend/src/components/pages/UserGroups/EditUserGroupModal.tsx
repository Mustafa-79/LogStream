import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CreateUserGroupFormData, FormValidationErrors, IUser, IApplication, IGroup } from './types';
import { UserGroupsAPI } from '../../../services/userGroupService';
import { UserSelector } from './UserSelector';
import { ApplicationSelector } from './ApplicationSelector';
import "ojs/ojbutton";
import "ojs/ojinputtext";
import "ojs/ojformlayout";
import "ojs/ojlabel";
import "ojs/ojswitch";

interface EditUserGroupModalProps {
  isOpen: boolean;
  userGroup?: IGroup | null;
  onClose: () => void;
  onSubmit?: (formData: CreateUserGroupFormData) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  existingGroups?: IGroup[]; // Add this to check for name uniqueness
}

export function EditUserGroupModal({ isOpen, userGroup, onClose, onSubmit, loading = false, error = null, existingGroups = [] }: EditUserGroupModalProps) {
  const [formData, setFormData] = useState<CreateUserGroupFormData>({
    name: '',
    description: '',
    active: true,
    selectedApplications: [],
    selectedUsers: [],
  });

  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<IUser[]>([]);
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Load users and applications when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const [usersData, applicationsData] = await Promise.all([
        UserGroupsAPI.getUsers(),
        UserGroupsAPI.getApplications()
      ]);
      setUsers(usersData);
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error loading data:', error);
      // Set empty arrays as fallback
      setUsers([]);
      setApplications([]);
    } finally {
      setLoadingData(false);
    }
  };

  // Pre-fill form data when userGroup changes or modal opens
  useEffect(() => {
    if (isOpen && userGroup) {
      setFormData({
        name: userGroup.name || '',
        description: userGroup.description || '',
        active: userGroup.active,
        selectedApplications: userGroup.applications?.map(app => app._id) || [],
        selectedUsers: userGroup.members?.map(user => user._id) || [],
        selectedUserObjects: userGroup.members || [],
        selectedApplicationObjects: userGroup.applications || []
      });
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, userGroup]);

  // Reset form when modal closes
  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      active: true,
      selectedApplications: [],
      selectedUsers: [],
      selectedUserObjects: [],
      selectedApplicationObjects: []
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormValidationErrors = {};

    // Required name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Group name must be at least 3 characters long';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Group name must be less than 50 characters';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.name.trim())) {
      newErrors.name = 'Group name can only contain letters, numbers, spaces, hyphens, and underscores';
    } else {
      // Check for name uniqueness (case-insensitive), excluding current group
      const trimmedName = formData.name.trim().toLowerCase();
      const isDuplicate = existingGroups.some(group => 
        group.name.toLowerCase() === trimmedName && group._id !== userGroup?._id
      );
      if (isDuplicate) {
        newErrors.name = 'A group with this name already exists';
      }
    }

    // Description validation (if provided)
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Applications validation
    if (formData.selectedApplications.length === 0) {
      newErrors.applications = 'At least one application must be selected';
    }

    // Users validation
    if (formData.selectedUsers.length === 0) {
      newErrors.users = 'At least one user must be selected';
    }
    

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Edit form submitted with data:', {
        groupId: userGroup?._id,
        ...formData
      });
      
      if (onSubmit) {
        await onSubmit(formData);
      }
      
      // Only close modal if onSubmit completed successfully without throwing an error
      // If we reach this point, it means onSubmit didn't throw an error
      handleClose();
    } catch (error) {
      console.error('Error updating user group:', error);
      // Don't close the modal on error - let parent handle error display
      // The error will be shown in the error banner above the buttons
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes with real-time validation
  const handleNameChange = (event: any) => {
    const value = event.detail.value;
    setFormData(prev => ({ ...prev, name: value }));
    
    // Real-time validation for immediate feedback
    if (value.trim() && errors.name) {
      const newErrors = { ...errors };
      
      // Check basic validation first
      if (value.trim().length >= 3 && value.trim().length <= 50 && /^[a-zA-Z0-9\s\-_]+$/.test(value.trim())) {
        // Check for name uniqueness (case-insensitive), excluding current group
        const trimmedName = value.trim().toLowerCase();
        const isDuplicate = existingGroups.some(group => 
          group.name.toLowerCase() === trimmedName && group._id !== userGroup?._id
        );
        
        if (!isDuplicate) {
          delete newErrors.name;
          setErrors(newErrors);
        } else {
          newErrors.name = 'A group with this name already exists';
          setErrors(newErrors);
        }
      }
    }
  };

  const handleDescriptionChange = (event: any) => {
    const value = event.detail.value;
    setFormData(prev => ({ ...prev, description: value }));
    
    // Clear description error when user starts typing
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  const handleStatusChange = (event: any) => {
    const value = event.detail.value;
    setFormData(prev => ({ ...prev, active: value }));
  };

  const handleApplicationsChange = (selectedApps: string[]) => {
    const selectedAppObjects = selectedApps.map(appId => 
      applications.find(app => app._id === appId)
    ).filter((app): app is IApplication => app !== undefined);
    
    setFormData(prev => ({ 
      ...prev, 
      selectedApplications: selectedApps,
      selectedApplicationObjects: selectedAppObjects
    }));
    
    // Clear applications error when user makes selection
    if (errors.applications) {
      setErrors(prev => ({ ...prev, applications: undefined }));
    }
  };

  const handleUsersChange = (selectedUsers: string[]) => {
    const selectedUserObjects = selectedUsers.map(userId => 
      users.find(user => user._id === userId)
    ).filter((user): user is IUser => user !== undefined);
    
    setFormData(prev => ({ 
      ...prev, 
      selectedUsers: selectedUsers,
      selectedUserObjects: selectedUserObjects
    }));
    
    // Clear users error when user makes selection
    if (errors.users) {
      setErrors(prev => ({ ...prev, users: undefined }));
    }
  };

  if (!isOpen || !userGroup) {
    return null;
  }

  return (
    <div class="oj-overlay-backdrop" style={{
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000'
    }}>
      <div class="oj-panel oj-panel-alt1" style={{
        width: '700px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Modal Header */}
        <div class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-4x" style={{
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}>
          <div class="oj-flex oj-sm-flex-items-center">
            <span class="oj-ux-ico-edit" style={{ fontSize: '24px', marginRight: '12px', color: '#0572ce' }}></span>
            <span class="oj-typography-heading-md">Edit User Group</span>
          </div>
          <oj-button
            display='icons'
            chroming='borderless'
            onojAction={handleClose}
          >
            <span slot='startIcon' class='oj-ux-ico-close'></span>
          </oj-button>
        </div>

        {/* Modal Body */}
        <div class="oj-sm-padding-4x" style={{ 
          overflow: 'auto',
          flex: '1'
        }}>
          <oj-form-layout class='oj-formlayout-full-width'>
            {/* Group Name Field */}
            <div>
              <oj-label for="editGroupName">Group Name *</oj-label>
              <oj-input-text
                id="editGroupName"
                value={formData.name}
                placeholder="Enter group name"
                onvalueChanged={handleNameChange}
                class={errors.name ? 'oj-invalid' : ''}
                aria-describedby={errors.name ? 'editGroupNameError' : undefined}
              />
              {errors.name && (
                <div id="editGroupNameError" class="oj-text-color-danger oj-typography-body-xs oj-sm-margin-1x-top">
                  {errors.name}
                </div>
              )}
            </div>

            {/* Description Field */}
            <div>
              <oj-label for="editGroupDescription">Description</oj-label>
              <oj-input-text
                id="editGroupDescription"
                value={formData.description}
                placeholder="Enter group description (optional)"
                onvalueChanged={handleDescriptionChange}
                class={errors.description ? 'oj-invalid' : ''}
                aria-describedby={errors.description ? 'editGroupDescriptionError' : undefined}
              />
              {errors.description && (
                <div id="editGroupDescriptionError" class="oj-text-color-danger oj-typography-body-xs oj-sm-margin-1x-top">
                  {errors.description}
                </div>
              )}
              {/* Character count display */}
              <div class="oj-typography-body-xs oj-text-color-secondary oj-sm-margin-1x-top">
                {formData.description.length}/500 characters
              </div>
            </div>

            {/* Status Field */}
            <div>
              <oj-label for="groupStatus">Status</oj-label>
              <div class="oj-flex oj-sm-flex-items-center oj-sm-margin-2x-top" style={{ alignItems: 'center' }}>
                <oj-switch
                  id="groupStatus"
                  value={formData.active}
                  disabled={true}
                  style={{ alignSelf: 'center' }}
                />
                <span class="oj-typography-body-sm oj-sm-margin-2x-start oj-text-color-secondary" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  New groups are created as Active by default
                </span>
              </div>
            </div>

            {/* Applications Selection */}
            <div>
              <oj-label>Applications</oj-label>
              <ApplicationSelector
                applications={applications}
                selectedApplications={formData.selectedApplications}
                onSelectionChange={handleApplicationsChange}
                error={errors.applications}
              />
            </div>

            {/* Users Selection */}
            <div>
              <oj-label>Users</oj-label>
              <UserSelector
                users={users}
                selectedUsers={formData.selectedUsers}
                onSelectionChange={handleUsersChange}
                error={errors.users}
              />
            </div>
          </oj-form-layout>
        </div>

        {/* Modal Footer */}
        <div style={{
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}>
          {/* Error Display */}
          {error && (
            <div class="oj-flex oj-sm-flex-items-center oj-sm-padding-4x-horizontal oj-sm-padding-2x-top" style={{
              backgroundColor: '#f8d7da',
              borderBottom: '1px solid #f5c6cb',
              color: '#721c24'
            }}>
              <span class="oj-ux-ico-error" style={{ fontSize: '16px', marginRight: '8px' }}></span>
              <span class="oj-typography-body-sm">{error}</span>
            </div>
          )}

          <div class="oj-flex oj-sm-justify-content-flex-end oj-sm-padding-4x" style={{
            gap: '12px'
          }}>
            <oj-button
              chroming="outlined"
              onojAction={handleClose}
              disabled={loading || isSubmitting}
            >
              Cancel
            </oj-button>
            <oj-button
              chroming={formData.name.trim() ? "solid" : "outlined"}
              onojAction={handleSubmit}
              disabled={loading || isSubmitting}
            >
              {loading || isSubmitting ? 'Updating...' : 'Update Group'}
            </oj-button>
          </div>
        </div>
      </div>
    </div>
  );
}
