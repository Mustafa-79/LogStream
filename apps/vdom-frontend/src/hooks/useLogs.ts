import { useState, useRef } from "preact/hooks";
import LogService from "../services/logService";
import { Log } from "../utils/applicationUtils";
import { AuthManager } from "../utils/auth";

interface UseLogsOptions {
  onUnauthorized?: () => void;
  pageSize?: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface LogFilters {
  applications?: string[];
  logLevels?: string[];
  fromDate?: string;
  toDate?: string;
}

export const useLogs = (options: UseLogsOptions = {}) => {
  const { onUnauthorized, pageSize = 25 } = options;
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
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

  const fetchLogs = async (page: number = 1, since?: string, filters?: LogFilters) => {
    if (!AuthManager.isAuthenticated()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const filtersToUse = filters !== undefined ? filters : currentFilters;
      
      const response = await LogService.fetchLogs(since, page, pageSize, filtersToUse);

      setLogs(response.logs);
      setPagination(response.pagination);
      
      if (filters !== undefined) {
        setCurrentFilters(filters);
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
      setLoading(false);
    }
  };

  const fetchLogsWithFilters = async (filters: LogFilters) => {
    await fetchLogs(1, undefined, filters);
  };

  const goToPage = async (page: number) => {
    if (page >= 1 && page <= pagination.totalPages && page !== pagination.currentPage) {
      await fetchLogs(page);
    }
  };

  const goToNextPage = async () => {
    if (pagination.hasNextPage) {
      await fetchLogs(pagination.currentPage + 1);
    }
  };

  const goToPrevPage = async () => {
    if (pagination.hasPrevPage) {
      await fetchLogs(pagination.currentPage - 1);
    }
  };

  const goToFirstPage = async () => {
    if (pagination.currentPage !== 1) {
      await fetchLogs(1);
    }
  };

  const goToLastPage = async () => {
    if (pagination.currentPage !== pagination.totalPages) {
      await fetchLogs(pagination.totalPages);
    }
  };

  const refreshCurrentPage = async () => {
    await fetchLogs(pagination.currentPage);
  };

  const fetchLogStats = async () => {
    if (!AuthManager.isAuthenticated()) {
      return;
    }

    try {
      setStatsLoading(true);
      setStatsError(null);
      
      const stats = await LogService.fetchLogStats();
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
    error,
    pagination,
    logStats,
    statsLoading,
    statsError,
    currentFilters,
    actions: {
      fetchLogs: () => fetchLogs(1),
      fetchLogsWithFilters: async (filters: LogFilters) => {
        await fetchLogsWithFilters(filters);
        await fetchLogStats();
      },
      fetchLogStats: () => fetchLogStats(),
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

export default useLogs;