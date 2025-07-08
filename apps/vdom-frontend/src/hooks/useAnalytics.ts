import { useState, useEffect } from "preact/hooks";
import AnalyticsService from "../services/analyticsService";
import { AnalyticsData } from "../components/pages/Analytics/types";

export const useAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refetching, setRefetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async (isRefetch = false) => {
    try {
      if (isRefetch) {
        setRefetching(true);
        // Clear previous refetch errors
        if (analyticsData) {
          setError(null);
        }
      } else {
        setLoading(true);
      }
      const response = await AnalyticsService.fetchAnalytics();
      setAnalyticsData(response.data);
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
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchAnalytics(false);
  }, []);

  const refetch = () => fetchAnalytics(true);

  // Extract applications from analytics data
  const applications = analyticsData?.applicationCounts?.map(app => ({
    value: app._id,
    label: app.applicationName
  })) || [];

  return {
    analyticsData,
    loading,
    refetching,
    error,
    refetch,
    applications
  };
};
