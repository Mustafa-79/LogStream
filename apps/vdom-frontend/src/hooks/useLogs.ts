import { useState } from "preact/hooks";
import LogService from "../services/logService";
import { AuthManager } from "../utils/auth";
import { Log, UseLogsOptions, Pagination, LogFilters } from "../components/pages/Dashboard/types";

export const useLogs = (options: UseLogsOptions = {}) => {
  const { onUnauthorized, pageSize = 25 } = options;
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState<boolean>(false); // Initial page load
  const [dataLoading, setDataLoading] = useState<boolean>(false); // Filter/search/pagination operations
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

  const fetchLogs = async (page: number = 1, since?: string, filters?: LogFilters, searchTerm?: string, isInitialLoad: boolean = false) => {
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
      
      const response = await LogService.fetchLogs(since, page, pageSize, filtersToUse, searchToUse);

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
      
      const searchToUse = searchTerm !== undefined ? searchTerm : currentSearchTerm;
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
    actions: {
      fetchLogs: () => fetchLogs(1, undefined, undefined, undefined, true),
      fetchLogsWithFilters: async (filters: LogFilters, searchTerm?: string) => {
        await fetchLogsWithFilters(filters, searchTerm);
        await fetchLogStats(searchTerm);
      },
      fetchLogsWithSearch,
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
