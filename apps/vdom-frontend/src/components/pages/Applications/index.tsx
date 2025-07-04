import { h } from "preact";
import { useState } from "preact/hooks";
import { useApplications, useCreateApplication, useUpdateApplication, useDeleteApplication } from "../../../hooks/useApplications";
import { getLastLogTime, getStatusBadge, Log, validateApplicationForm } from "../../../utils/applicationUtils";
import { ApplicationModal } from "./ApplicationModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import "oj-c/button";
import "ojs/ojbutton";
import "oj-c/progress-circle";

export type ApplicationsProps = {
  logs: Log[];
  logCounts: Record<string, { logsToday: number; errors: number }>;
};

export function Applications({ logs, logCounts }: ApplicationsProps) {
  const { applications, setApplications, loading } = useApplications();
  const { createApplication, isCreating } = useCreateApplication();
  const { updateApplication, isUpdating } = useUpdateApplication();
  const { deleteApplication, isDeleting } = useDeleteApplication();

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState<string>('');
  const [newAppDescription, setNewAppDescription] = useState<string>('');
  const [newAppActive, setNewAppActive] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletedApplication, setDeletedApplication] = useState<{ name: string } | null>(null);

  const handleAddApplication = () => {
    setShowModal(true);
    setNewAppName('');
    setNewAppDescription('');
    setNewAppActive(true); 
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewAppName('');
    setNewAppDescription('');
    setNewAppActive(true);
    setEditingAppId(null);
    setIsEditing(false);
    setFormError(null);
    setNameError(null);
    setDescriptionError(null);
  };

  const handleSaveApplication = async () => {
    setNameError(null);
    setDescriptionError(null);
    setFormError(null);

    const { isValid, errors } = validateApplicationForm(newAppName, newAppDescription);
    
    setNameError(errors.name || null);
    setDescriptionError(errors.description || null);

    if (!isValid) return;

    try {
      if (isEditing && editingAppId) {
        const updatedApp = await updateApplication(editingAppId, {
          name: newAppName.trim(),
          description: newAppDescription.trim(),
          active: newAppActive, 
        });

        setApplications(prev =>
          prev.map(app => (app._id === editingAppId ? { ...app, ...updatedApp } : app))
        );
        
        setSuccessMessage(`Application "${newAppName.trim()}" has been updated successfully.`);
      } else {
        const newApp = await createApplication({
          name: newAppName.trim(),
          description: newAppDescription.trim(),
        });

        setApplications(prev => [...prev, newApp]);
        
        setSuccessMessage(`Application "${newAppName.trim()}" has been created successfully.`);
      }

      handleCloseModal();
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Failed to save application. Please try again.';
      setFormError(message);
    }
  };

  const handleApplicationSettings = (appId: string) => {
    const app = applications.find(app => app._id === appId);
    if (!app) return;

    setEditingAppId(appId);
    setNewAppName(app.name);
    setNewAppDescription(app.description);
    setNewAppActive(app.active ?? true); 
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDeleteApplication = (appId: string) => {
    setDeletingAppId(appId);
    setShowDeleteConfirm(true);
  };

  const handleCloseDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletingAppId(null);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingAppId) return;
    setDeleteError(null);

    try {
      const appToDelete = applications.find(app => app._id === deletingAppId);
      
      await deleteApplication(deletingAppId);
      
      setApplications(prev => prev.filter(app => app._id !== deletingAppId));
      
      if (appToDelete) {
        setDeletedApplication({ name: appToDelete.name });
      }
      
      handleCloseDeleteConfirm();
    } catch (error) {
      const message = (error as Error)?.message || 'Failed to delete application. Please try again.';
      setDeleteError(message);
    }
  };

  const isProcessing = isCreating || isUpdating || isDeleting;

  if (loading) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">Loading Applications...</div>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <oj-c-progress-circle
              class="oj-sm-margin-4x-vertical oj-sm-padding-4x"
              aria-labelledby="lgLabel indetLabel"
              size="lg"
              value={-1}
            ></oj-c-progress-circle>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="oj-web-applayout-page" style="padding: 40px; padding-top: 20px;">
      {/* Success Message */}
      {successMessage && (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-1x-vertical">
          <div class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-4x" style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724',
            minWidth: '400px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <div class="oj-flex oj-sm-flex-items-center" style={{ alignItems: 'center' }}>
              <span class="oj-ux-ico-checkmark-s oj-sm-margin-2x-end" style={{ fontSize: '18px', color: '#28a745' }}></span>
              <span class="oj-typography-body-md">{successMessage}</span>
            </div>
            <oj-button
              display="icons"
              chroming="borderless"
              onojAction={() => setSuccessMessage(null)}
              style={{ color: '#155724' }}
            >
              <span slot='startIcon' class='oj-ux-ico-close'></span>
            </oj-button>
          </div>
        </div>
      )}

      {/* Delete Notification */}
      {deletedApplication && (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-1x-vertical">
          <div class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-4x" style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724',
            minWidth: '400px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <div class="oj-flex oj-sm-flex-items-center" style={{ alignItems: 'center' }}>
              <span class="oj-ux-ico-checkmark-s oj-sm-margin-2x-end" style={{ fontSize: '18px', color: '#28a745' }}></span>
              <span class="oj-typography-body-md">
                Application <strong>"{deletedApplication.name}"</strong> has been deleted.
              </span>
            </div>
            <oj-button
              display="icons"
              chroming="borderless"
              onojAction={() => setDeletedApplication(null)}
              style={{ color: '#155724' }}
            >
              <span slot='startIcon' class='oj-ux-ico-close'></span>
            </oj-button>
          </div>
        </div>
      )}

      {/* Header */}
      <div class="oj-flex oj-justify-content-space-between oj-align-items-start" style="margin-bottom: 24px;">
        <div style="flex: 1;">
          <h1 class="oj-header-page-title" style="color: #6366f1; margin: 0; font-size: 2rem; font-weight: 600; font-family: 'Poppins', sans-serif;">
            Applications
          </h1>
          <div class="oj-flex oj-align-items-center" style="margin-top: 4px; gap: 8px;">
            <span style="color: #6b7280; font-size: 0.975rem; font-family: 'Poppins', sans-serif;">
              Manage and monitor all your connected applications.
            </span>
          </div>
        </div>
        <div style="flex-shrink: 0; margin-left: 16px;">
          <oj-button
            class="oj-button-primary custom-add-button"
            onojAction={handleAddApplication}
            style="--oj-button-bg-color: #6366f1 !important; border: 0px !important; --oj-button-text-color: white !important; border-radius: 8px !important;">
            <span slot="startIcon" class="oj-ux-ico-plus"></span>
            Add Application
          </oj-button>
        </div>
      </div>

      {/* Applications Grid */}
      <div class="oj-flex oj-flex-wrap" style="gap: 24px;">
        {applications.map(app => {
          const appId = app._id.toString();
          const appLogCounts = logCounts[appId] || { logsToday: 0, errors: 0 };
          const statusBadge = getStatusBadge(app, appLogCounts.errors);

          return (
            <div
              key={appId}
              class="oj-panel oj-panel-shadow-sm"
              style="
                flex: 1;
                min-width: 400px;
                max-width: 400px;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                background: white;
              "
            >
              <div class="oj-flex oj-justify-content-space-between oj-align-items-start" style="margin-bottom: 16px;">
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 4px 0; font-size: 1.125rem; font-weight: 600; font-family: 'Poppins', sans-serif; color: #111827;">
                    {app.name}
                  </h3>
                  <p style="margin: 0; color: #6b7280; font-size: 0.875rem; font-family: 'Poppins', sans-serif;">
                    {app.description}
                  </p>
                </div>
                <div class="oj-flex" style="gap: 4px;">
                  <oj-button
                    display="icons"
                    chroming="borderless"
                    onojAction={() => handleApplicationSettings(appId)}
                    title="Edit Application"
                  >
                    <span slot="startIcon" class="oj-ux-ico-settings"></span>
                  </oj-button>
                  <oj-button
                    display='icons'
                    chroming='borderless'
                    onojAction={() => handleDeleteApplication(appId)}
                    title="Delete Application"
                    disabled={isDeleting}
                  >
                    <span slot='startIcon' class='oj-ux-ico-trash'></span>
                  </oj-button>
                </div>
              </div>

              {/* Status and Last Update */}
              <div class="oj-flex oj-justify-content-space-between oj-align-items-center" style="margin-bottom: 16px; width: 100%;">
                <span class={statusBadge.class} style="font-size: 0.75rem; font-family: 'Poppins', sans-serif; padding: 4px 8px; flex-shrink: 0;">
                  {statusBadge.text}
                </span>
                <span style="color: #6b7280; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0; margin-left: auto;">
                  {getLastLogTime(appId, logs)}
                </span>
              </div>

              {app.active && <div style="border-top: 1px solid #f3f4f6; padding-top: 16px;">
                <div class="oj-flex oj-justify-content-space-between oj-align-items-center" style="margin-bottom: 8px; width: 100%;">
                  <span style="color: #374151; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0;">Logs today:</span>
                  <span style="color: #374151; font-weight: 600; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0; margin-left: auto;">
                    {appLogCounts.logsToday}
                  </span>
                </div>
                <div class="oj-flex oj-justify-content-space-between oj-align-items-center" style="width: 100%;">
                  <span style="color: #374151; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0;">Errors:</span>
                  <span style="color: #374151; font-weight: 600; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0; margin-left: auto;">
                    {appLogCounts.errors}
                  </span>
                </div>
              </div>}
            </div>
          );
        })}
      </div>

      {applications.length === 0 && !loading && (
        <div class="oj-flex oj-justify-content-center oj-align-items-center" style="height: 200px;">
          <div style="text-align: center;">
            <h3 style="color: #6b7280; margin-bottom: 8px;">No applications found</h3>
            <p style="color: #9ca3af;">Click "Add Application" to get started.</p>
          </div>
        </div>
      )}

      <ApplicationModal
        showModal={showModal}
        isEditing={isEditing}
        newAppName={newAppName}
        newAppDescription={newAppDescription}
        newAppActive={newAppActive}
        nameError={nameError}
        descriptionError={descriptionError}
        formError={formError}
        isProcessing={isProcessing}
        isCreating={isCreating}
        isUpdating={isUpdating}
        onClose={handleCloseModal}
        onSave={handleSaveApplication}
        onNameChange={setNewAppName}
        onDescriptionChange={setNewAppDescription}
        onActiveChange={setNewAppActive}
      />

      <DeleteConfirmationModal
        showDeleteConfirm={showDeleteConfirm}
        deleteError={deleteError}
        isDeleting={isDeleting}
        onClose={handleCloseDeleteConfirm}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}