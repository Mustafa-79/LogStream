export interface FilterState {
  applications: string[];
  logLevels: string[];
  fromDate: string | null;
  toDate: string | null;
}

export interface LogFilterProps {
  onFilterChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
  className?: string;
  applications?: DropdownOption[];
  applyingFilters?: boolean;
}

export interface DropdownOption {
  value: string;
  label: string;
}
