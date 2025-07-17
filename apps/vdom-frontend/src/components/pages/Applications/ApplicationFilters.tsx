import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { ApplicationFilters } from "./types";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import "oj-c/button";
import "oj-c/progress-circle";
import "oj-c/select-single";
import "ojs/ojinputtext";

interface ApplicationFiltersProps {
  searchQuery: string;
  filterStatus: string;
  currentFilters: ApplicationFilters;
  applyingFilters: boolean;
  onSearchChange: (event: any) => void;
  onFilterChange: (event: any) => void;
  onClearSearch: () => void;
}

export function ApplicationFiltersComponent({
  searchQuery,
  filterStatus,
  currentFilters,
  applyingFilters,
  onSearchChange,
  onFilterChange,
  onClearSearch
}: ApplicationFiltersProps) {
  const [statusFilterDP, setStatusFilterDP] = useState<any>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);

  useEffect(() => {
    const statusOptions = [
      { value: 'all', label: 'All Applications' },
      { value: 'active', label: 'Active Only' },
      { value: 'inactive', label: 'Inactive Only' }
    ];
    
    const dataProvider = new ArrayDataProvider(statusOptions, {
      keyAttributes: 'value'
    });
    
    setStatusFilterDP(dataProvider);
  }, []);

  // Handle search input with visual feedback
  const handleSearchInput = (event: any) => {
    const value = event.detail.value || '';
    
    // Clear previous timeout
    if (searchTimeout) {
      window.clearTimeout(searchTimeout);
    }
    
    // Show searching state
    setIsSearching(true);
    
    // Call parent handler (which includes debouncing)
    onSearchChange(event);
    
    // Clear searching state after delay
    const timeout = window.setTimeout(() => {
      setIsSearching(false);
    }, 600); // Slightly longer than search debounce
    
    setSearchTimeout(timeout);
  };

  const handleClearSearch = () => {
    // Clear timeout and searching state
    if (searchTimeout) {
      window.clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
    setIsSearching(false);
    
    // Call parent clear handler
    onClearSearch();
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        window.clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div class="oj-panel oj-panel-shadow-sm" style="margin-bottom: 24px; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; background: white;">
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center" style="margin-bottom: 16px;">
        <h3 style="margin: 0; color: #374151; font-size: 1.125rem; font-weight: 600;">
          Filter Applications
        </h3>
      </div>

      <div class="oj-flex oj-flex-wrap oj-sm-align-items-end" style="gap: 16px;">
        {/* Search input */}
        <div style="flex: 1; min-width: 250px;">
          <label for="search-applications-input" style="display: block; margin-bottom: 4px; color: #374151; font-weight: 500; font-size: 0.875rem;">
            Search Applications
          </label>
          <div class="oj-flex oj-sm-align-items-center">
            <oj-input-text
              id="search-applications-input"
              value={searchQuery}
              onvalueChanged={handleSearchInput}
              placeholder="Search by name or description..."
              style="flex: 1; margin-right: 8px;"
              disabled={isSearching}
            />
            {searchQuery && (
              <oj-button
                display="icons"
                chroming="borderless"
                onojAction={handleClearSearch}
                title="Clear Search"
                disabled={isSearching}
                style="padding: 4px; min-width: 24px; height: 24px;"
              >
                <span slot="startIcon" class="oj-ux-ico-close"></span>
              </oj-button>
            )}
            {isSearching && (
              <div style="margin-left: 8px; display: flex; align-items: center;">
                <oj-c-progress-circle
                  size="sm"
                  value={-1}
                  style="width: 20px; height: 20px;"
                ></oj-c-progress-circle>
              </div>
            )}
          </div>
          {searchQuery && !isSearching && (
            <div style="color: #6b7280; margin-top: 4px; font-size: 0.875rem;">
              Searching for: "{searchQuery}"
            </div>
          )}
          {isSearching && (
            <div style="color: #6b7280; margin-top: 4px; font-size: 0.875rem;">
              Searching...
            </div>
          )}
          <div style="color: #9ca3af; margin-top: 4px; font-size: 0.75rem; font-style: italic;">
            Search results appear automatically as you type
          </div>
        </div>

        {/* Status filter */}
        <div style="min-width: 150px;">
          <label for="status-filter" style="display: block; margin-bottom: 4px; color: #374151; font-weight: 500; font-size: 0.875rem;">
            Status
          </label>
          {statusFilterDP && (
            <oj-c-select-single
              id="status-filter"
              value={filterStatus}
              onvalueChanged={onFilterChange}
              data={statusFilterDP}
              item-text="label"
              label-hint="Filter by status"
              disabled={applyingFilters}
            />
          )}
        </div>
      </div>

      {/* Filter summary */}
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <div style="color: #6b7280; font-size: 0.875rem;">
          <strong>Active Filters:</strong>
          {searchQuery && (
            <span style="margin-left: 8px; white-space: pre;">
              Search: "{searchQuery}" {isSearching && "(searching...)"}
            </span>
          )}
          {currentFilters.active !== undefined && (
            <span style="margin-left: 8px;">
              Status: {currentFilters.active ? 'Active' : 'Inactive'}
            </span>
          )}
          {!searchQuery && currentFilters.active === undefined && (
            <span style="margin-left: 8px; font-style: italic;">No filters applied</span>
          )}
        </div>
      </div>
    </div>
  );
}