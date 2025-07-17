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
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setDataLoading(true);
      }
      setError(null);

      const filtersToUse = filters !== undefined ? filters : currentFilters;
      const searchToUse = searchTerm !== undefined ? searchTerm : currentSearchTerm;
      
      let sortByToUse: string | undefined;
      let sortOrderToUse: 'asc' | 'desc' | 'default' | undefined;
      
      if (sortBy !== undefined) {
        sortByToUse = sortBy;
        setCurrentSortBy(sortBy);
      } else {
        sortByToUse = currentSortBy;
      }
      
      if (sortOrder !== undefined) {
        sortOrderToUse = sortOrder;
        setCurrentSortOrder(sortOrder);
      } else {
        sortOrderToUse = currentSortOrder;
      }
      
      const response = await LogService.fetchLogs(
        since, 
        page, 
        pageSize, 
        filtersToUse, 
        searchToUse, 
        sortBy, 
        sortOrderToUse
      );

      setLogs(response.logs);
      setPagination(response.pagination);
      
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
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setDataLoading(false);
      }
    }
  };

  const fetchLogsWithFilters = async (filters: LogFilters, searchTerm?: string) => {
    await fetchLogs(1, undefined, filters, searchTerm, false);
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
      await fetchLogs(page, undefined, undefined, undefined, false);
    }
  };

  const goToNextPage = async () => {
    if (pagination.hasNextPage) {
      await fetchLogs(pagination.currentPage + 1, undefined, undefined, undefined, false);
    }
  };

  const goToPrevPage = async () => {
    if (pagination.hasPrevPage) {
      await fetchLogs(pagination.currentPage - 1, undefined, undefined, undefined, false);
    }
  };

  const goToFirstPage = async () => {
    if (pagination.currentPage !== 1) {
      await fetchLogs(1, undefined, undefined, undefined, false);
    }
  };

  const goToLastPage = async () => {
    if (pagination.currentPage !== pagination.totalPages) {
      await fetchLogs(pagination.totalPages, undefined, undefined, undefined, false);
    }
  };

  const refreshCurrentPage = async () => {
    await fetchLogs(pagination.currentPage, undefined, undefined, undefined, false);
  };

  const fetchLogStats = async (searchTerm?: string) => {
    if (!AuthManager.isAuthenticated()) {
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);
      
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
      fetchLogStats: (searchTerm?: string) => fetchLogStats(searchTerm),
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
