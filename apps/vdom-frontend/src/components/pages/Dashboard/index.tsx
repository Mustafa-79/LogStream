import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import MutableArrayDataProvider = require('ojs/ojmutablearraydataprovider');
import { DropdownOption, FilterState } from "../../LogFilter/types";
import LogFilter from "../../LogFilter/index";
import useLogs from "../../../hooks/useLogs";
import { getDefaultDateFilters } from "../../../utils/dateUtils";

import 'oj-c/table';
import "ojs/ojbutton";
import "oj-c/progress-circle";
import "ojs/ojpagingcontrol";
import "oj-c/action-card";
import { useApplicationNames } from "../../../hooks/useApplications";

interface TableLog {
  id: string;
  timestamp: string;
  logLevel: string;
  sourceApp: string;
  message: string;
  traceId: string;
}

interface LogFilters {
  applications?: string[];
  logLevels?: string[];
  fromDate?: string;
  toDate?: string;
}

type SortDirection = 'asc' | 'desc' | null;
type SortableColumn = 'timestamp' | 'logLevel' | 'sourceApp' | 'traceId' | 'message';

export const Dashboard = () => {
  const { logs, loading, error, pagination, logStats, statsLoading, statsError, currentFilters, actions } = useLogs({ pageSize: 25 });
  const { applicationNames, loading: appNamesLoading, error: appNamesError } = useApplicationNames();
  const [sortColumn, setSortColumn] = useState<SortableColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [dataProvider, setDataProvider] = useState<any>(null);
  const [applyingFilters, setApplyingFilters] = useState<boolean>(false);

  // Initialize filters with default dates for better UX
  const [filters, setFilters] = useState<FilterState>(() => {
    const defaultDates = getDefaultDateFilters();
    return {
      applications: [],
      logLevels: [],
      fromDate: defaultDates?.fromDate || null,
      toDate: defaultDates?.toDate || null,
    };
  });

  useEffect(() => {
    actions.fetchLogs();
    actions.fetchLogStats();
  }, []);

  const convertFiltersToApiFormat = (filterState: FilterState): LogFilters => {
    const apiFilters: LogFilters = {};

    if (filterState.applications.length > 0) {
      apiFilters.applications = filterState.applications;
    }

    if (filterState.logLevels.length > 0) {
      apiFilters.logLevels = filterState.logLevels;
    }

    // Add date filters
    if (filterState.fromDate) {
      apiFilters.fromDate = filterState.fromDate;
    }

    if (filterState.toDate) {
      apiFilters.toDate = filterState.toDate;
    }

    return apiFilters;
  };

  const handleFilterChange = async (newFilters: FilterState) => {
    setFilters(newFilters);
    setApplyingFilters(true);
    
    try {
      const apiFilters = convertFiltersToApiFormat(newFilters);
      
      await actions.fetchLogsWithFilters(apiFilters);
      
      console.log('Filters applied successfully:', newFilters);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setApplyingFilters(false);
    }
  };

  const formatTimestamp = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const handleSort = (column: SortableColumn) => {
    if (sortColumn === column) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Create custom header text with sorting icons
  const createHeaderText = (text: string, column: SortableColumn) => {
    let icon: string;
    
    if (sortColumn === column && sortDirection) {
      icon = sortDirection === 'asc' ? ' ▲' : ' ▼';
    } else {
      icon = ' ⇅';
    }
    
    return text + icon;
  };

  // Sort the data based on current sort state
  const sortData = (data: TableLog[]): TableLog[] => {
    if (!sortColumn || !sortDirection) {
      return data;
    }

    return [...data].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortColumn) {
        case 'timestamp':
          aVal = a.timestamp;
          bVal = b.timestamp;
          break;
        case 'logLevel':
          aVal = a.logLevel.toLowerCase();
          bVal = b.logLevel.toLowerCase();
          break;
        case 'sourceApp':
          aVal = a.sourceApp.toLowerCase();
          bVal = b.sourceApp.toLowerCase();
          break;
        case 'traceId':
          aVal = (a.traceId || '').toLowerCase();
          bVal = (b.traceId || '').toLowerCase();
          break;
        case 'message':
          aVal = a.message.toLowerCase();
          bVal = b.message.toLowerCase();
          break;
        default:
          return 0;
      }

      if (aVal < bVal) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Update data provider when logs or sorting changes
  useEffect(() => {
    if (logs.length > 0) {
      const tableData: TableLog[] = logs.map((log, index) => ({
        id: log._id || index.toString(),
        timestamp: formatTimestamp(log.date),
        logLevel: log.logLevel,
        traceId: log.traceId || 'N/A',
        sourceApp: log.sourceApp || 'Unknown',
        message: log.message,
      }));

      const sortedData = sortData(tableData);
      
      const newDataProvider = new MutableArrayDataProvider<string, TableLog>(
        sortedData,
        { 
          keyAttributes: 'id'
        }
      );
      
      setDataProvider(newDataProvider);
    } else {
      setDataProvider(null);
    }
  }, [logs, sortColumn, sortDirection]);

  // Add click handlers to headers after table renders
  useEffect(() => {
    const timer = setTimeout(() => {
      const table = document.getElementById('logsTable');
      if (table) {
        const headerCells = table.querySelectorAll('th');
        
        headerCells.forEach((cell, index) => {
          const columnNames: SortableColumn[] = ['timestamp', 'logLevel', 'sourceApp', 'traceId', 'message'];
          const column = columnNames[index];
          
          if (column && cell) {
            const newCell = cell.cloneNode(true) as HTMLElement;
            cell.parentNode?.replaceChild(newCell, cell);
            
            newCell.addEventListener('click', () => {
              console.log('Header clicked:', column);
              handleSort(column);
            });
            
            newCell.style.cursor = 'pointer';
            newCell.style.userSelect = 'none';
          }
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [dataProvider, sortColumn, sortDirection]);

  const columns = {
    timestamp: {
      headerText: createHeaderText("Timestamp", "timestamp"),
      field: "timestamp",
      headerClassName: "oj-sm-only-hide",
      className: "oj-sm-only-hide",
      resizable: "enabled"
    },
    logLevel: {
      headerText: createHeaderText("Log Level", "logLevel"),
      field: "logLevel", 
      resizable: "enabled"
    },
    sourceApp: {
      headerText: createHeaderText("Source Application", "sourceApp"),
      field: "sourceApp",
      headerClassName: "oj-md-down-hide",
      className: "oj-md-down-hide", 
      resizable: "enabled"
    },
    traceId: {
      headerText: createHeaderText("Trace ID", "traceId"),
      field: "traceId",
      headerClassName: "oj-lg-down-hide",
      className: "oj-lg-down-hide", 
      resizable: "enabled"
    },
    message: {
      headerText: createHeaderText("Message", "message"),
      field: "message",
      resizable: "enabled"
    }
  };

  const scrollPolicyOptions = {
    fetchSize: 10
  };

  // Pagination handlers
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

  // Generate page numbers for pagination
  const getVisiblePageNumbers = () => {
    const { currentPage, totalPages } = pagination;
    const visiblePages: number[] = [];
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        visiblePages.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      let startPage = Math.max(1, currentPage - halfVisible);
      let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        visiblePages.push(i);
      }
    }
    
    return visiblePages;
  };

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
      {/* Page Header */}
      <div class="oj-flex oj-justify-content-space-between oj-align-items-start" style="margin-bottom: 24px;">
        <div style="flex: 1;">
          <h1 class="oj-typography-heading-lg" style="margin: 0;">
            Dashboard
          </h1>
          <p class="oj-typography-body-md" style="color: #6b7280; margin-top: 4px;">
            Monitor system activity, view log statistics, and track application performance.
          </p>
        </div>
      </div>

      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 20px 0; font-size: 1.5rem; font-weight: 600; color: #374151;">
          Log Statistics Overview
        </h2>
        
        {statsLoading ? (
          <div class="oj-flex oj-sm-justify-content-center oj-sm-padding-4x">
            <oj-c-progress-circle size="sm" value={-1}></oj-c-progress-circle>
            <span class="oj-typography-body-md oj-sm-margin-2x-start">Loading statistics...</span>
          </div>
        ) : logStats ? (
          <div class="oj-flex oj-flex-wrap oj-sm-align-items-stretch oj-sm-flex-direction-row">
            <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-1x-horizontal oj-sm-padding-2x-bottom">
              <oj-c-action-card
                style="cursor: default; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); height: 100%; width: 100%;"
              >
                <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div class="oj-typography-heading-xs" style="color: #000; margin-bottom: 8px;">
                      Total Logs
                    </div>
                    <div class="oj-typography-heading-lg" style="color: #1f2937; font-weight: 700;">
                      {logStats.totalCount}
                    </div>
                    <div class="oj-typography-body-m" style="color: #6b7280; font-weight: 700;">
                      Results
                    </div>
                  </div>
                </div>
              </oj-c-action-card>
            </div>

            <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-1x-horizontal oj-sm-padding-2x-bottom">
              <oj-c-action-card
                style="background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); height: 100%; width: 100%;"
              >
                <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div class="oj-typography-heading-xs" style="color: #000; margin-bottom: 8px;">
                      Error Logs
                    </div>
                    <div class="oj-typography-heading-lg" style="color: #dc2626; font-weight: 700;">
                      {logStats.errorCount}
                    </div>
                    <div class="oj-typography-body-m" style="color: #6b7280; font-weight: 700;">
                      Critical issues
                    </div>
                  </div>
                </div>
              </oj-c-action-card>
            </div>

            <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-1x-horizontal oj-sm-padding-2x-bottom">
              <oj-c-action-card
                style="background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); height: 100%; width: 100%;"
              >
                <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div class="oj-typography-heading-xs" style="color: #000; margin-bottom: 8px;">
                      Warning Logs
                    </div>
                    <div class="oj-typography-heading-lg" style="color: #f59e0b; font-weight: 700;">
                      {logStats.warningCount}
                    </div>
                    <div class="oj-typography-body-m" style="color: #6b7280; font-weight: 700;">
                      Potential issues
                    </div>
                  </div>
                </div>
              </oj-c-action-card>
            </div>

            <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-1x-horizontal oj-sm-padding-2x-bottom">
              <oj-c-action-card
                style="background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); height: 100%; width: 100%;"
              >
                <div style="padding: 20px; display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <div class="oj-typography-heading-xs" style="color: #000; margin-bottom: 8px;">
                      Info & Debug Logs
                    </div>
                    <div class="oj-typography-heading-lg" style="color: #3b82f6; font-weight: 700;">
                      {logStats.infoCount + logStats.debugCount}
                    </div>
                    <div class="oj-typography-body-m" style="color: #6b7280; font-weight: 700;">
                      Informational logs
                    </div>
                  </div>
                </div>
              </oj-c-action-card>
            </div>
          </div>
        ) : (
          <div style="padding: 20px; text-align: center; color: #6b7280; background: #f9fafb; border-radius: 8px;">
            <p style="margin: 0;">No statistics available</p>
          </div>
        )}
      </div>

      {/* LogFilter with Export functionality enabled */}
      <LogFilter
        onFilterChange={handleFilterChange}
        initialFilters={filters}
        applications={applicationNames}
        applyingFilters={applyingFilters}
        defaultDates={getDefaultDateFilters()}
        showExport={true}
      />
      
      <div style="background: white; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); overflow: hidden;">
        <div style="padding: 20px; border-bottom: 1px solid #e5e7eb;">
          <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #374151;">
            Total Application Logs ({pagination.totalCount})
          </h2>
        </div>
        
        {logs.length === 0 ? (
          <div style="padding: 40px; text-align: center; color: #6b7280;">
            <p style="margin: 0; font-size: 1rem;">No logs available</p>
          </div>
        ) : dataProvider ? (
          <div style="padding: 20px;">
            <oj-c-table
              id="logsTable"
              aria-label="Application Logs Table"
              data={dataProvider}
              columns={columns}
              scrollPolicyOptions={scrollPolicyOptions}
              class="demo-table-container"
              style="width: 100%; min-height: 400px;"
            ></oj-c-table>
          </div>
        ) : null}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div style="padding: 20px; border-top: 1px solid #e5e7eb; background: #f9fafb;">
            <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center">
              <div class="oj-typography-body-sm" style="color: #6b7280;">
                Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of {pagination.totalCount} entries
              </div>
              
              <div class="oj-flex oj-sm-align-items-center" style="gap: 8px;">
                <oj-button
                  class="oj-button-outlined-chrome"
                  disabled={!pagination.hasPrevPage}
                  onojAction={handleFirstPage}
                  style="min-width: auto; padding: 8px 12px;"
                >
                  <span class="oj-typography-body-sm">First</span>
                </oj-button>
                
                <oj-button
                  class="oj-button-outlined-chrome"
                  disabled={!pagination.hasPrevPage}
                  onojAction={handlePrevPage}
                  style="min-width: auto; padding: 8px 12px;"
                >
                  <span class="oj-typography-body-sm">‹ Prev</span>
                </oj-button>
                
                {getVisiblePageNumbers().map((pageNum) => (
                  <oj-button
                    key={pageNum}
                    class={pageNum === pagination.currentPage ? "oj-button-primary" : "oj-button-outlined-chrome"}
                    onojAction={() => handlePageChange(pageNum)}
                    style="min-width: 40px; padding: 8px 12px;"
                  >
                    <span class="oj-typography-body-sm">{pageNum}</span>
                  </oj-button>
                ))}
                
                <oj-button
                  class="oj-button-outlined-chrome"
                  disabled={!pagination.hasNextPage}
                  onojAction={handleNextPage}
                  style="min-width: auto; padding: 8px 12px;"
                >
                  <span class="oj-typography-body-sm">Next ›</span>
                </oj-button>
                
                <oj-button
                  class="oj-button-outlined-chrome"
                  disabled={!pagination.hasNextPage}
                  onojAction={handleLastPage}
                  style="min-width: auto; padding: 8px 12px;"
                >
                  <span class="oj-typography-body-sm">Last</span>
                </oj-button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {logs.length > 0 && (
        <div style="margin-top: 20px; padding: 16px; background: #f9fafb; border-radius: 8px; font-size: 0.875rem; color: #6b7280;">
          <p style="margin: 0;">
            Page {pagination.currentPage} of {pagination.totalPages} • 
            Last updated: {new Date().toLocaleTimeString()} •
            {sortColumn && sortDirection && (
              <span> Sorted by {sortColumn} ({sortDirection === 'asc' ? 'ascending' : 'descending'})</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};