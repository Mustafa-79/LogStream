export interface Application {
  value: string;
  label: string;
}

export interface TimePeriod {
  value: string;
  label: string;
}

export interface RetentionPeriod {
  value: string;
  label: string;
}

export interface ApplicationStatus {
  id: string;
  name: string;
  threshold: string;
  timePeriod: string;
  enabled: boolean;
}

export interface SettingsFormData {
  enableAlerts: boolean;
  selectedApplication: string | null;
  alertThreshold: string;
  timePeriod: string;
  dataRetentionPeriod: string;
}
