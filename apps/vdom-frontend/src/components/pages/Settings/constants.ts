import { Application, TimePeriod, RetentionPeriod, ApplicationStatus } from "./types";

export const applications: Application[] = [
  { value: "app1", label: "Authentication Service" },
  { value: "app2", label: "Payment Gateway" },
  { value: "app3", label: "User Management" },
  { value: "app4", label: "Analytics Engine" },
  { value: "app5", label: "Notification Service" }
];

export const timePeriods: TimePeriod[] = [
  { value: "5min", label: "5 minutes" },
  { value: "10min", label: "10 minutes" },
  { value: "15min", label: "15 minutes" },
  { value: "30min", label: "30 minutes" },
  { value: "1hr", label: "1 hour" }
];

export const retentionPeriods: RetentionPeriod[] = [
  { value: "7", label: "7 days" },
  { value: "10", label: "10 days" },
  { value: "15", label: "15 days" },
  { value: "20", label: "20 days" },
  { value: "25", label: "25 days" },
  { value: "30", label: "30 days" }
];

export const initialApplicationStatus: ApplicationStatus[] = [
  { id: "auth", name: "Authentication Service", threshold: "100", timePeriod: "5 minutes", enabled: true },
  { id: "payment", name: "Payment Gateway", threshold: "50", timePeriod: "10 minutes", enabled: true },
  { id: "user", name: "User Management", threshold: "75", timePeriod: "5 minutes", enabled: false },
  { id: "analytics", name: "Analytics Engine", threshold: "200", timePeriod: "15 minutes", enabled: true },
  { id: "notification", name: "Notification Service", threshold: "25", timePeriod: "5 minutes", enabled: true }
];

export const appMapping: Record<string, string> = {
  "app1": "auth",
  "app2": "payment", 
  "app3": "user",
  "app4": "analytics",
  "app5": "notification"
};

export const getTimePeriodDisplay = (period: string): string => {
  const periodMap: Record<string, string> = {
    "5 minutes": "5 min",
    "10 minutes": "10 min", 
    "15 minutes": "15 min"
  };
  return periodMap[period] || period;
};
