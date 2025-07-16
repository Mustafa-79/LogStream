import { useState, useEffect } from "preact/hooks";
import AnalyticsService from "../services/analyticsService";
import { AnalyticsData } from "../components/pages/Analytics/types";
import { FilterState } from "../components/LogFilter/types";
import { getDefaultDateFilters } from "../utils/dateUtils";

export const useAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [initialApplications, setInitialApplications] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [applyingFilters, setApplyingFilters] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterState | undefined>(undefined);
  const [defaultDates] = useState(() => getDefaultDateFilters()); // Calculate once and store

  const fetchAnalytics = async (filters?: FilterState, isFilterApply = false) => {
    try {
      if (isFilterApply) {
        setApplyingFilters(true);
        // Clear previous filter errors
        if (analyticsData) {
          setError(null);
        }
      } else {
        setLoading(true);
      }      const response = await AnalyticsService.fetchAnalytics(filters);
      setAnalyticsData(response.data);
      setCurrentFilters(filters);
      

      // Store initial applications list only on first load (when no application filters are applied)
      if (!isFilterApply) {
        setInitialApplications(response.data.applicationCounts.map(app => ({
          value: app._id,
          label: app.applicationName
        })));

        // for the application counts, remove entries with zero count
        response.data.applicationCounts = response.data.applicationCounts.filter(app => app.count > 0);

      }
      
      // Clear error on successful fetch
      setError(null);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      if (err instanceof Error && err.message === 'UNAUTHORIZED') {
        setError('Authentication required');
      } else {
        setError('Failed to fetch analytics data');
      }
    } finally {
      if (isFilterApply) {
        setApplyingFilters(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Create default filters with date range using the stored default dates
    const defaultFilters: FilterState = {
      applications: [],
      logLevels: [],
      fromDate: defaultDates.fromDate,
      toDate: defaultDates.toDate,
    };
    
    fetchAnalytics(defaultFilters, false);
  }, []);

  
  const applyFilters = (filters: FilterState) => {
    fetchAnalytics(filters, true);
  };

  const retry = () => {
    fetchAnalytics(currentFilters, false);
  };

  // Use initial applications list for dropdown (not filtered data)
  const applications = initialApplications;

  return {
    analyticsData,
    loading,
    applyingFilters,
    error,
    applyFilters,
    retry,
    applications,
    defaultDates
  };
};
