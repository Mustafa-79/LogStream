import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { CreateUserGroupFormData, FormValidationErrors, IUser, IApplication, IGroup } from './types';
import { UserGroupsAPI, GoogleDirectoryUser } from '../../../services/userGroupService';
import { UserSelector } from './UserSelector';
import { ApplicationSelector } from './ApplicationSelector';
import { 
  getDefaultFormData, 
  initializeFormData, 
  validateForm, 
  isFormValid, 
  isAdministratorsGroup, 
  getModalConfig 
} from './FormUtils';
import "ojs/ojbutton";
import "ojs/ojinputtext";
import "ojs/ojformlayout";
import "ojs/ojlabel";
import "ojs/ojswitch";

export type UserGroupFormMode = 'create' | 'edit';

interface UserGroupFormModalProps {
  mode: UserGroupFormMode;
  isOpen: boolean;
  userGroup?: IGroup | null;
  onClose: () => void;
  onSubmit?: (formData: CreateUserGroupFormData, googleUsers?: GoogleDirectoryUser[], usersToRemove?: string[]) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function UserGroupFormModal({
  mode,
  isOpen,
  userGroup,
  onClose,
  onSubmit,
  loading = false,
  error = null,
}: UserGroupFormModalProps) {
  const [formData, setFormData] = useState<CreateUserGroupFormData>(getDefaultFormData());
  const [errors, setErrors] = useState<FormValidationErrors>({});
  const [users, setUsers] = useState<IUser[]>([]);
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentApplications, setCurrentApplications] = useState<IApplication[]>([]);
  const [selectedGoogleUsers, setSelectedGoogleUsers] = useState<GoogleDirectoryUser[]>([]);
  const [clearGoogleUsers, setClearGoogleUsers] = useState(false);
  const [usersToRemove, setUsersToRemove] = useState<string[]>([]);

  const isAdminGroup = isAdministratorsGroup(mode, userGroup);

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

