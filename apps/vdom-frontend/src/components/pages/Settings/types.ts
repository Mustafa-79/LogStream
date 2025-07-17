// Simplified types - removed redundant interfaces
export interface Application {
  value: string;
  label: string;
}

export interface TimePeriod {
  value: string;
  label: string;
}

export interface RetentionPeriod {
  value: number;
  label: string;
}

export interface ApplicationStatus {
  id: string;
  name: string;
  threshold: string;
  timePeriod: string;
  notificationsEnabled: boolean;
}
