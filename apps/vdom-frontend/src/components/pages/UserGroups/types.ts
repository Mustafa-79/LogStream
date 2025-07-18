// Core domain entities
export interface IUser {
  _id: string;
  username: string;
  email: string;
  active: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Helper function to generate initials from username
export const getUserInitials = (user: IUser): string => {
  return user.username.substring(0, 2).toUpperCase();
};

export interface IApplication {
  _id: string;
  name: string;
  description: string;
  threshold?: number;
  timePeriod?: number;
  active: boolean;
  deleted: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface IGroup {
  _id: string;
  name: string;
  description: string;
  active: boolean;
  deleted: boolean;
  members?: IUser[];
  applications?: IApplication[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Pagination interface
export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalGroups: number;
  groupsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form data interfaces
export interface CreateUserGroupFormData {
  name: string;
  description: string;
  active: boolean;
  selectedApplications: string[];
  selectedUsers: string[];
  selectedUserObjects?: IUser[];
  selectedApplicationObjects?: IApplication[];
}

// API payload interfaces
export interface CreateUserGroupPayload {
  name: string;
  description: string;
  active: boolean;
  memberIDs?: string[];
  applicationIDs?: string[];
}

// Form validation
export interface FormValidationErrors {
  name?: string;
  description?: string;
  applications?: string;
  users?: string;
}

// Track original form values for discard changes functionality
export interface OriginalFormValues {
  name: string;
  description: string;
  active: boolean;
  selectedApplications: string[];
  selectedUsers: string[];
}

// API payload interfaces
export interface CreateUserGroupPayload {
  name: string;
  description: string;
  active: boolean;
  memberIDs?: string[];
  applicationIDs?: string[];
}

// Form validation
export interface FormValidationErrors {
  name?: string;
  description?: string;
  applications?: string;
  users?: string;
}

// Track original form values for discard changes functionality
export interface OriginalFormValues {
  name: string;
  description: string;
  active: boolean;
  selectedApplications: string[];
  selectedUsers: string[];
}
