// Types for Analytics API response data

export interface LogLevelDistribution {
  _id: string;
  count: number;
  percentage: number;
}

export interface ApplicationCount {
  _id: string;
  applicationName: string;
  count: number;
}

export interface VolumeTrend {
  _id: string;
  count: number;
  timestamp: string;
}

export interface AnalyticsPeriod {
  from: string;
  to: string;
  granularity: string;
}

export interface AnalyticsData {
  logLevelDistribution: LogLevelDistribution[];
  applicationCounts: ApplicationCount[];
  volumeTrend: VolumeTrend[];
  totalLogs: number;
  period: AnalyticsPeriod;
}

export interface AnalyticsResponse {
  status: number;
  message: string;
  data: AnalyticsData;
}
