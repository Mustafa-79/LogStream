export interface FilterState {
  applications: string[];
  logLevels: string[];
  fromDate: string | null;
  toDate: string | null;
}

export interface LogFilterProps {
  onFilterChange: (filters: FilterState) => void;
  onSearchChange?: (searchTerm: string, filters?: any) => void;
  initialFilters?: Partial<FilterState>;
  searchTerm?: string;
  className?: string;
  applications?: Array<{ value: string; label: string }>;
  applyingFilters?: boolean;
  defaultDates?: {
    fromDate: string | null;
    toDate: string | null;
  };
  showExport?: boolean;
  showSearch?: boolean;
}

export interface DropdownOption {
  value: string;
  label: string;
}
