import { useState, useEffect } from "preact/hooks";
import ApplicationService from "../services/applicationService";
import { 
  Application, 
  CreateApplicationData, 
  UpdateApplicationData, 
  DropdownOption, 
  Pagination, 
  UseApplicationsOptions, 
  ApplicationFilters 
} from "../components/pages/Applications/types";

export const useApplications = (options: UseApplicationsOptions = {}) => {
  const { pageSize = 6 } = options;
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true); // Initial page load
  const [dataLoading, setDataLoading] = useState<boolean>(false); // Filter/search operations
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ApplicationFilters>({});
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: pageSize
  });

  const fetchApplications = async (page: number = 1, filters?: ApplicationFilters, searchTerm?: string, isInitialLoad: boolean = false) => {
    try {
      // Use different loading states based on whether this is initial load
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setDataLoading(true);
      }
      setError(null);
      
      const filtersToUse = filters !== undefined ? filters : currentFilters;
      const searchToUse = searchTerm !== undefined ? searchTerm : currentSearchTerm;
      
      const data = await ApplicationService.fetchAllApplications(page, pageSize, filtersToUse, searchToUse);
      
      setApplications(data.applications);
      setPagination(data.pagination);
      
      if (filters !== undefined) {
        setCurrentFilters(filters);
      }
      
      if (searchTerm !== undefined) {
        setCurrentSearchTerm(searchTerm);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to fetch applications');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setDataLoading(false);
      }
    }
  };

  const fetchApplicationsWithFilters = async (filters: ApplicationFilters, searchTerm?: string) => {
    await fetchApplications(1, filters, searchTerm, false);
  };

  const fetchApplicationsWithSearch = async (searchTerm: string) => {
    await fetchApplications(1, currentFilters, searchTerm, false);
  };

  const goToPage = async (page: number) => {
    if (page >= 1 && page <= pagination.totalPages && page !== pagination.currentPage) {
      await fetchApplications(page, undefined, undefined, false);
    }
  };

  const goToNextPage = async () => {
    if (pagination.hasNextPage) {
      await fetchApplications(pagination.currentPage + 1, undefined, undefined, false);
    }
  };

  const goToPrevPage = async () => {
    if (pagination.hasPrevPage) {
      await fetchApplications(pagination.currentPage - 1, undefined, undefined, false);
    }
  };

  const goToFirstPage = async () => {
    if (pagination.currentPage !== 1) {
      await fetchApplications(1, undefined, undefined, false);
    }
  };

  const goToLastPage = async () => {
    if (pagination.currentPage !== pagination.totalPages) {
      await fetchApplications(pagination.totalPages, undefined, undefined, false);
    }
  };

  const refreshCurrentPage = async () => {
    await fetchApplications(pagination.currentPage, undefined, undefined, false);
  };

  useEffect(() => {
    fetchApplications(1, undefined, undefined, true); // Initial load
  }, []);

  return {
    applications,
    setApplications,
    loading,
    dataLoading, // New: separate loading state for data operations
    error,
    pagination,
    currentFilters,
    currentSearchTerm,
    actions: {
      fetchApplications: () => fetchApplications(1, undefined, undefined, true),
      fetchApplicationsWithFilters,
      fetchApplicationsWithSearch, // New: search function
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