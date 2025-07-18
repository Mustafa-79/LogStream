import { useUserGroups } from '../../../hooks/useUserGroups';
import { CreateUserGroupModal } from './CreateUserGroupModal';
import { EditUserGroupModal } from './EditUserGroupModal';
import { NotificationBanner } from './NotificationBanner';
import { PageHeader } from './PageHeader';
import { UserGroupFilters } from './UserGroupFilters';
import { ContentArea } from './ContentArea';
import { PaginationControls } from './PaginationControls';
import { StatusFooter } from './StatusFooter';


export function UserGroups() {
  const {
    // State
    userGroups,
    loading,
    error,
    deletedGroup,
    successMessage,
    pagination,
    
    // Search and filter state
    searchTerm,
    isSearching,
    selectedStatuses,
    selectedApplications,
    statusDataProvider,
    applicationDataProvider,
    
    // Modal state
    isCreateModalOpen,
    isEditModalOpen,
    selectedGroupForEdit,
    createGroupLoading,
    createGroupError,
    
    // Actions and handlers
    fetchUserGroups,
    handleSearchChange,
    handleStatusFilterChange,
    handleApplicationFilterChange,
    getStatusFilterValue,
    handleSearchSubmit,
    clearSearch,
    handleDeleteGroup,
    handleUndoDelete,
    handleDismissUndo,
    handleCreateGroup,
    handleCloseCreateModal,
    handleCreateGroupSubmit,
    handleEditGroup,
    handleCloseEditModal,
    handleEditGroupSubmit,
    handlePageChange,
    handleFirstPage,
    handlePrevPage,
    handleNextPage,
    handleLastPage,
    getVisiblePageNumbers,
    setSuccessMessage
  } = useUserGroups();

  const handleRetry = () => {
    fetchUserGroups(1, searchTerm, getStatusFilterValue(), Array.from(selectedApplications).length > 0 ? Array.from(selectedApplications) : undefined);
  };

  return (
    <div class="oj-web-applayout-page" style="padding: 40px;">
      {/* Notifications */}
      <NotificationBanner
        successMessage={successMessage}
        deletedGroup={deletedGroup}
        onDismissSuccess={() => setSuccessMessage(null)}
        onUndoDelete={handleUndoDelete}
        onDismissUndo={handleDismissUndo}
      />

      {/* Page Header */}
      <PageHeader
        loading={loading}
        isSearching={isSearching}
        onCreateGroup={handleCreateGroup}
      />

      {/* Search and Filters */}
      <UserGroupFilters
        searchTerm={searchTerm}
        selectedStatuses={selectedStatuses}
        selectedApplications={selectedApplications}
        statusDataProvider={statusDataProvider}
        applicationDataProvider={applicationDataProvider}
        isSearching={isSearching}
        loading={loading}
        onSearchChange={handleSearchChange}
        onStatusFilterChange={handleStatusFilterChange}
        onApplicationFilterChange={handleApplicationFilterChange}
        onSearchSubmit={handleSearchSubmit}
        onClearSearch={clearSearch}
      />

      {/* Main Content */}
      <ContentArea
        loading={loading}
        error={error}
        userGroups={userGroups}
        searchTerm={searchTerm}
        selectedApplications={selectedApplications}
        getStatusFilterValue={getStatusFilterValue}
        onDeleteGroup={handleDeleteGroup}
        onEditGroup={handleEditGroup}
        onRetry={handleRetry}
      />

      {/* Pagination */}
      <PaginationControls
        pagination={pagination}
        onPageChange={handlePageChange}
        onFirstPage={handleFirstPage}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onLastPage={handleLastPage}
        getVisiblePageNumbers={getVisiblePageNumbers}
      />

      {/* Status Footer */}
      <StatusFooter
        loading={loading}
        error={error}
        userGroupsLength={userGroups.length}
        pagination={pagination}
      />

      {/* Create User Group Modal */}
      <CreateUserGroupModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onSubmit={handleCreateGroupSubmit}
        loading={createGroupLoading}
        error={createGroupError}
      />

      {/* Edit User Group Modal */}
      {selectedGroupForEdit && (
        <EditUserGroupModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onSubmit={handleEditGroupSubmit}
          userGroup={selectedGroupForEdit}
          loading={createGroupLoading}
          error={createGroupError}
        />
      )}
    </div>
  );
}
