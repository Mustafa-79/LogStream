import { h } from 'preact';
import { CreateUserGroupFormData, IGroup } from './types';
import { UserGroupFormModal } from './UserGroupFormModal';

interface EditUserGroupModalProps {
  isOpen: boolean;
  userGroup?: IGroup | null;
  onClose: () => void;
  onSubmit?: (formData: CreateUserGroupFormData) => void | Promise<void>;
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
      existingGroups={existingGroups}
    />
  );
}
