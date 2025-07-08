import { h } from "preact";
import { AnalyticsData } from "./types";
import PieChart from "./LogLevelPieChart";
import ApplicationBarChart from "./ApplicationBarChart";
import VolumeLineChart from "./VolumeLineChart";

// Dummy data from the backend response
const dummyAnalyticsData: AnalyticsData = {
  logLevelDistribution: [
    {
      "_id": "WARNING",
      "count": 25,
      "percentage": 30
    },
    {
      "_id": "DEBUG",
      "count": 25,
      "percentage": 30
    },
    {
      "_id": "ERROR",
      "count": 17,
      "percentage": 20
    },
    {
      "_id": "INFO",
      "count": 16,
      "percentage": 19
    }
  ],
  applicationCounts: [
    {
      "_id": "686b6bf9a2ed46bfe1e05148",
      "applicationName": "Payment Service",
      "count": 21
    },
    {
      "_id": "686b6bf9a2ed46bfe1e05149",
      "applicationName": "User Management",
      "count": 21
    },
    {
      "_id": "686b6bf9a2ed46bfe1e05147",
      "applicationName": "E-Commerce API",
      "count": 21
    },
    {
      "_id": "686b6bf9a2ed46bfe1e0514a",
      "applicationName": "Analytics Dashboard",
      "count": 20
    }
  ],
  volumeTrend: [
    {
      "_id": "2025-07-04",
      "count": 17,
      "timestamp": "2025-07-03T19:00:00.000Z"
    },
    {
      "_id": "2025-07-05",
      "count": 27,
      "timestamp": "2025-07-04T19:00:00.000Z"
    },
    {
      "_id": "2025-07-06",
      "count": 28,
      "timestamp": "2025-07-05T19:00:00.000Z"
    },
    {
      "_id": "2025-07-07",
      "count": 11,
      "timestamp": "2025-07-06T19:00:00.000Z"
    }
  ],
  totalLogs: 83,
  period: {
    from: "2025-06-30T11:02:09.881Z",
    to: "2025-07-07T11:02:09.881Z",
    granularity: "day"
  }
};

export const Analytics = () => (
  <div class="oj-web-applayout-page oj-lg-padding-8x">
    <h1 class="oj-typography-heading-xl oj-text-color-primary oj-sm-margin-6x-bottom">
      Analytics Dashboard
    </h1>
    
    <div class="oj-flex oj-sm-flex-direction-row oj-sm-margin-4x-bottom">
      <div class="oj-flex-item oj-panel oj-sm-margin-2x-end oj-sm-margin-2x-bottom oj-panel-shadow-md">
        <PieChart data={dummyAnalyticsData.logLevelDistribution} />
      </div>
      
      <div class="oj-flex-item oj-panel oj-sm-margin-2x-start oj-sm-margin-2x-bottom oj-panel-shadow-md">
        <ApplicationBarChart data={dummyAnalyticsData.applicationCounts} />
      </div>
    </div>

    <div class="oj-panel oj-panel-shadow-md">
      <VolumeLineChart data={dummyAnalyticsData.volumeTrend} />
    </div>
  </div>
);