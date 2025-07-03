import { h } from 'preact';
import { useState } from 'preact/hooks';
import { IGroup, getUserInitials } from './types';
import "ojs/ojbutton";
import "ojs/ojcolorspectrum";
import "ojs/ojavatar";
import "ojs/ojinputtext";
import "ojs/ojlabel";
import "ojs/ojlabelvalue";
import "ojs/ojselectsingle";
import "ojs/ojformlayout";
import "ojs/ojdatetimepicker";
import "ojs/ojswitch";
import "ojs/ojradioset";
import "ojs/ojcheckboxset";
import "ojs/ojdialog";
import "ojs/ojlistview";
import "ojs/ojlistitemlayout";
import "ojs/ojactioncard";
import "ojs/ojtoolbar";

interface UserGroupCardProps {
  group: IGroup;
  onDelete?: (groupId: string) => Promise<void>;
  onEdit?: (group: IGroup) => void;
}

export function UserGroupCard({ group, onDelete, onEdit }: UserGroupCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleEditClick = () => {
    if (onEdit) {
      onEdit(group);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
    setDeleteError(null); // Clear any previous errors
  };

  const handleConfirmDelete = async () => {
    if (!onDelete) return;

    // Frontend validation before attempting delete
    if (!group._id) {
      setDeleteError('Invalid group: missing ID');
      return;
    }

    if (!group.name || group.name.trim() === '') {
      setDeleteError('Invalid group: missing name');
      return;
    }   
    
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await onDelete(group._id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting group:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Failed to delete user group';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      }

      // Provide user-friendly error messages for common scenarios
      if (errorMessage.includes('404')) {
        errorMessage = 'This group has already been deleted or does not exist.';
      } else if (errorMessage.includes('403')) {
        errorMessage = 'You do not have permission to delete this group.';
      } else if (errorMessage.includes('409')) {
        errorMessage = 'This group cannot be deleted because it has active dependencies.';
      } else if (errorMessage.includes('timeout')) {
        errorMessage = 'The request timed out. Please check your connection and try again.';
      } else if (errorMessage.includes('Unable to connect to server') || 
                 errorMessage.includes('Failed to fetch') || 
                 errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                 errorMessage.includes('Network error')) {
        errorMessage = 'Unable to connect to server. Please check your connection and try again.';
      }

      // Set error but don't close modal - let user try again or cancel
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDeleteError(null); // Clear error when canceling
  };

  return (
    <>
      <oj-action-card class="oj-sm-12 oj-sm-margin-4x-bottom">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-12 oj-sm-padding-4x-horizontal">
          <div class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between">
            <div class="oj-flex oj-sm-flex-items-center">
              <span
                class="oj-ux-ico-contact-group"
                style={{
                  fontSize: '2rem',
                  margin: '8px',
                }}
              ></span>
              <h2 class="oj-typography-heading-lg" style={{ margin: '8px' }} >
                {group.name}
              </h2>
            </div>

            <div>
              <oj-button 
                display='icons' 
                chroming='borderless'
                onojAction={handleEditClick}
              >
                <span slot='startIcon' class='oj-ux-ico-edit'></span>
              </oj-button>
              <oj-button
                display='icons'
                chroming='borderless'
                onojAction={handleDeleteClick}
                disabled={isDeleting}
              >
                <span slot='startIcon' class='oj-ux-ico-trash'></span>
              </oj-button>
            </div>
          </div>
          <p class="oj-typography-body-sm">{group.description}</p>

          <div class="oj-flex oj-sm-flex-items-center oj-sm-margin-1x-vertical ">
            <span class={`oj-badge ${group.active ? 'oj-badge-success' : 'oj-badge-danger'}`}>
              {group.active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div class="oj-flex oj-sm-flex-items-center">
            <h3 class="oj-typography-heading-xs oj-sm-margin-1x-vertical oj-sm-margin-0">Members ({group.members?.length || 0})</h3>
          </div>

          <div class="oj-flex oj-sm-flex-items-center ">
            {group.members?.map(member => (
              <oj-avatar size='sm' initials={getUserInitials(member)} class="oj-sm-margin-1x-end oj-sm-padding-1x" />
            ))}
          </div>
          <h3 class="oj-typography-heading-xs oj-sm-margin-1x-vertical oj-sm-margin-0">Application Access ({group.applications?.length || 0})</h3>
          <div class="oj-flex oj-sm-flex-wrap oj-sm-flex-items-center oj-sm-margin-1x-top oj-sm-margin-0" style={{ gap: '8px' }}>
            {group.applications?.map(app => (
              <span class="oj-badge oj-badge-info">{app.name}</span>
            ))}
          </div>

          <hr class="oj-sm-margin-2x-vertical" style={{ border: 'none', borderTop: '1px solid #e0e0e0', opacity: '0.5' }} />

          <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-2x-top">
            <p class="oj-typography-body-xs">Created: {new Date(group.createdAt || '').toLocaleDateString()}</p>
            <p class="oj-typography-body-xs">Last modified: {new Date(group.updatedAt || '').toLocaleDateString()}</p>
          </div>
        </div>
      </oj-action-card>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
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
            width: '400px',
            maxWidth: '90vw',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div class="oj-flex oj-sm-flex-direction-column oj-sm-padding-4x">
              <div class="oj-flex oj-sm-flex-items-center oj-sm-margin-2x-bottom">
                <span class="oj-ux-ico-warning-s" style={{ fontSize: '24px', color: '#ff6b35', marginRight: '12px' }}></span>
                <span class="oj-typography-heading-sm">Delete User Group</span>
              </div>
              <p class="oj-typography-body-md oj-sm-margin-2x-bottom">
                Are you sure you want to delete the user group <strong>"{group.name}"</strong>?
              </p>
              
              {/* Error Display */}
              {deleteError && (
                <div class="oj-flex oj-sm-flex-items-center oj-sm-margin-2x-bottom oj-sm-padding-2x" style={{
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '4px',
                  color: '#721c24'
                }}>
                  <span class="oj-ux-ico-error" style={{ fontSize: '16px', marginRight: '8px' }}></span>
                  <span class="oj-typography-body-sm">{deleteError}</span>
                </div>
              )}
              
              <div class="oj-flex oj-sm-justify-content-flex-end" style={{ gap: '8px' }}>
                <oj-button
                  chroming="outlined"
                  onojAction={handleCancelDelete}
                  disabled={isDeleting}
                >
                  Cancel
                </oj-button>
                <oj-button
                  chroming="danger"
                  onojAction={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </oj-button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
