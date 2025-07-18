import { useState } from "preact/hooks";
import LogService from "../services/logService";
import { AuthManager } from "../utils/auth";
import { Log, UseLogsOptions, Pagination, LogFilters } from "../components/pages/Dashboard/types";

export const useLogs = (options: UseLogsOptions = {}) => {
  const { onUnauthorized, pageSize = 25 } = options;
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: pageSize
  });
  const [logStats, setLogStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState<boolean>(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<LogFilters>({});
  const [currentSearchTerm, setCurrentSearchTerm] = useState<string>("");
  
  // Initialize with default sorting state
  const [currentSortBy, setCurrentSortBy] = useState<string | undefined>(undefined);
  const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc' | 'default' | undefined>('default');
  const [isFetching, setIsFetching] = useState<boolean>(false);

  const fetchLogs = async (
    page: number = 1, 
    since?: string, 
    filters?: LogFilters, 
    searchTerm?: string, 
    isInitialLoad: boolean = false,
    sortBy?: string, 
    sortOrder?: 'asc' | 'desc' | 'default'
  ) => {
    if (!AuthManager.isAuthenticated()) {
      return;
    }

    try {
      setIsFetching(true);
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setDataLoading(true);
      }
      setError(null);

      // Use current state if not explicitly provided
      const filtersToUse = filters !== undefined ? filters : currentFilters;
      const searchToUse = searchTerm !== undefined ? searchTerm : currentSearchTerm;
      
      let sortByToUse: string | undefined;
      let sortOrderToUse: 'asc' | 'desc' | 'default' | undefined;
      
      if (sortBy !== undefined) {
        sortByToUse = sortBy;
        setCurrentSortBy(sortBy);
        sortByToUse = sortBy;
      } else if (currentSortBy === 'default' || currentSortBy === undefined) {
        sortByToUse = 'default';
        setCurrentSortBy('default');
      } else {
        sortByToUse = currentSortBy;
      }
      
      if (sortOrder !== undefined) {
        sortOrderToUse = sortOrder;
        setCurrentSortOrder(sortOrder);
        sortOrderToUse = sortOrder;
      } else if (currentSortOrder === 'default' || currentSortOrder === undefined) {
        sortOrderToUse = 'default';
        setCurrentSortOrder('default');
      } else {
        sortOrderToUse = currentSortOrder;
      }
      
      const response = await LogService.fetchLogs(
        since, 
        page, 
        pageSize, 
        filtersToUse, 
        searchToUse, 
        sortByToUse, 
        sortOrderToUse
      );

      setLogs(response.logs);
      setPagination(response.pagination);
      
      // Update current state only if new values were provided
      if (filters !== undefined) {
        setCurrentFilters(filters);
      }
      
      if (searchTerm !== undefined) {
        setCurrentSearchTerm(searchTerm);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);

      if (err instanceof Error && err.message === "UNAUTHORIZED") {
        if (onUnauthorized) {
          onUnauthorized();
        }
        return;
      }

      setError("Failed to fetch logs");
    } finally {
      setIsFetching(false);
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setDataLoading(false);
      }
    }
  };

  const fetchLogsWithFilters = async (filters: LogFilters, searchTerm?: string) => {
    if (isFetching) {
      console.log('Already fetching, skipping duplicate call');
      return;
    }
    const searchToUse = searchTerm !== undefined ? searchTerm : currentSearchTerm;
    await fetchLogs(1, undefined, filters, searchToUse, false);
  };

  const fetchLogsWithSearch = async (searchTerm: string) => {
    await fetchLogs(1, undefined, currentFilters, searchTerm, false);
  };

  const fetchLogsWithSort = async (
    sortBy?: string,
    sortOrder?: 'asc' | 'desc' | 'default'
  ) => {
    await fetchLogs(1, undefined, currentFilters, currentSearchTerm, false, sortBy, sortOrder);
  };

  const goToPage = async (page: number) => {
    if (page >= 1 && page <= pagination.totalPages && page !== pagination.currentPage) {
      await fetchLogs(page, undefined, currentFilters, currentSearchTerm, false);
    }
  };

  const goToNextPage = async () => {
    if (pagination.hasNextPage) {
      await fetchLogs(pagination.currentPage + 1, undefined, currentFilters, currentSearchTerm, false);
    }
  };

  const goToPrevPage = async () => {
    if (pagination.hasPrevPage) {
      await fetchLogs(pagination.currentPage - 1, undefined, currentFilters, currentSearchTerm, false);
    }
  };

  const goToFirstPage = async () => {
    if (pagination.currentPage !== 1) {
      await fetchLogs(1, undefined, currentFilters, currentSearchTerm, false);
    }
  };

  const goToLastPage = async () => {
    if (pagination.currentPage !== pagination.totalPages) {
      await fetchLogs(pagination.totalPages, undefined, currentFilters, currentSearchTerm, false);
    }
  };

  const refreshCurrentPage = async () => {
    // Retain current filters and search when refreshing
    await fetchLogs(pagination.currentPage, undefined, currentFilters, currentSearchTerm, false);
    await fetchLogStats();
  };

  const clearAllFiltersAndSearch = async () => {
    try {
      setDataLoading(true);
      setError(null);
      
      setCurrentFilters({});
      setCurrentSearchTerm("");
      
      await fetchLogs(1, undefined, {}, "", false);
    } catch (err) {
      console.error("Error clearing filters and search:", err);
      setError("Failed to clear filters");
    } finally {
      setDataLoading(false);
    }
  };

  const fetchLogStats = async () => {
    if (!AuthManager.isAuthenticated()) {
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);
      
      // Include current filters and search in stats
      const stats = await LogService.fetchLogStats(currentFilters);
      setLogStats(stats);
    } catch (error) {
      console.error('Error fetching log stats:', error);
      setStatsError("Failed to fetch log stats");
    } finally {
      setStatsLoading(false);
    }
  };

  return {
    logs,
    loading,
    dataLoading,
    error,
    pagination,
    logStats,
    statsLoading,
    statsError,
    currentFilters,
    currentSearchTerm,
    currentSortBy,
    currentSortOrder,
    actions: {
      fetchLogs: () => fetchLogs(1, undefined, undefined, undefined, true),
      fetchLogsWithFilters: async (filters: LogFilters, searchTerm?: string) => {
        await fetchLogsWithFilters(filters, searchTerm);
      },
      fetchLogsWithSearch,
      fetchLogsWithSort, 
      fetchLogStats: () => fetchLogStats(),
      refetch: refreshCurrentPage,
      goToPage,
      goToNextPage,
      goToPrevPage,
      goToFirstPage,
      goToLastPage,
      refreshCurrentPage,
      clearAllFiltersAndSearch
    }
  };
};