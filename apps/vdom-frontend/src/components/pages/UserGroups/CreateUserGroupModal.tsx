import { h } from 'preact';
import { CreateUserGroupFormData, IGroup } from './types';
import { GoogleDirectoryUser } from '../../../services/userGroupService';
import { UserGroupFormModal } from './UserGroupFormModal';

interface CreateUserGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (formData: CreateUserGroupFormData, googleUsers?: GoogleDirectoryUser[], usersToRemove?: string[]) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  existingGroups?: IGroup[];
}

export function CreateUserGroupModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false, 
  error = null, 
  existingGroups = [] 
}: CreateUserGroupModalProps) {
  return (
    <UserGroupFormModal
      mode="create"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      loading={loading}
      error={error}
    />
  );
}
