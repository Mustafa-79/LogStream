import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { FilterState, LogFilterProps } from "./types";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import { IntlDateTimeConverter } from "ojs/ojconverter-datetime";
import "oj-c/select-multiple";
import "ojs/ojinputtext";
// import "ojs/ojinputdatetime";
import 'ojs/ojdatetimepicker';

import "ojs/ojformlayout";
import "ojs/ojbutton";
import "ojs/ojlabel";

// Default log levels
const LOG_LEVELS = ["DEBUG", "ERROR", "WARNING", "INFO"];

// Create data for ArrayDataProvider - following the sample pattern
const logLevelsData = LOG_LEVELS.map((level) => ({
  value: level,
  label: level
}));

// Create time converter
const timeFullConverter = new IntlDateTimeConverter({
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

const LogFilter = ({ onFilterChange, initialFilters = {}, className = "", applications = [] }: LogFilterProps) => {
  const [filters, setFilters] = useState<FilterState>({
    applications: initialFilters.applications || [],
    logLevels: initialFilters.logLevels || [],
    fromDate: initialFilters.fromDate || null,
    toDate: initialFilters.toDate || null,
  });

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
      onFilterChange(newFilters);
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
      onFilterChange(newFilters);
    }
  };

  // Handle from date change
  const handleFromDateChange = (event: any) => {
    const fromDate = event.detail.value;
    const newFilters = { ...filters, fromDate };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle to date change
  const handleToDateChange = (event: any) => {
    const toDate = event.detail.value;
    const newFilters = { ...filters, toDate };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Select all applications
  const selectAllApplications = () => {
    const allAppsSet = new Set(applications.map(app => app.value));
    setApplicationsValue(allAppsSet);
    const newFilters = { ...filters, applications: applications.map(app => app.value) };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all applications
  const clearAllApplications = () => {
    const emptySet = new Set<string>();
    setApplicationsValue(emptySet);
    const newFilters = { ...filters, applications: [] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Select all log levels
  const selectAllLogLevels = () => {
    const allLevelsSet = new Set(LOG_LEVELS);
    setLogLevelsValue(allLevelsSet);
    const newFilters = { ...filters, logLevels: [...LOG_LEVELS] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all log levels
  const clearAllLogLevels = () => {
    const emptySet = new Set<string>();
    setLogLevelsValue(emptySet);
    const newFilters = { ...filters, logLevels: [] };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const emptySet = new Set<string>();
    setApplicationsValue(emptySet);
    setLogLevelsValue(emptySet);
    const newFilters: FilterState = {
      applications: [],
      logLevels: [],
      fromDate: null,
      toDate: null,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Apply filters
  const applyFilters = () => {
    onFilterChange(filters);
  };

  return (
    <div class={`oj-panel oj-panel-shadow-sm ${className}`} style="padding: 20px; margin-bottom: 20px; border-radius: 8px;">
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
          >
            <span slot="startIcon" class="oj-ux-ico-filter"></span>
            Apply Filters
          </oj-button>

        </div>
      </div>

      {/* Filters in a single row (responsive) */}
      <div class="oj-flex oj-flex-wrap oj-sm-align-items-stretch oj-sm-flex-direction-row">
        {/* Applications Filter */}
        <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
          <oj-label for="applications-filter">
            Applications
          </oj-label>
          <oj-c-select-multiple
            id="applications-filter"
            label-hint="Select applications..."
            label-edge="inside"
            data={applicationsDP}
            value={applicationsValue}
            onvalueChanged={handleApplicationChange}
            item-text="label"
          />
          <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-2x-top">
            <oj-button
              class="oj-button-sm"
              onojAction={selectAllApplications}
            >
              Select All
            </oj-button>
            <oj-button
              class="oj-button-sm"
              onojAction={clearAllApplications}
            >
              Clear All
            </oj-button>
          </div>
        </div>

        {/* Log Levels Filter */}
        <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
          <oj-label for="log-levels-filter">
            Log Levels
          </oj-label>
          <oj-c-select-multiple
            id="log-levels-filter"
            label-hint="Select log levels..."
            label-edge="inside"
            data={logLevelsDP}
            value={logLevelsValue}
            onvalueChanged={handleLogLevelChange}
            item-text="label"
          />
          <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-2x-top">
            <oj-button
              class="oj-button-sm"
              onojAction={selectAllLogLevels}
            >
              Select All
            </oj-button>
            <oj-button
              class="oj-button-sm"
              onojAction={clearAllLogLevels}
            >
              Clear All
            </oj-button>
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
    </div>
  );

};

export default LogFilter;
