import { CreateUserGroupFormData, FormValidationErrors, IGroup } from './types';
import { GoogleDirectoryUser } from '../../../services/userGroupService';
import type { UserGroupFormMode } from './UserGroupFormModal';

// Constants
export const CHARACTER_VALIDATION_REGEX = /^[a-zA-Z0-9\s\-_.,:;\[\]\(\)'""]+$/;
export const ALLOWED_CHARACTERS_MESSAGE = 'Allowed: letters, numbers, spaces, hyphens (-), underscores (_), periods (.), commas (,), colons (:), semicolons (;), parentheses (), brackets [], apostrophes (\'), and quotation marks (").';

// Default form data
export const getDefaultFormData = (): CreateUserGroupFormData => ({
  name: '',
  description: '',
  active: true,
  selectedApplications: [],
  selectedUsers: [],
  selectedUserObjects: [],
  selectedApplicationObjects: []
});

// Initialize form data based on mode and userGroup
export const initializeFormData = (mode: UserGroupFormMode, userGroup?: IGroup | null): CreateUserGroupFormData => {
  if (mode === 'edit' && userGroup) {
    return {
      name: userGroup.name || '',
      description: userGroup.description || '',
      active: userGroup.active,
      selectedApplications: userGroup.applications?.map(app => app._id) || [],
      selectedUsers: userGroup.members?.map(user => user._id) || [],
      selectedUserObjects: userGroup.members || [],
      selectedApplicationObjects: userGroup.applications || []
    };
  }
  return getDefaultFormData();
};

// Validation functions
export const validateGroupName = (name: string): string | undefined => {
  if (!name.trim()) {
    return 'Group name is required';
  }
  if (name.trim().length < 5) {
    return 'Group name must be at least 5 characters long';
  }
  if (name.trim().length > 20) {
    return 'Group name must be less than 20 characters';
  }
  if (!CHARACTER_VALIDATION_REGEX.test(name.trim())) {
    return `Group name contains invalid characters. ${ALLOWED_CHARACTERS_MESSAGE}`;
  }
  return undefined;
};

export const validateDescription = (description: string): string | undefined => {
  if (!description.trim()) {
    return 'Description is required';
  }
  if (description.length < 10) {
    return 'Description must be at least 10 characters';
  }
  if (description.length > 100) {
    return 'Description must be less than 100 characters';
  }
  if (!CHARACTER_VALIDATION_REGEX.test(description)) {
    return `Description contains invalid characters. ${ALLOWED_CHARACTERS_MESSAGE}`;
  }
  return undefined;
};

export const validateApplications = (selectedApplications: string[], mode: UserGroupFormMode): string | undefined => {
  if (selectedApplications.length === 0) {
    return mode === 'create'
      ? 'Please select at least one application'
      : 'At least one application must be selected';
  }
  return undefined;
};

export const validateUsers = (
  selectedUsers: string[], 
  selectedGoogleUsers: GoogleDirectoryUser[], 
  mode: UserGroupFormMode,
  usersToRemove?: string[]
): string | undefined => {

  // Calculate effective user count (existing users + new Google users - users to remove)
  const effectiveUserCount = selectedUsers.length + selectedGoogleUsers.length - (usersToRemove ? usersToRemove.length : 0);
  
  if (effectiveUserCount === 0) {
    return mode === 'create'
      ? 'Please select at least one user'
      : 'At least one user must be selected';
  }
  return undefined;
};

// Main validation function
export const validateForm = (
  formData: CreateUserGroupFormData,
  selectedGoogleUsers: GoogleDirectoryUser[],
  mode: UserGroupFormMode,
  usersToRemove?: string[]
): FormValidationErrors => {
  const errors: FormValidationErrors = {};

  const nameError = validateGroupName(formData.name);
  if (nameError) errors.name = nameError;

  const descriptionError = validateDescription(formData.description);
  if (descriptionError) errors.description = descriptionError;

  const applicationsError = validateApplications(formData.selectedApplications, mode);
  if (applicationsError) errors.applications = applicationsError;

  const usersError = validateUsers(formData.selectedUsers, selectedGoogleUsers, mode, usersToRemove);
  if (usersError) errors.users = usersError;

  return errors;
};

// Check if form validation passes
export const isFormValid = (errors: FormValidationErrors): boolean => {
  return Object.keys(errors).length === 0;
};

// Check if user group is administrators group
export const isAdministratorsGroup = (mode: UserGroupFormMode, userGroup?: IGroup | null): boolean => {
  return mode === 'edit' && (
    userGroup?.name?.toLowerCase() === 'administrators' ||
    userGroup?.name?.toLowerCase() === 'admins'
  );
};

// Modal configuration
export const getModalConfig = (mode: UserGroupFormMode, loading: boolean, isSubmitting: boolean) => {
  const configs = {
    create: {
      title: 'Create New User Group',
      icon: 'oj-ux-ico-contact-group',
      submitText: loading || isSubmitting ? 'Creating...' : 'Create Group'
    },
    edit: {
      title: 'Edit User Group',
      icon: 'oj-ux-ico-edit',
      submitText: loading || isSubmitting ? 'Updating...' : 'Update Group'
    }
  };
  return configs[mode];
};
