import { useState, useEffect, useRef } from "preact/hooks";
import LogService from "../services/logService";
import LogUtils, { LogCountsRecord } from "../utils/logUtils";
import { Log } from "../utils/applicationUtils";
import { AuthManager } from "../utils/auth";

interface UseLogsOptions {
  autoFetch?: boolean;
  onUnauthorized?: () => void;
}

export const useLogs = (options: UseLogsOptions = {}) => {
  const { autoFetch = true, onUnauthorized } = options;
  
  const [logs, setLogs] = useState<Log[]>([]);
  const [logCounts, setLogCounts] = useState<LogCountsRecord>({});
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const latestDateRef = useRef<string | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNewLogs = async () => {
    if (!AuthManager.isAuthenticated()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const newLogs = await LogService.fetchNewLogs(latestDateRef.current || undefined);
      
      if (newLogs.length > 0) {
        setLogs(prevLogs => {
          const mergedLogs = LogUtils.mergeLogs(prevLogs, newLogs);
          const counts = LogUtils.computeLogCounts(mergedLogs);
          setLogCounts(counts);
          return mergedLogs;
        });
        
        latestDateRef.current = LogUtils.getLatestLogDate(newLogs);
      }
    } catch (err) {
      console.error('Error fetching new logs:', err);
      
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        if (onUnauthorized) {
          onUnauthorized();
        }
        return;
      }
      
      setError('Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }

    const intervalId = setInterval(() => {
      if (!isPaused && AuthManager.isAuthenticated()) {
        fetchNewLogs();
      }
    }, LogService.getFetchInterval());

    intervalIdRef.current = intervalId;
  };

  const stopPolling = () => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  };

  const pausePolling = () => {
    setIsPaused(true);
  };

  const resumePolling = () => {
    setIsPaused(false);
  };

  const clearLogs = () => {
    setLogs([]);
    setLogCounts({});
    latestDateRef.current = null;
  };

  const refetch = () => {
    fetchNewLogs();
  };

  useEffect(() => {
    if (autoFetch && AuthManager.isAuthenticated()) {
      fetchNewLogs();
      startPolling();
    }

    return () => {
      stopPolling();
    };
  }, [autoFetch, isPaused]);

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    logs,
    logCounts,
    isPaused,
    loading,
    error,
    actions: {
      fetchNewLogs,
      startPolling,
      stopPolling,
      pausePolling,
      resumePolling,
      clearLogs,
      refetch
    }
  };
};

export default useLogs;