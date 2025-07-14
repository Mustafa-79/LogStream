import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { useApplications, useCreateApplication, useUpdateApplication, useDeleteApplication } from "../../../hooks/useApplications";
import { getLastLogTime, getStatusBadge, Log, validateApplicationForm } from "../../../utils/applicationUtils";
import { ApplicationModal } from "./ApplicationModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { DiscardChangesModal } from "./DiscardChangesModal"; // New modal component
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "oj-c/button";
import "ojs/ojbutton";
import "oj-c/progress-circle";
import "oj-c/select-single";
import "ojs/ojinputtext";

interface ApplicationFilters {
  active?: boolean;
}

// Interface for tracking original form values
interface OriginalFormValues {
  name: string;
  description: string;
  active: boolean;
}

export function Applications() {
  const { applications, setApplications, loading, pagination, currentFilters, actions } = useApplications({ pageSize: 5 });
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

  const [showDiscardConfirm, setShowDiscardConfirm] = useState<boolean>(false);
  const [originalFormValues, setOriginalFormValues] = useState<OriginalFormValues | null>(null);

  const [formError, setFormError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletedApplication, setDeletedApplication] = useState<{ name: string } | null>(null);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [applyingFilters, setApplyingFilters] = useState<boolean>(false);
  const [statusFilterDP, setStatusFilterDP] = useState<any>(null);

  // Initialize filter data provider
  useEffect(() => {
    const statusOptions = [
      { value: 'all', label: 'All Applications' },
      { value: 'active', label: 'Active Only' },
      { value: 'inactive', label: 'Inactive Only' }
    ];
    
    const dataProvider = new ArrayDataProvider(statusOptions, {
      keyAttributes: 'value'
    });
    
    setStatusFilterDP(dataProvider);
  }, []);

  const hasFormChanges = (): boolean => {
    if (!originalFormValues) return false;
    
    return (
      newAppName.trim() !== originalFormValues.name ||
      newAppDescription.trim() !== originalFormValues.description ||
      newAppActive !== originalFormValues.active
    );
  };

  const handleAddApplication = () => {
    const defaultValues = {
      name: '',
      description: '',
      active: true
    };
    
    setOriginalFormValues(defaultValues);
    setShowModal(true);
    setNewAppName(defaultValues.name);
    setNewAppDescription(defaultValues.description);
    setNewAppActive(defaultValues.active); 
  };

  const handleCloseModal = () => {
    if (hasFormChanges()) {
      setShowDiscardConfirm(true);
    } else {
      performCloseModal();
    }
  };

  const performCloseModal = () => {
    setShowModal(false);
    setNewAppName('');
    setNewAppDescription('');
    setNewAppActive(true);
    setEditingAppId(null);
    setIsEditing(false);
    setFormError(null);
    setNameError(null);
    setDescriptionError(null);
    setOriginalFormValues(null);
  };

  // Handle discard confirmation
  const handleDiscardChanges = () => {
    setShowDiscardConfirm(false);
    performCloseModal();
  };

  const handleCancelDiscard = () => {
    setShowDiscardConfirm(false);
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

        await actions.refreshCurrentPage();
        
        setSuccessMessage(`Application "${newAppName.trim()}" has been updated successfully.`);
      } else {
        const newApp = await createApplication({
          name: newAppName.trim(),
          description: newAppDescription.trim(),
        });

        await actions.refreshCurrentPage();
        
        setSuccessMessage(`Application "${newAppName.trim()}" has been created successfully.`);
      }

      performCloseModal();
    } catch (error: unknown) {
      const message = (error as Error)?.message || 'Failed to save application. Please try again.';
      setFormError(message);
    }
  };

  const handleApplicationSettings = (appId: string) => {
    const app = applications.find(app => app._id === appId);
    if (!app) return;

    const originalValues = {
      name: app.name,
      description: app.description,
      active: app.active ?? true
    };

    setOriginalFormValues(originalValues);
    setEditingAppId(appId);
    setNewAppName(originalValues.name);
    setNewAppDescription(originalValues.description);
    setNewAppActive(originalValues.active); 
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
      
      await actions.refreshCurrentPage();
      
      if (appToDelete) {
        setDeletedApplication({ name: appToDelete.name });
      }
      
      handleCloseDeleteConfirm();
    } catch (error) {
      const message = (error as Error)?.message || 'Failed to delete application. Please try again.';
      setDeleteError(message);
    }
  };

  // Filter handlers
  const handleFilterChange = async (event: any) => {
    const newStatus = event.detail.value;
    setFilterStatus(newStatus);
    setApplyingFilters(true);
    
    try {
      const filters: ApplicationFilters = {};
      
      if (newStatus === 'active') {
        filters.active = true;
      } else if (newStatus === 'inactive') {
        filters.active = false;
      }
      
      await actions.fetchApplicationsWithFilters(filters);
      
      console.log('Filter applied successfully:', newStatus);
    } catch (error) {
      console.error('Error applying filter:', error);
    } finally {
      setApplyingFilters(false);
    }
  };

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (deletedApplication) {
      const timer = setTimeout(() => {
        setDeletedApplication(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [deletedApplication]);

  const isProcessing = isCreating || isUpdating || isDeleting;

  const handleSearchChange = (event: any) => {
    setSearchQuery(event.detail.value || '');
  };

  const clearSearch = () => {
    setSearchQuery('');
  };
  const handlePageChange = async (page: number) => {
    await actions.goToPage(page);
  };

  const handleFirstPage = async () => {
    await actions.goToFirstPage();
  };

  const handlePrevPage = async () => {
    await actions.goToPrevPage();
  };

  const handleNextPage = async () => {
    await actions.goToNextPage();
  };

  const handleLastPage = async () => {
    await actions.goToLastPage();
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchQuery.trim() === '' || 
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });
  
  const getVisiblePageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const visiblePages: number[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
      }
    }
    
    return visiblePages;
  };

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
          <h1 class="oj-typography-heading-lg" style="margin: 0;">
            Applications
          </h1>
          <div class="oj-flex oj-align-items-center" style="margin-top: 4px; gap: 8px;">
            <span style="color: #6b7280; font-size: 0.975rem; font-family: 'Poppins', sans-serif;">
              Manage and monitor all your connected applications. ({pagination.totalCount} total)
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

      {/* Filter Section */}
      <div class="oj-panel oj-panel-shadow-sm" style="margin-bottom: 24px; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; background: white;">
        <div class="oj-flex oj-align-items-center" style="gap: 16px; flex-wrap: wrap;">
          {/* Search Input */}
          <div class="oj-flex oj-align-items-center" style="gap: 8px;">
            <span style="color: #374151; font-weight: 600; font-size: 0.875rem; font-family: 'Poppins', sans-serif; white-space: nowrap;">
              Search:
            </span>
            <div class="oj-flex oj-align-items-center" style="position: relative; min-width: 400px;">
              <oj-input-text
                value={searchQuery}
                onrawValueChanged={handleSearchChange}
                placeholder="Search by name or description..."
                style="flex: 1; padding-right: 30px;"
              ></oj-input-text>
              {searchQuery && (
                <oj-button
                  display="icons"
                  chroming="borderless"
                  onojAction={clearSearch}
                  title="Clear search"
                  style="position: absolute; right: 4px; padding: 2px; min-width: 24px; height: 24px;"
                >
                  <span slot="startIcon" class="oj-ux-ico-close" style="font-size: 12px;"></span>
                </oj-button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div class="oj-flex oj-align-items-center" style="gap: 8px;">
            <span style="color: #374151; font-weight: 600; font-size: 0.875rem; font-family: 'Poppins', sans-serif; white-space: nowrap;">
              Filter by Status:
            </span>
            <div style="min-width: 150px;">
              {statusFilterDP && (
                <oj-c-select-single
                  data={statusFilterDP}
                  value={filterStatus}
                  onvalueChanged={handleFilterChange}
                  label-hint="Select status"
                  item-text="label"
                  style="width: 100%;"
                ></oj-c-select-single>
              )}
            </div>
          </div>

          {/* Loading Indicator */}
          {applyingFilters && (
            <div class="oj-flex oj-align-items-center" style="gap: 8px;">
              <oj-c-progress-circle size="sm" value={-1}></oj-c-progress-circle>
              <span style="color: #6b7280; font-size: 0.875rem;">Applying filter...</span>
            </div>
          )}

          {/* Active Filters Display */}
          {(Object.keys(currentFilters).length > 0 || searchQuery.trim() !== '') && (
            <div class="oj-flex oj-align-items-center" style="gap: 8px; flex-wrap: wrap;">
              {/* Status Filter Badge */}
              {Object.keys(currentFilters).length > 0 && (
                <>
                  <span style="color: #6b7280; font-size: 0.875rem;">Active filters:</span>
                  <span style="
                    background: #e0e7ff; 
                    color: #3730a3; 
                    padding: 4px 8px; 
                    border-radius: 4px; 
                    font-size: 0.75rem; 
                    font-weight: 500;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                  ">
                    {currentFilters.active === true ? 'Active Apps' : 
                     currentFilters.active === false ? 'Inactive Apps' : 'All Apps'}
                  </span>
                  <oj-button
                    display="icons"
                    chroming="borderless"
                    onojAction={() => handleFilterChange({ detail: { value: 'all' } })}
                    title="Clear status filter"
                    style="padding: 0; min-width: 16px; height: 16px; margin-left: 2px;"
                  >
                    <span slot="startIcon" class="oj-ux-ico-close" style="font-size: 10px;"></span>
                  </oj-button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Applications Grid */}
      <div class="oj-flex oj-flex-wrap" style="gap: 24px; min-height: 400px;">
        {filteredApplications.map(app => {
          const appId = app._id.toString();
          const appLogCounts = { logsToday: 10, errors: 10 };
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
                  Time
                </span>
              </div>

              {app.active && <div style="border-top: 1px solid #f3f4f6; padding-top: 16px;">
                <div class="oj-flex oj-justify-content-space-between oj-align-items-center" style="margin-bottom: 8px; width: 100%;">
                  <span style="color: #374151; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0;">Logs today:</span>
                  <span style="color: #374151; font-weight: 600; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0; margin-left: auto;">
                    {app.logsToday}
                  </span>
                </div>
                <div class="oj-flex oj-justify-content-space-between oj-align-items-center" style="width: 100%;">
                  <span style="color: #374151; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0;">Errors:</span>
                  <span style="color: #374151; font-weight: 600; font-size: 0.875rem; font-family: 'Poppins', sans-serif; flex-shrink: 0; margin-left: auto;">
                    {app.errorsToday}
                  </span>
                </div>
              </div>}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredApplications.length === 0 && !loading && (
        <div class="oj-flex oj-justify-content-center oj-align-items-center" style="height: 200px;">
          <div style="text-align: center;">
            <h3 style="color: #6b7280; margin-bottom: 8px;">
              {searchQuery.trim() !== '' ? 
                `No applications found matching "${searchQuery}"` :
                Object.keys(currentFilters).length > 0 
                  ? `No ${currentFilters.active === true ? 'active' : currentFilters.active === false ? 'inactive' : ''} applications found`
                  : 'No applications found'
              }
            </h3>
            <p style="color: #9ca3af;">
              {searchQuery.trim() !== '' ? 
                'Try adjusting your search terms.' :
                Object.keys(currentFilters).length > 0 
                  ? 'Try changing the filter or add a new application.'
                  : 'Click "Add Application" to get started.'
              }
            </p>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div style="margin-top: 32px; padding: 20px; border-top: 1px solid #e5e7eb; background: #f9fafb; border-radius: 8px;">
          <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center">
            <div class="oj-typography-body-sm" style="color: #6b7280;">
              Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} applications
            </div>
            
            <div class="oj-flex oj-sm-align-items-center" style="gap: 8px;">
              <oj-button
                class="oj-button-outlined-chrome"
                disabled={!pagination.hasPrevPage}
                onojAction={handleFirstPage}
                style="min-width: auto; padding: 8px 12px;"
              >
                <span class="oj-typography-body-sm">First</span>
              </oj-button>
              
              <oj-button
                class="oj-button-outlined-chrome"
                disabled={!pagination.hasPrevPage}
                onojAction={handlePrevPage}
                style="min-width: auto; padding: 8px 12px;"
              >
                <span class="oj-typography-body-sm">‹ Prev</span>
              </oj-button>
              
              {getVisiblePageNumbers().map((pageNum) => (
                <oj-button
                  key={pageNum}
                  class={pageNum === pagination.currentPage ? "oj-button-primary" : "oj-button-outlined-chrome"}
                  onojAction={() => handlePageChange(pageNum)}
                  style="min-width: 40px; padding: 8px 12px;"
                >
                  <span class="oj-typography-body-sm">{pageNum}</span>
                </oj-button>
              ))}
              
              <oj-button
                class="oj-button-outlined-chrome"
                disabled={!pagination.hasNextPage}
                onojAction={handleNextPage}
                style="min-width: auto; padding: 8px 12px;"
              >
                <span class="oj-typography-body-sm">Next ›</span>
              </oj-button>
              
              <oj-button
                class="oj-button-outlined-chrome"
                disabled={!pagination.hasNextPage}
                onojAction={handleLastPage}
                style="min-width: auto; padding: 8px 12px;"
              >
                <span class="oj-typography-body-sm">Last</span>
              </oj-button>
            </div>
          </div>
        </div>
      )}

      {/* Page Info */}
      {filteredApplications.length > 0 && (
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 0.875rem; color: #6b7280;">
          <p style="margin: 0;">
            Page {pagination.currentPage} of {pagination.totalPages} • 
            Last updated: {new Date().toLocaleTimeString()}
            {Object.keys(currentFilters).length > 0 && (
              <span> • Filtered by: {currentFilters.active === true ? 'Active applications' : currentFilters.active === false ? 'Inactive applications' : 'All applications'}</span>
            )}
            {searchQuery.trim() !== '' && (
              <span> • Search: "{searchQuery}"</span>
            )}
          </p>
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

      <DiscardChangesModal
        showDiscardConfirm={showDiscardConfirm}
        onConfirm={handleDiscardChanges}
        onCancel={handleCancelDiscard}
      />
    </div>
  );
}