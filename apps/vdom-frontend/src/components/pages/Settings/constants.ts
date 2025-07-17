import { TimePeriod, RetentionPeriod } from "./types";

export const timePeriods: TimePeriod[] = [
  { value: "5min", label: "5 minutes" },
  { value: "10min", label: "10 minutes" },
  { value: "15min", label: "15 minutes" },
  { value: "30min", label: "30 minutes" },
  { value: "1hr", label: "1 hour" }
];

export const retentionPeriods: RetentionPeriod[] = [
  { value: 7, label: "7 days" },
  { value: 10, label: "10 days" },
  { value: 15, label: "15 days" },
  { value: 20, label: "20 days" },
  { value: 25, label: "25 days" },
  { value: 30, label: "30 days" }
];

// Simple display formatter (inline where needed)
export const getTimePeriodDisplay = (period: string): string => 
  period.replace("minutes", "min");
