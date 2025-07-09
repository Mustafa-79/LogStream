import { useState, useEffect } from "preact/hooks";
import AnalyticsService from "../services/analyticsService";
import { AnalyticsData } from "../components/pages/Analytics/types";
import { FilterState } from "../components/LogFilter/types";

export const useAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [initialApplications, setInitialApplications] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refetching, setRefetching] = useState<boolean>(false);
  const [applyingFilters, setApplyingFilters] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<FilterState | undefined>(undefined);

  const fetchAnalytics = async (filters?: FilterState, isRefetch = false, isFilterApply = false) => {
    try {
      if (isRefetch) {
        setRefetching(true);
        // Clear previous refetch errors
        if (analyticsData) {
          setError(null);
        }
      } else if (isFilterApply) {
        setApplyingFilters(true);
        // Clear previous filter errors
        if (analyticsData) {
          setError(null);
        }
      } else {
        setLoading(true);
      }
      
      const response = await AnalyticsService.fetchAnalytics(filters);
      setAnalyticsData(response.data);
      setCurrentFilters(filters);
      
      // Store initial applications list only on first load (no filters)
      if (!filters && response.data.applicationCounts) {
        const apps = response.data.applicationCounts.map(app => ({
          value: app._id,
          label: app.applicationName
        }));
        setInitialApplications(apps);
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
      if (isRefetch) {
        setRefetching(false);
      } else if (isFilterApply) {
        setApplyingFilters(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAnalytics(undefined, false);
  }, []);

  const refetch = () => fetchAnalytics(currentFilters, true, false);
  
  const applyFilters = (filters: FilterState) => {
    fetchAnalytics(filters, false, true);
  };

  // Use initial applications list for dropdown (not filtered data)
  const applications = initialApplications;

  return {
    analyticsData,
    loading,
    refetching,
    applyingFilters,
    error,
    refetch,
    applyFilters,
    applications
  };
};
