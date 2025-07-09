import { useState, useEffect } from "preact/hooks";
import AnalyticsService from "../services/analyticsService";
import { AnalyticsData } from "../components/pages/Analytics/types";
import { FilterState } from "../components/LogFilter/types";

export const useAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
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

  // Extract applications from analytics data
  const applications = analyticsData?.applicationCounts?.map(app => ({
    value: app._id,
    label: app.applicationName
  })) || [];

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