  // Initialize form data based on mode
  useEffect(() => {
    if (isOpen) {
      setFormData(initializeFormData(mode, userGroup));
      if (mode === 'edit' && userGroup) {
        setCurrentApplications(userGroup.applications || []);
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, mode, userGroup]);

  // Reset form when modal closes
  const handleClose = () => {
    setFormData(getDefaultFormData());
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  // Validate form data
  const validateFormData = (): boolean => {
    const newErrors = validateForm(formData, selectedGoogleUsers, mode, usersToRemove);
    setErrors(newErrors);
    return isFormValid(newErrors);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateFormData()) {
      return;
    }

    setIsSubmitting(true);

    try {
      console.log(`${mode} form submitted with data:`, {
        ...(mode === 'edit' && { groupId: userGroup?._id }),
        ...formData,
        googleUsers: selectedGoogleUsers,
        usersToRemove: usersToRemove
      });

      if (onSubmit) {
        await onSubmit(formData, selectedGoogleUsers, usersToRemove);
      }

      // Clear the selected Google users and users to remove after successful processing
      if (selectedGoogleUsers.length > 0 || usersToRemove.length > 0) {
        setClearGoogleUsers(true);
        setTimeout(() => setClearGoogleUsers(false), 100);
      }

      // Only close modal if onSubmit completed successfully without throwing an error
      handleClose();
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} user group:`, error);
      // Don't close the modal on error - let parent handle error display
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes with real-time validation
  const handleNameChange = (event: any) => {
    const value = event.detail.value;
    setFormData(prev => ({ ...prev, name: value }));
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

  // Don't render if modal is not open, or if in edit mode but no userGroup provided
  if (!isOpen || (mode === 'edit' && !userGroup)) {
    return null;
  }

  // Modal configuration based on mode
  const config = getModalConfig(mode, loading, isSubmitting);

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
            <span class={config.icon} style={{ fontSize: '24px', marginRight: '12px', color: '#0572ce' }}></span>
            <span class="oj-typography-heading-md">{config.title}</span>
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
              <oj-label for={`${mode}GroupName`}>Group Name *</oj-label>
              <oj-input-text
                id={`${mode}GroupName`}
                value={formData.name}
                placeholder="Enter group name"
                onvalueChanged={handleNameChange}
                class={errors.name ? 'oj-invalid' : ''}
                aria-describedby={errors.name ? `${mode}GroupNameError` : undefined}
                disabled={isAdminGroup}
              />
              {errors.name && (
                <div id={`${mode}GroupNameError`} class="oj-text-color-danger oj-typography-body-xs oj-sm-margin-1x-top">
                  {errors.name}
                </div>
              )}
              {isAdminGroup && (
                <div class="oj-typography-body-xs oj-text-color-secondary oj-sm-margin-1x-top">
                  The administrators group name cannot be changed
                </div>
              )}
            </div>

            {/* Description Field */}
            <div>
              <oj-label for={`${mode}GroupDescription`}>Description *</oj-label>
              <oj-input-text
                id={`${mode}GroupDescription`}
                value={formData.description}
                placeholder="Enter group description (10-100 characters)"
                onrawValueChanged={handleDescriptionChange}
                class={errors.description ? 'oj-invalid' : ''}
                aria-describedby={errors.description ? `${mode}GroupDescriptionError` : undefined}
                disabled={isAdminGroup}
              />
              {errors.description && (
                <div id={`${mode}GroupDescriptionError`} class="oj-text-color-danger oj-typography-body-xs oj-sm-margin-1x-top">
                  {errors.description}
                </div>
              )}
              {/* Character count display */}
              <div class="oj-typography-body-xs oj-text-color-secondary oj-sm-margin-1x-top">
                {formData.description.length}/100 characters
              </div>
              {isAdminGroup && (
                <div class="oj-typography-body-xs oj-text-color-secondary oj-sm-margin-1x-top">
                  The administrators group description cannot be changed
                </div>
              )}
            </div>

            {/* Status Field */}
            <div>
              <oj-label for={`${mode}GroupStatus`}>Status</oj-label>
              <div class="oj-flex oj-sm-flex-items-center oj-sm-margin-2x-top" style={{ alignItems: 'center' }}>
                <oj-switch
                  id={`${mode}GroupStatus`}
                  value={formData.active}
                  onvalueChanged={mode === 'edit' ? handleStatusChange : undefined}
                  style={{ alignSelf: 'center' }}
                  disabled={mode === 'create' || isAdminGroup}
                />
                <span class="oj-typography-body-sm oj-sm-margin-2x-start oj-text-color-secondary" style={{ display: 'inline-flex', alignItems: 'center' }}>
                  {mode === 'create'
                    ? 'New groups are created as Active by default'
                    : (formData.active ? 'Active' : 'Inactive')
                  }
                </span>
              </div>
              {isAdminGroup && (
                <div class="oj-typography-body-xs oj-text-color-secondary oj-sm-margin-1x-top">
                  The administrators group status cannot be changed
                </div>
              )}
            </div>

            {/* Applications Selection */}
            <div>
              <oj-label>Applications</oj-label>
              <ApplicationSelector
                applications={applications}
                selectedApplications={formData.selectedApplications}
                onSelectionChange={handleApplicationsChange}
                error={errors.applications}
                disabled={isAdminGroup}
                currentApplications={currentApplications}
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
                mode={mode}
                groupId={mode === 'edit' ? userGroup?._id : undefined}
                onGoogleUsersChange={setSelectedGoogleUsers}
                clearGoogleUsers={clearGoogleUsers}
                onUsersToRemoveChange={setUsersToRemove}
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
              chroming={"outlined"}
              onojAction={handleSubmit}
              disabled={loading || isSubmitting}
            >
              {config.submitText}
            </oj-button>
          </div>
        </div>
      </div>
    </div>
  );
}
