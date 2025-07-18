import "ojs/ojbutton";
import "ojs/ojinputsearch";
import "oj-c/select-multiple";

interface UserGroupFiltersProps {
  searchTerm: string;
  selectedStatuses: Set<string>;
  selectedApplications: Set<string>;
  statusDataProvider: any;
  applicationDataProvider: any;
  isSearching: boolean;
  loading: boolean;
  onSearchChange: (event: any) => void;
  onStatusFilterChange: (event: any) => void;
  onApplicationFilterChange: (event: any) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;
}

export function UserGroupFilters({
  searchTerm,
  selectedStatuses,
  selectedApplications,
  statusDataProvider,
  applicationDataProvider,
  isSearching,
  loading,
  onSearchChange,
  onStatusFilterChange,
  onApplicationFilterChange,
  onSearchSubmit,
  onClearSearch
}: UserGroupFiltersProps) {
  return (
    <div class="oj-panel oj-panel-shadow-sm" style="padding: 20px; margin-bottom: 20px; border-radius: 8px;">
      {/* Header and Action Buttons */}
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-align-items-center" style="margin-bottom: 16px;">
        <h3 style="margin: 0; color: #374151; font-size: 1.125rem; font-weight: 600;">
          Filter User Groups
        </h3>
        <div class="oj-flex oj-sm-align-items-center">
          <oj-button
            class="oj-button-sm oj-button-outlined-chrome"
            onojAction={onClearSearch}
            disabled={loading || isSearching}
          >
            <span slot="startIcon" class="oj-ux-ico-eraser"></span>
            Clear All
          </oj-button>

          <oj-button
            class="oj-button-sm oj-button-primary"
            onojAction={onSearchSubmit}
            style="margin-left: 8px;"
            disabled={loading || isSearching}
          >
            <span slot="startIcon" class={isSearching ? "oj-ux-ico-clock" : "oj-ux-ico-filter"}></span>
            {isSearching ? "Searching..." : "Apply Filters"}
          </oj-button>
        </div>
      </div>

      <div class="oj-flex oj-flex-wrap oj-sm-align-items-stretch oj-sm-flex-direction-row">
        {/* Search Input */}
        <div class="oj-flex-item oj-sm-12 oj-md-6 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
          <oj-label for="search-input">
            Search by name
          </oj-label>
          <oj-input-search
            id="search-input"
            value={searchTerm}
            placeholder="Search user groups..."
            onvalueChanged={onSearchChange}
            style="min-height: 40px;"
          ></oj-input-search>
        </div>

        {/* Status Filter */}
        <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
          <oj-label for="status-filter">
            Status
          </oj-label>
          <div class="oj-flex oj-sm-align-items-center">
            <oj-c-select-multiple
              id="status-filter"
              value={selectedStatuses}
              label-hint="Select status..."
              label-edge="inside"
              onvalueChanged={onStatusFilterChange}
              data={statusDataProvider}
              item-text="label"
              style="flex: 1; margin-right: 8px; min-height: 40px;"
            ></oj-c-select-multiple>
          </div>
        </div>

        {/* Application Filter */}
        <div class="oj-flex-item oj-sm-12 oj-md-3 oj-sm-padding-2x-horizontal oj-sm-padding-2x-bottom">
          <oj-label for="application-filter">
            Applications
          </oj-label>
          <div class="oj-flex oj-sm-align-items-center">
            <oj-c-select-multiple
              id="application-filter"
              value={selectedApplications}
              label-hint="Select applications..."
              label-edge="inside"
              onvalueChanged={onApplicationFilterChange}
              data={applicationDataProvider}
              item-text="label"
              style="flex: 1; margin-right: 8px; min-height: 40px;"
            ></oj-c-select-multiple>
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <div class="oj-typography-body-sm" style="color: #6b7280;">
          <strong>Active Filters:</strong>
          {searchTerm && (
            <span style="margin-left: 8px; white-space: pre;">
              Search: "{searchTerm}"
            </span>
          )}
          {(selectedStatuses.size === 0 || selectedStatuses.size === 2) ? (
            <span style="margin-left: 8px;">
              Status: All
            </span>
          ) : (
            <span style="margin-left: 8px;">
              Status: {Array.from(selectedStatuses).join(', ')}
            </span>
          )}
          {selectedApplications.size > 0 && (
            <span style="margin-left: 8px;">
              Apps: {selectedApplications.size} selected
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
