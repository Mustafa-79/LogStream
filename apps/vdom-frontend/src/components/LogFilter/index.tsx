import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { FilterState, LogFilterProps } from "./types";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import { IntlDateTimeConverter } from "ojs/ojconverter-datetime";
import "oj-c/select-multiple";
import "oj-c/select-single";
import "ojs/ojinputtext";
import 'ojs/ojdatetimepicker';
import "ojs/ojformlayout";
import "ojs/ojbutton";
import "ojs/ojlabel";
import "ojs/ojmessages";
import "ojs/ojdialog";
import { getDefaultDateFilters, calculateDRPMinDate } from "../../utils/dateUtils";
import LogService from "../../services/logService";
import SettingsService from "../../services/settingsService";
import { convertFiltersToApiFormat } from "../../utils/logUtils";

// Default log levels
const LOG_LEVELS = ["DEBUG", "ERROR", "WARNING", "INFO"];

// Export format options
const EXPORT_FORMATS = [
  { value: "csv", label: "CSV" },
  { value: "json", label: "JSON" }
];

// Create data for ArrayDataProvider - following the sample pattern
const logLevelsData = LOG_LEVELS.map((level) => ({
  value: level,
  label: level
}));

const exportFormatsDP = new ArrayDataProvider(EXPORT_FORMATS, {
  keyAttributes: 'value'
});

// Create time converter
const timeFullConverter = new IntlDateTimeConverter({
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit' 
});

interface UpdatedLogFilterProps extends LogFilterProps {
  onClearAll?: (filters: FilterState, searchTerm: string) => void;
}

