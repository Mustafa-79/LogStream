import { h } from "preact";
import { useMemo, useState } from "preact/hooks";
import { AnalyticsData } from "./types";
import PieChart from "./LogLevelPieChart";
import ApplicationBarChart from "./ApplicationBarChart";
import VolumeLineChart from "./VolumeLineChart";
import { useAnalytics } from "../../../hooks/useAnalytics";
import LogFilter from "../../LogFilter/index";
import { FilterState } from "../../LogFilter/types";
import "ojs/ojbutton";
import "oj-c/progress-circle";

export const Analytics = () => {
  const { analyticsData, loading, refetching, applyingFilters, error, refetch, applyFilters, applications, defaultDates } = useAnalytics();
  const [filters, setFilters] = useState<FilterState>({
    applications: [],
    logLevels: [],
    fromDate: null,
    toDate: null,
  });

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Apply filters to analytics data by calling the API
    applyFilters(newFilters);
  };

  // Simple memoization to prevent unnecessary chart re-renders when data hasn't changed
  const memoizedChartData = useMemo(() => {
    if (!analyticsData) return null;

    return {
      logLevelDistribution: analyticsData.logLevelDistribution,
      applicationCounts: analyticsData.applicationCounts,
      volumeTrend: analyticsData.volumeTrend
    };
  }, [analyticsData]);

  if (loading) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">Loading analytics data...</div>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <oj-c-progress-circle
              class="oj-sm-margin-4x-vertical oj-sm-padding-4x"
              aria-labelledby="lgLabel indetLabel"
              size="lg"
              value={-1}
            ></oj-c-progress-circle>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom" style={{ color: 'var(--oj-core-color-danger)' }}>
            Error loading analytics data
          </div>
          <p class="oj-typography-body-md oj-sm-margin-2x-bottom">{error}</p>
          <oj-button class="oj-button-primary" onojAction={refetch}>
            Retry
          </oj-button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">
            No analytics data available
          </div>
          <p class="oj-typography-body-md oj-sm-margin-2x-bottom">
            There is currently no data to display analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div class="oj-web-applayout-page" style="padding: 40px;">
      {/* Page Header */}
      <div class="oj-flex oj-justify-content-space-between oj-align-items-start" style="margin-bottom: 24px;">
        <div style="flex: 1;">
            <h1 class="oj-typography-heading-lg" style="margin: 0;">
            Analytics Dashboard
            </h1>
          <p class="oj-typography-body-md" style="color: #6b7280; margin-top: 4px;">
            Visualize log patterns, application performance, and system insights.
          </p>
        </div>
        <div style="flex-shrink: 0; margin-left: 16px;">
          <oj-button
            class="oj-button-outlined-chrome"
            onojAction={refetch}
            title="Refresh analytics data"
            disabled={refetching}
            style="border-radius: 8px;">
            <span slot="startIcon" class={refetching ? "oj-ux-ico-clock" : "oj-ux-ico-refresh"}></span>
            {refetching ? "Refreshing..." : "Refresh"}
          </oj-button>
        </div>
      </div>

      {/* Log Filter Component */}
      <LogFilter
        onFilterChange={handleFilterChange}
        initialFilters={filters}
        applications={applications}
        applyingFilters={applyingFilters}
        defaultDates={defaultDates}
      />


      {/* Charts Section */}
      <div class="oj-flex oj-sm-flex-direction-row oj-sm-margin-4x-bottom">
        <div class="oj-flex-item oj-panel oj-sm-margin-2x-end oj-sm-margin-2x-bottom oj-panel-shadow-md">
          <PieChart data={memoizedChartData?.logLevelDistribution || []} />
        </div>

        <div class="oj-flex-item oj-panel oj-sm-margin-2x-start oj-sm-margin-2x-bottom oj-panel-shadow-md">
          <ApplicationBarChart data={memoizedChartData?.applicationCounts || []} />
        </div>
      </div>

      <div class="oj-panel oj-panel-shadow-md">
        <VolumeLineChart data={memoizedChartData?.volumeTrend || []} />
      </div>
    </div>
  );
};