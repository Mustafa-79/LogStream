import { h } from "preact";
import { useState } from "preact/hooks";
import { useApplications, useCreateApplication, useUpdateApplication, useDeleteApplication } from "../../../hooks/useApplications";
import { getLastLogTime, getStatusBadge, Log, validateApplicationForm } from "../../../utils/applicationUtils";
import "oj-c/button";

interface ApplicationsProps {
  logs: Log[];
  logCounts: Record<string, { logsToday: number; errors: number }>;
}

export function Applications({ logs, logCounts }: ApplicationsProps) {
  const { applications, setApplications, loading } = useApplications();
  const { createApplication, isCreating } = useCreateApplication();
  const { updateApplication, isUpdating } = useUpdateApplication();
  const { deleteApplication, isDeleting } = useDeleteApplication();

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState<string>('');
  const [newAppDescription, setNewAppDescription] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [deletingAppId, setDeletingAppId] = useState<string | null>(null);

  const handleAddApplication = () => {
    setShowModal(true);
    setNewAppName('');
    setNewAppDescription('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setNewAppName('');
    setNewAppDescription('');
    setEditingAppId(null);
    setIsEditing(false);
  };

  const handleSaveApplication = async () => {
    const validation = validateApplicationForm(newAppName, newAppDescription);
    
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    try {
      if (isEditing && editingAppId) {
        // Update existing application
        const updatedApp = await updateApplication(editingAppId, {
          name: newAppName.trim(),
          description: newAppDescription.trim(),
        });

        setApplications(prev =>
          prev.map(app => (app._id === editingAppId ? { ...app, ...updatedApp } : app))
        );
      } else {
        // Create new application
        const newApp = await createApplication({
          name: newAppName.trim(),
          description: newAppDescription.trim(),
        });

        setApplications(prev => [...prev, newApp]);
      }

      handleCloseModal();
    } catch (error) {
      alert('Failed to save application. Please try again.');
    }
  };

  const handleApplicationSettings = (appId: string) => {
    const app = applications.find(app => app._id === appId);
    if (!app) return;

    setEditingAppId(appId);
    setNewAppName(app.name);
    setNewAppDescription(app.description);
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
  };

  const handleConfirmDelete = async () => {
    if (!deletingAppId) return;

    try {
      await deleteApplication(deletingAppId);
      
      setApplications(prev => prev.filter(app => app._id !== deletingAppId));
      
      handleCloseDeleteConfirm();
    } catch (error) {
      alert('Failed to delete application. Please try again.');
    }
  };

  const isProcessing = isCreating || isUpdating || isDeleting;

  if (loading) {
    return (
      <div class="oj-web-applayout-page" style="padding: 40px;">
        <div class="oj-flex oj-justify-content-center oj-align-items-center" style="height: 200px;">
          <span>Loading applications...</span>
        </div>
      </div>
    );
  }

  return (
    <div class="oj-web-applayout-page" style="padding: 40px;">
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
            <div class="oj-flex oj-align-items-center" style="gap: 4px;">
              <span class="oj-badge oj-badge-success" style="width: 5px; height: 15px; border-radius: 50%; padding: 0;"></span>
              <span style="color: #6b7280; font-size: 0.875rem; font-family: 'Poppins', sans-serif;">Live Status</span>
            </div>
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
                    display="icons"
                    chroming="borderless"
                    onojAction={() => handleDeleteApplication(appId)}
                    title="Delete Application"
                  >
                    <span slot="startIcon" class="oj-ux-ico-trash" style="color: #ef4444;"></span>
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

              <div style="border-top: 1px solid #f3f4f6; padding-top: 16px;">
                <div class="oj-flex oj-justify-content-space-between oj-align-items-center" style="margin-bottom: 8px; width: 100%;">
                  <span style="color: #374151; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0;">Logs today:</span>
                  <span style="color: #6366f1; font-weight: 600; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0; margin-left: auto;">
                    {appLogCounts.logsToday}
                  </span>
                </div>
                <div class="oj-flex oj-justify-content-space-between oj-align-items-center" style="width: 100%;">
                  <span style="color: #374151; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0;">Errors:</span>
                  <span style="color: #ef4444; font-weight: 600; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0; margin-left: auto;">
                    {appLogCounts.errors}
                  </span>
                </div>
              </div>
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

      {/* Add/Edit Application Modal */}
      {showModal && (
        <div class="modal-overlay" style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        ">
          <div class="modal-content oj-panel" style="
            background: white;
            border-radius: 8px;
            padding: 24px;
            width: 500px;
            max-width: 90vw;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          ">
            <div style="margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #111827; font-family: 'Poppins', sans-serif;">
                {isEditing ? 'Edit Application' : 'Add New Application'}
              </h2>
              <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 0.875rem; font-family: 'Poppins', sans-serif;">
                {isEditing ? 'Update the application details' : 'Enter the details for your new application'}
              </p>
            </div>

            <div style="margin-bottom: 20px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151; font-size: 0.875rem; font-family: 'Poppins', sans-serif;">
                Application Name *
              </label>
              <input
                type="text"
                value={newAppName}
                onInput={(e) => setNewAppName((e.target as HTMLInputElement).value)}
                placeholder="Enter application name"
                style="
                  width: 100%;
                  padding: 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  font-size: 0.875rem;
                  font-family: 'Poppins', sans-serif;
                  box-sizing: border-box;
                "
              />
            </div>

            <div style="margin-bottom: 24px;">
              <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151; font-size: 0.875rem; font-family: 'Poppins', sans-serif;">
                Description *
              </label>
              <textarea
                value={newAppDescription}
                onInput={(e) => setNewAppDescription((e.target as HTMLTextAreaElement).value)}
                placeholder="Enter application description"
                rows={3}
                style="
                  width: 100%;
                  padding: 12px;
                  border: 1px solid #d1d5db;
                  border-radius: 6px;
                  font-size: 0.875rem;
                  font-family: 'Poppins', sans-serif;
                  resize: vertical;
                  box-sizing: border-box;
                "
              />
            </div>

            <div class="oj-flex oj-justify-content-flex-end" style="gap: 12px;">
              <oj-button
                onojAction={handleCloseModal}
                disabled={isProcessing}
                style="border: 1px solid #d1d5db; color: #374151;"
              >
                Cancel
              </oj-button>
              <oj-button
                class="oj-button-primary"
                onojAction={handleSaveApplication}
                disabled={isProcessing}
                style="--oj-button-bg-color: #6366f1; --oj-button-text-color: white; border: none;"
              >
                {isEditing
                  ? isUpdating ? 'Updating...' : 'Update Application'
                  : isCreating ? 'Creating...' : 'Create Application'}
              </oj-button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div class="modal-overlay" style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        ">
          <div class="modal-content oj-panel" style="
            background: white;
            border-radius: 8px;
            padding: 24px;
            width: 400px;
            max-width: 90vw;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          ">
            <div style="margin-bottom: 20px;">
              <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #111827; font-family: 'Poppins', sans-serif;">
                Delete Application
              </h2>
              <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 0.875rem; font-family: 'Poppins', sans-serif;">
                Are you sure you want to delete this application? This action cannot be undone and will permanently remove all associated data.
              </p>
            </div>

            <div class="oj-flex oj-justify-content-flex-end" style="gap: 12px;">
              <oj-button
                onojAction={handleCloseDeleteConfirm}
                disabled={isDeleting}
                style="border: 1px solid #d1d5db; color: #374151;"
              >
                Cancel
              </oj-button>
              <oj-button
                onojAction={handleConfirmDelete}
                disabled={isDeleting}
                style="--oj-button-bg-color: #ef4444; --oj-button-text-color: white; border: none;"
              >
                {isDeleting ? 'Deleting...' : 'Delete Application'}
              </oj-button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}