const LogFilter = ({ 
  onFilterChange, 
  onSearchChange,
  onClearAll,
  initialFilters = {}, 
  searchTerm = "",
  className = "", 
  applications = [], 
  applyingFilters = false, 
  defaultDates, 
  showExport = false,
  showSearch = false
}: UpdatedLogFilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    applications: initialFilters.applications || [],
    logLevels: initialFilters.logLevels || [],
    fromDate: initialFilters.fromDate || (defaultDates?.fromDate || null),
    toDate: initialFilters.toDate || (defaultDates?.toDate || null),
  });
  
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<any[]>([]);

  const [localSearchTerm, setLocalSearchTerm] = useState<string>(searchTerm);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [drpMinDate, setDrpMinDate] = useState<string | null>(null);

  // Fetch DRP on component mount
  useEffect(() => {
    const fetchDRP = async () => {
      try {
        const drpDays = await SettingsService.fetchDRP();
        setDrpMinDate(calculateDRPMinDate(drpDays));
      } catch (error) {
        console.error('Error fetching DRP:', error);
        // If DRP fetch fails, set a default of 30 days
        setDrpMinDate(calculateDRPMinDate(30));
      }
    };

    fetchDRP();
  }, []);

  // Create ArrayDataProviders dynamically based on props
  const applicationsDP = new ArrayDataProvider(applications, {
    keyAttributes: 'value'
  });

  const logLevelsDP = new ArrayDataProvider(logLevelsData, {
    keyAttributes: 'value'
  });

  const [applicationsValue, setApplicationsValue] = useState<Set<string>>(new Set(initialFilters.applications || []));
  const [logLevelsValue, setLogLevelsValue] = useState<Set<string>>(new Set(initialFilters.logLevels || []));

  const handleSearchChange = (event: any) => {
    const value = event.detail.value || "";
    setLocalSearchTerm(value);
    
    if (searchTimeout) {
      window.clearTimeout(searchTimeout);
    }
    
    setIsSearching(true);
    
    const timeout = window.setTimeout(() => {
      if (onSearchChange) {
        // Convert current filter state to API format and pass with search
        const apiFilters = convertFiltersToApiFormat(filters);
        onSearchChange(value, apiFilters);
      }
      setIsSearching(false);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const clearSearch = () => {
    if (searchTimeout) {
      window.clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    
    setLocalSearchTerm("");
    setIsSearching(false);
    
    if (onSearchChange) {
      // When clearing search, also pass current filters
      const apiFilters = convertFiltersToApiFormat(filters);
      onSearchChange("", apiFilters);
    }
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        window.clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleApplicationChange = (event: any) => {
    const selectedKeys = event.detail.value;
    if (selectedKeys instanceof Set) {
      setApplicationsValue(selectedKeys);
      const selectedApps = Array.from(selectedKeys);
      const newFilters = { ...filters, applications: selectedApps };
      setFilters(newFilters);
    }
    if (!selectedKeys || selectedKeys.size === 0) {
      const newFilters = { ...filters, applications: [] };
      setFilters(newFilters);
    }
  };

  const handleLogLevelChange = (event: any) => {
    const selectedKeys = event.detail.value;
    if (selectedKeys instanceof Set) {
      setLogLevelsValue(selectedKeys);
      const selectedLevels = Array.from(selectedKeys);
      const newFilters = { ...filters, logLevels: selectedLevels };
      setFilters(newFilters);
    }

    if (!selectedKeys || selectedKeys.size === 0) {
      const newFilters = { ...filters, logLevels: [] };
      setFilters(newFilters);
    }
  };

  const handleFromDateChange = (event: any) => {
    const fromDate = event.detail.value;
    let isoFromDate = null;
    if (fromDate) {
      const dateObj = new Date(fromDate);
      dateObj.setMilliseconds(0);
      isoFromDate = dateObj.toISOString();
    }
    const newFilters = { ...filters, fromDate: isoFromDate };
    setFilters(newFilters);
  };

  const handleToDateChange = (event: any) => {
    const toDate = event.detail.value;
    let isoToDate = null;
    if (toDate) {
      const dateObj = new Date(toDate);
      dateObj.setMilliseconds(0);
      isoToDate = dateObj.toISOString();
    }
    const newFilters = { ...filters, toDate: isoToDate };
    setFilters(newFilters);
  };

  const handleExportFormatChange = (event: any) => {
    setExportFormat(event.detail.value);
  };

  const openExportModal = () => {
    const dialog = document.getElementById('export-dialog') as any;
    if (dialog) {
      dialog.open();
    }
  };

  const closeExportModal = () => {
    const dialog = document.getElementById('export-dialog') as any;
    if (dialog) {
      dialog.close();
    }
  };

  // Updated clearAllFilters function to prevent multiple API calls
  const clearAllFilters = () => {
    // Clear all timeouts first to prevent any pending operations
    if (searchTimeout) {
      window.clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }

    const emptySet = new Set<string>();
    const defaultNewDates = defaultDates ? getDefaultDateFilters(): null;
    
    const newFilters: FilterState = {
      applications: [],
      logLevels: [],
      fromDate: defaultNewDates?.fromDate || null,
      toDate: defaultNewDates?.toDate || null,
    };
    
    // Update all state in one batch to prevent multiple renders
    setApplicationsValue(emptySet);
    setLogLevelsValue(emptySet);
    setFilters(newFilters);
    
    if (showSearch) {
      setLocalSearchTerm("");
      setIsSearching(false);
    }

    // Use the combined callback if available to prevent multiple API calls
    if (onClearAll) {
      onClearAll(newFilters, "");
    } else {
      // Fallback: only call onFilterChange when onClearAll is NOT provided
      onFilterChange(newFilters);
    }
  };

  const applyFilters = () => {
    onFilterChange(filters);
  };

  // Export logs functionality (called from modal)
  const handleExportLogs = async () => {
    setExporting(true);
    setExportMessage([]);
    closeExportModal(); // Close modal using API

    try {
      // Prepare filters for the service - use current filter state
      const exportFilters = {
        applications: filters.applications.length > 0 ? filters.applications : undefined,
        logLevels: filters.logLevels.length > 0 ? filters.logLevels : undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      };

      // Call the LogService export method with search term
      const result = await LogService.exportLogs(exportFilters, exportFormat as 'csv' | 'json', localSearchTerm);
      
      setExportMessage([{
        severity: 'confirmation',
        summary: 'Export Initiated',
        detail: result.message || `Log export request submitted successfully in ${exportFormat.toUpperCase()} format. You will receive an email when the export is complete.`,
        timestamp: new Date().toISOString(),
        autoTimeout: 8000
      }]);

    } catch (error: any) {
      console.error('Export error:', error);
      
      // Handle specific error types
      let errorMessage = 'Failed to initiate log export. Please try again.';
      if (error.message === 'UNAUTHORIZED') {
        errorMessage = 'Your session has expired. Please log in again.';
      } else if (error.message && error.message !== 'UNAUTHORIZED') {
        errorMessage = error.message;
      }
      
      setExportMessage([{
        severity: 'error',
        summary: 'Export Failed',
        detail: errorMessage,
        timestamp: new Date().toISOString(),
        autoTimeout: 8000
      }]);
    } finally {
      setExporting(false);
    }
  };

  // Auto-hide messages after timeout
  useEffect(() => {
    if (exportMessage.length > 0) {
      const timer = setTimeout(() => {
        setExportMessage([]);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [exportMessage]);

  // Update local search term when prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  return (
    <div class={`oj-panel oj-panel-shadow-sm ${className}`} style="padding: 20px; margin-bottom: 20px; border-radius: 8px;">
      {/* Export Messages */}
      {exportMessage.length > 0 && (
        <div style="margin-bottom: 16px;">
          <oj-messages
            messages={exportMessage}
          ></oj-messages>
        </div>
      )}

      {/* Header and Action Buttons */}
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center" style="margin-bottom: 16px;">
        <h3 style="margin: 0; color: #374151; font-size: 1.125rem; font-weight: 600;">
          Filter Logs
        </h3>
        <div class="oj-flex oj-sm-align-items-center">
          <oj-button
            class="oj-button-sm oj-button-outlined-chrome"
            onojAction={clearAllFilters}
          >
            <span slot="startIcon" class="oj-ux-ico-eraser"></span>
            Clear All
          </oj-button>

          <oj-button
            class="oj-button-sm oj-button-primary"
            onojAction={applyFilters}
            style="margin-left: 8px;"
            disabled={applyingFilters}
          >
            <span slot="startIcon" class={applyingFilters ? "oj-ux-ico-clock" : "oj-ux-ico-filter"}></span>
            {applyingFilters ? "Applying..." : "Apply Filters"}
          </oj-button>

          {/* Export Button - Only show if showExport is true */}
          {showExport && (
            <oj-button
              class="oj-button-sm oj-button-outlined-chrome"
              onojAction={openExportModal}
              style="margin-left: 8px;"
              disabled={exporting}
            >
              <span slot="startIcon" class={exporting ? "oj-ux-ico-clock" : "oj-ux-ico-download"}></span>
              {exporting ? "Exporting..." : "Export Logs"}
            </oj-button>
          )}
        </div>
      </div>

      {/* Search Bar - Only show if showSearch is true */}
      {showSearch && (
        <div style="margin-bottom: 20px;">
          <oj-label for="search-logs-input">
            Search Messages
          </oj-label>
          <div class="oj-flex oj-sm-align-items-center">
            <oj-input-text
              id="search-logs-input"
              value={localSearchTerm}
              onvalueChanged={handleSearchChange}
              placeholder="Search in log messages..."
              label-hint="Type to search log messages"
              style="flex: 1; margin-right: 8px;"
              disabled={isSearching}
            />
          </div>
          {isSearching && (
            <div class="oj-typography-body-sm" style="color: #6b7280; margin-top: 4px;">
              Searching...
            </div>
          )}
        </div>
      )}

      <div class="oj-flex oj-flex-wrap oj-sm-align-items-stretch oj-sm-flex-direction-row">
        {/* Applications Filter */}
        <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
          <oj-label for="applications-filter">
            Applications
          </oj-label>
          <div class="oj-flex oj-sm-align-items-center">
            <oj-c-select-multiple
              id="applications-filter"
              label-hint="Select applications..."
              label-edge="inside"
              data={applicationsDP}
              value={applicationsValue}
              onvalueChanged={handleApplicationChange}
              item-text="label"
              style="flex: 1; margin-right: 8px;"
            />

          </div>
        </div>

        {/* Log Levels Filter */}
        <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
          <oj-label for="log-levels-filter">
            Log Levels
          </oj-label>
          <div class="oj-flex oj-sm-align-items-center">
            <oj-c-select-multiple
              id="log-levels-filter"
              label-hint="Select log levels..."
              label-edge="inside"
              data={logLevelsDP}
              value={logLevelsValue}
              onvalueChanged={handleLogLevelChange}
              item-text="label"
              style="flex: 1; margin-right: 8px;"
            />

          </div>
        </div>

        {/* From Date */}
        <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
          <oj-label for="from-date-filter">
            From Date & Time
          </oj-label>
          <oj-input-date-time
            id="from-date-filter"
            value={filters.fromDate || undefined}
            onvalueChanged={handleFromDateChange}
            converter={timeFullConverter}
            label-hint="Select from date and time"
            min={drpMinDate || undefined}
            max={filters.toDate || new Date().toISOString()}
            
          ></oj-input-date-time>
        </div>

        {/* To Date */}
        <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
          <oj-label for="to-date-filter">
            To Date & Time
          </oj-label>
          <oj-input-date-time
            id="to-date-filter"
            value={filters.toDate || undefined}
            onvalueChanged={handleToDateChange}
            converter={timeFullConverter}
            label-hint="Select to date and time"
            min={drpMinDate && filters.fromDate ? (new Date(filters.fromDate) > new Date(drpMinDate) ? filters.fromDate : drpMinDate) : (filters.fromDate || drpMinDate || undefined)}
            max={new Date().toISOString()}
          ></oj-input-date-time>
        </div>
      </div>

      {/* Filter Summary */}
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <div class="oj-typography-body-sm" style="color: #6b7280;">
          <strong>Active Filters:</strong>
          {showSearch && localSearchTerm && (
            <span style="margin-left: 8px; white-space: pre;">
              Search: "{localSearchTerm}" {isSearching && "(searching...)"}
            </span>
          )}
          {filters.applications.length > 0 && (
            <span style="margin-left: 8px;">
              Apps: {filters.applications.length} selected
            </span>
          )}
          {filters.logLevels.length > 0 && (
            <span style="margin-left: 8px;">
              Levels: {filters.logLevels.length} selected
            </span>
          )}
          {filters.fromDate && (
            <span style="margin-left: 8px;">
              From: {new Date(filters.fromDate).toLocaleDateString()}
            </span>
          )}
          {filters.toDate && (
            <span style="margin-left: 8px;">
              To: {new Date(filters.toDate).toLocaleDateString()}
            </span>
          )}
          {(!showSearch || !localSearchTerm) &&
            filters.applications.length === 0 &&
            filters.logLevels.length === 0 &&
            !filters.fromDate &&
            !filters.toDate && (
              <span style="margin-left: 8px; font-style: italic;">No filters applied</span>
            )}
        </div>
      </div>

      {/* Export Modal */}
      <oj-dialog
        id="export-dialog"
        dialog-title="Export Logs"
        modality="modal"
        onojClose={closeExportModal}
        style="width: 400px;"
      >
        <div slot="body">
          <div style="padding: 20px;">
            <p style="margin-bottom: 20px; color: #374151;">
              Select the format for your log export:
            </p>
            
            <oj-label for="export-format-select">
              Export Format
            </oj-label>
            <oj-c-select-single
              id="export-format-select"
              label-hint="Choose export format..."
              label-edge="inside"
              data={exportFormatsDP}
              value={exportFormat}
              onvalueChanged={handleExportFormatChange}
              item-text="label"
              style="width: 100%; margin-bottom: 20px;"
            />

            <div style="margin-top: 20px; padding: 12px; background-color: #f3f4f6; border-radius: 6px;">
              <div class="oj-typography-body-sm" style="color: #6b7280;">
                <strong>Export will include:</strong>
                {localSearchTerm && (
                  <div>• Search: "{localSearchTerm}"</div>
                )}
                {filters.applications.length > 0 && (
                  <div>• Applications: {filters.applications.length} selected</div>
                )}
                {filters.logLevels.length > 0 && (
                  <div>• Log Levels: {filters.logLevels.length} selected</div>
                )}
                {filters.fromDate && (
                  <div>• From: {new Date(filters.fromDate).toLocaleString()}</div>
                )}
                {filters.toDate && (
                  <div>• To: {new Date(filters.toDate).toLocaleString()}</div>
                )}
                {!localSearchTerm &&
                  filters.applications.length === 0 &&
                  filters.logLevels.length === 0 &&
                  !filters.fromDate &&
                  !filters.toDate && (
                    <div style="font-style: italic;">• All available logs</div>
                  )}
              </div>
            </div>
          </div>
        </div>
        
        <div slot="footer">
          <div class="oj-flex oj-sm-justify-content-flex-end" style="gap: 8px;">
            <oj-button
              class="oj-button-sm oj-button-outlined-chrome"
              onojAction={closeExportModal}
            >
              Cancel
            </oj-button>
            <oj-button
              class="oj-button-sm oj-button-primary"
              onojAction={handleExportLogs}
              disabled={exporting}
            >
              <span slot="startIcon" class={exporting ? "oj-ux-ico-clock" : "oj-ux-ico-download"}></span>
              {exporting ? "Exporting..." : "Export"}
            </oj-button>
          </div>
        </div>
      </oj-dialog>
    </div>
  );
};

export default LogFilter;