import { h } from 'preact';
import { CreateUserGroupFormData, IGroup } from './types';
import { GoogleDirectoryUser } from '../../../services/userGroupService';
import { UserGroupFormModal } from './UserGroupFormModal';

interface EditUserGroupModalProps {
  isOpen: boolean;
  userGroup?: IGroup | null;
  onClose: () => void;
  onSubmit?: (formData: CreateUserGroupFormData, googleUsers?: GoogleDirectoryUser[], usersToRemove?: string[]) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  existingGroups?: IGroup[];
}

export function EditUserGroupModal({ 
  isOpen, 
  userGroup, 
  onClose, 
  onSubmit, 
  loading = false, 
  error = null, 
  existingGroups = [] 
}: EditUserGroupModalProps) {
  return (
    <UserGroupFormModal
      mode="edit"
      isOpen={isOpen}
      userGroup={userGroup}
      onClose={onClose}
      onSubmit={onSubmit}
      loading={loading}
      error={error}
    />
  );
}
