import { useState, useEffect } from "preact/hooks";
import ApplicationService from "../services/applicationService";
import { Application } from "../utils/applicationUtils";

interface CreateApplicationData {
  name: string;
  description: string;
}

interface UpdateApplicationData {
  name?: string;
  description?: string;
  active?: boolean;
}

interface DropdownOption {
  value: string;
  label: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface UseApplicationsOptions {
  pageSize?: number;
}

interface ApplicationFilters {
  active?: boolean;
}

export const useApplications = (options: UseApplicationsOptions = {}) => {
  const { pageSize = 5 } = options;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ApplicationFilters>({});
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: pageSize
  });

  const fetchApplications = async (page: number = 1, filters?: ApplicationFilters) => {
    try {
      setLoading(true);
      setError(null);
      
      const filtersToUse = filters !== undefined ? filters : currentFilters;
      const data = await ApplicationService.fetchAllApplications(page, pageSize, filtersToUse);
      
      setApplications(data.applications);
      setPagination(data.pagination);
      
      if (filters !== undefined) {
        setCurrentFilters(filters);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationsWithFilters = async (filters: ApplicationFilters) => {
    await fetchApplications(1, filters);
  };

  const goToPage = async (page: number) => {
    if (page >= 1 && page <= pagination.totalPages && page !== pagination.currentPage) {
      await fetchApplications(page);
    }
  };

  const goToNextPage = async () => {
    if (pagination.hasNextPage) {
      await fetchApplications(pagination.currentPage + 1);
    }
  };

  const goToPrevPage = async () => {
    if (pagination.hasPrevPage) {
      await fetchApplications(pagination.currentPage - 1);
    }
  };

  const goToFirstPage = async () => {
    if (pagination.currentPage !== 1) {
      await fetchApplications(1);
    }
  };

  const goToLastPage = async () => {
    if (pagination.currentPage !== pagination.totalPages) {
      await fetchApplications(pagination.totalPages);
    }
  };

  const refreshCurrentPage = async () => {
    await fetchApplications(pagination.currentPage);
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return {
    applications,
    setApplications,
    loading,
    error,
    pagination,
    currentFilters,
    actions: {
      fetchApplications: () => fetchApplications(1),
      fetchApplicationsWithFilters,
      refetch: refreshCurrentPage,
      goToPage,
      goToNextPage,
      goToPrevPage,
      goToFirstPage,
      goToLastPage,
      refreshCurrentPage
    }
  };
};

export const useApplicationNames = () => {
  const [applicationNames, setApplicationNames] = useState<DropdownOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplicationNames = async () => {
    try {
      setLoading(true);
      setError(null);
      const names = await ApplicationService.fetchApplicationNames();
      setApplicationNames(names);
    } catch (err) {
      console.error('Error fetching application names:', err);
      setError('Failed to fetch application names');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicationNames();
  }, []);

  return {
    applicationNames,
    setApplicationNames,
    loading,
    error,
  };
};

export const useCreateApplication = () => {
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createApplication = async (applicationData: CreateApplicationData) => {
    try {
      setIsCreating(true);
      setError(null);
      const newApp = await ApplicationService.createApplication(applicationData);
      console.log('Application created:', newApp);
      return newApp;
    } catch (err) {
      console.error('Error creating application:', err);
      setError('Failed to create application');
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  return {
    createApplication,
    isCreating,
    error
  };
};

export const useUpdateApplication = () => {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateApplication = async (id: string, updateData: UpdateApplicationData) => {
    try {
      setIsUpdating(true);
      setError(null);
      const updatedApp = await ApplicationService.updateApplication(id, updateData);
      console.log('Application updated:', updatedApp);
      return updatedApp;
    } catch (err) {
      console.error('Error updating application:', err);
      setError('Failed to update application');
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateApplication,
    isUpdating,
    error
  };
};

export const useDeleteApplication = () => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteApplication = async (id: string) => {
    try {
      setIsDeleting(true);
      setError(null);
      await ApplicationService.deleteApplication(id);
      console.log('Application deleted:', id);
      return true;
    } catch (err) {
      console.error('Error deleting application:', err);
      setError('Failed to delete application');
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteApplication,
    isDeleting,
    error
  };
};