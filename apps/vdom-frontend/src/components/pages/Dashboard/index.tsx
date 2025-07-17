import { h } from "preact";
import { useState, useEffect, useMemo } from "preact/hooks";
import { useLogs } from "../../../hooks/useLogs";
import { useApplicationNames } from "../../../hooks/useApplications";
import { convertFiltersToApiFormat } from "../../../utils/logUtils";
import { FilterState, Log } from "./types";
import { getDefaultDateFilters } from "../../../utils/dateUtils";

// Components
import { LogStatistics } from "./LogStats";
import { LogTable } from "./LogTable";
import { LogPagination } from "./LogPagination";
import LogFilter from "../../LogFilter/index";

import "ojs/ojbutton";
import "oj-c/progress-circle";

export const Dashboard = () => {
  const { logs, loading, dataLoading, error, pagination, logStats, statsLoading, statsError, currentFilters, currentSearchTerm, actions } = useLogs({ pageSize: 25 });
  const { applicationNames, loading: appNamesLoading, error: appNamesError } = useApplicationNames();
  const [applyingFilters, setApplyingFilters] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [filters, setFilters] = useState<FilterState>(() => {
    return {
      applications: [],
      logLevels: [],
      fromDate: null,
      toDate: null,
    };
  });

  useEffect(() => {
    actions.fetchLogs();
    actions.fetchLogStats();
  }, []);

  // Handle filter changes (excludes search - search is handled separately)
  const handleFilterChange = async (newFilters: FilterState) => {
    setFilters(newFilters);
    setApplyingFilters(true);
    
    try {
      const apiFilters = convertFiltersToApiFormat(newFilters);
      
      await actions.fetchLogsWithFilters(apiFilters, searchTerm);
      // await actions.fetchLogStats(searchTerm);
      
      console.log('Filters applied successfully:', newFilters);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setApplyingFilters(false);
    }
  };

  // Handle search changes (triggered automatically as user types)
  const handleSearchChange = async (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
    // console.log('Search term changed:', newSearchTerm);
    
    try {
      await actions.fetchLogsWithSearch(newSearchTerm);
      // await actions.fetchLogStats(newSearchTerm);
    } catch (error) {
      console.error('Error searching logs:', error);
    }
  };

  const handlePageChange = async (page: number) => {
    await actions.goToPage(page);
  };

  const handleFirstPage = async () => {
    await actions.goToFirstPage();
  };

  const handlePrevPage = async () => {
    await actions.goToPrevPage();
  };

  const handleNextPage = async () => {
    await actions.goToNextPage();
  };

  const handleLastPage = async () => {
    await actions.goToLastPage();
  };

  // Only show full page loading on initial load
  if (loading) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">Loading Logs data...</div>
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
            Error loading Logs data
          </div>
          <p class="oj-typography-body-md oj-sm-margin-2x-bottom">{error}</p>
          <oj-button class="oj-button-primary" onojAction={actions.refetch}>
            Retry
          </oj-button>
        </div>
      </div>
    );
  }

  return (
    <div class="oj-web-applayout-page" style="padding: 40px;">
      <h1 class="oj-typography-heading-lg" style="margin: 0;">
        Dashboard
      </h1>

      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 20px 0; font-size: 1.5rem; font-weight: 600; color: #374151;">
          Log Statistics Overview
        </h2>
        
        <LogStatistics
          logStats={logStats}
          statsLoading={statsLoading}
          statsError={statsError}
        />
      </div>

      <LogFilter
        onFilterChange={handleFilterChange}
        onSearchChange={handleSearchChange}
        initialFilters={filters}
        searchTerm={searchTerm}
        applications={applicationNames}
        applyingFilters={applyingFilters}
        defaultDates={getDefaultDateFilters()}
        showExport={true}
        showSearch={true}
      />
      
      {/* Pass dataLoading state to LogTable */}
      <LogTable
        logs={logs} 
        pagination={pagination}
        loading={dataLoading}
      />

      {/* Disable pagination controls during data loading */}
      <LogPagination
        pagination={pagination}
        onPageChange={handlePageChange}
        onFirstPage={handleFirstPage}
        onPrevPage={handlePrevPage}
        onNextPage={handleNextPage}
        onLastPage={handleLastPage}
        // disabled={dataLoading} 
      />
      
      {logs.length > 0 && (
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 0.875rem; color: #6b7280;">
          <p style="margin: 0;">
            {searchTerm.trim() ? (
              <>
                Showing {pagination.totalCount} logs matching "{searchTerm}" • 
                Page {pagination.currentPage} of {pagination.totalPages}
              </>
            ) : (
              <>
                Page {pagination.currentPage} of {pagination.totalPages} • 
                Total: {pagination.totalCount} logs
              </>
            )}
            • Last updated: {new Date().toLocaleTimeString()}
            {dataLoading && " • Updating..."}
          </p>
        </div>
      )}

      {/* No results message when search returns empty */}
      {searchTerm.trim() && logs.length === 0 && !loading && !dataLoading && (
        <div style="margin-top: 20px; padding: 20px; background: #fef3f2; border: 1px solid #fecaca; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #dc2626; font-weight: 500;">
            No logs found matching "{searchTerm}"
          </p>
          <p style="margin: 8px 0 0 0; color: #7f1d1d; font-size: 0.875rem;">
            Try adjusting your search term or applying different filters.
          </p>
        </div>
      )}
    </div>
  );
};