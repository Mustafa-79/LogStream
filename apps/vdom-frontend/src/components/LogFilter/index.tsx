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
import { getDefaultDateFilters } from "../../utils/dateUtils";
import LogService from "../../services/logService";

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

/**
 * LogFilter Component
 * 
 * @param onFilterChange - Callback function called when filters change
 * @param initialFilters - Initial filter values (optional)
 * @param className - Additional CSS classes (optional)
 * @param applications - List of available applications for filtering (optional)
 * @param applyingFilters - Whether filters are currently being applied (optional)
 * @param defaultDates - Default date range for from/to inputs (optional)
 * @param showExport - Whether to show export functionality (optional, defaults to false)
 * 
 * Usage examples:
 * 
 * // With export functionality (dashboard)
 * <LogFilter showExport={true} defaultDates={getDefaultDateFilters()} />
 * 
 * // Without export functionality (other pages)
 * <LogFilter />
 */
const LogFilter = ({ 
  onFilterChange, 
  initialFilters = {}, 
  className = "", 
  applications = [], 
  applyingFilters = false, 
  defaultDates, 
  showExport = false 
}: LogFilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    applications: initialFilters.applications || [],
    logLevels: initialFilters.logLevels || [],
    fromDate: initialFilters.fromDate || (defaultDates?.fromDate || null),
    toDate: initialFilters.toDate || (defaultDates?.toDate || null),
  });
  
  const [exportFormat, setExportFormat] = useState<string>("csv");
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportMessage, setExportMessage] = useState<any[]>([]);

  // Create ArrayDataProviders dynamically based on props
  const applicationsDP = new ArrayDataProvider(applications, {
    keyAttributes: 'value'
  });

  const logLevelsDP = new ArrayDataProvider(logLevelsData, {
    keyAttributes: 'value'
  });

  // Convert arrays to Sets for oj-c-select-multiple (as per Oracle JET requirements)
  const [applicationsValue, setApplicationsValue] = useState<Set<string>>(new Set(initialFilters.applications || []));
  const [logLevelsValue, setLogLevelsValue] = useState<Set<string>>(new Set(initialFilters.logLevels || []));

  // Handle application filter changes
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

  // Handle log level filter changes
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

  // Handle from date change
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

  // Handle to date change
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

  // Handle export format change in modal
  const handleExportFormatChange = (event: any) => {
    setExportFormat(event.detail.value);
  };

  // Open export modal
  const openExportModal = () => {
    // Use Oracle JET dialog API to open
    const dialog = document.getElementById('export-dialog') as any;
    if (dialog) {
      dialog.open();
    }
  };

  // Close export modal
  const closeExportModal = () => {
    // Use Oracle JET dialog API to close
    const dialog = document.getElementById('export-dialog') as any;
    if (dialog) {
      dialog.close();
    }
  };

 

  // Clear all filters
  const clearAllFilters = () => {
    const emptySet = new Set<string>();
    setApplicationsValue(emptySet);
    setLogLevelsValue(emptySet);
    
    const defaultNewDates = defaultDates ? getDefaultDateFilters(): null;
    
    const newFilters: FilterState = {
      applications: [],
      logLevels: [],
      fromDate: defaultNewDates?.fromDate || null,
      toDate: defaultNewDates?.toDate || null,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters);
  };

  // Export logs functionality (called from modal)
  const handleExportLogs = async () => {
    setExporting(true);
    setExportMessage([]);
    closeExportModal(); // Close modal using API

    try {
      // Prepare filters for the service
      const exportFilters = {
        applications: filters.applications.length > 0 ? filters.applications : undefined,
        logLevels: filters.logLevels.length > 0 ? filters.logLevels : undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      };

      // Call the LogService export method
      const result = await LogService.exportLogs(exportFilters, exportFormat as 'csv' | 'json');
      
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
            min={filters.fromDate || undefined}
            max={new Date().toISOString()}
          ></oj-input-date-time>
        </div>
      </div>

      {/* Filter Summary */}
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <div class="oj-typography-body-sm" style="color: #6b7280;">
          <strong>Active Filters:</strong>
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
          {filters.applications.length === 0 &&
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
                {filters.applications.length === 0 &&
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