import { h, ComponentProps } from "preact";
import { useState, useCallback, useMemo } from "preact/hooks";
import "oj-c/line-chart";
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");
import { VolumeTrend } from "./types";

// --- Types ---
type ChartItem = {
  id: number;
  series: string;
  quarter: string;
  value: number;
};

type ChartProps = ComponentProps<"oj-chart"> & {
  data: VolumeTrend[];
};

const VolumeLineChart = ({ data }: { data: VolumeTrend[] }) => {

  console.log("📊 Volume line chart rendered with:", data);

  // Helper function to determine granularity and format local time ID
  const formatLocalTimeId = (timestamp: string, originalId: string) => {
    const localDate = new Date(timestamp);
    
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hour = String(localDate.getHours()).padStart(2, '0');
    const minute = String(localDate.getMinutes()).padStart(2, '0');
    
    // Determine granularity based on original ID format
    const idParts = originalId.split('-');
    
    if (idParts.length === 3) {
      // Daily granularity: YYYY-MM-DD
      return `${year}-${month}-${day}`;
    } else if (idParts.length === 4) {
      // Hourly granularity: YYYY-MM-DD-HH
      return `${year}-${month}-${day}-${hour}`;
    } else if (idParts.length === 5) {
      // Minute granularity: YYYY-MM-DD-HH-MM
      return `${year}-${month}-${day}-${hour}-${minute}`;
    }
    
    // Fallback to original format if unrecognized
    return originalId;
  };

  // Transform the analytics data to chart format
  const chartData = useMemo(() => {
    return data.map((item, index) => {
      // Convert UTC timestamp to local time with appropriate granularity
      const localId = formatLocalTimeId(item.timestamp, item._id);
      
      return {
        id: index,
        series: "Log Volume",
        quarter: localId,
        value: item.count
      };
    });
  }, [data]);

  const chartDataProvider = useMemo(() =>
    new MutableArrayDataProvider(chartData, { keyAttributes: "id" }),
    [chartData]
  );

  // Handle empty data case + when all counts are zero
  if (!data || data.length === 0 || data.every(item => item.count === 0)) {
    return (
      <div class="oj-md-margin-4x-horizontal">
        <h3 class="oj-typography-heading-sm oj-text-color-primary oj-sm-margin-3x-bottom">
          Log Volume Trend
        </h3>
        <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-bottom">
          This chart displays the trend of log volumes over time.
        </p>
        <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center" style="height: 300px; width: 100%; border: 1px dashed #d1d5db; border-radius: 8px; background-color: #f9fafb;">
          <div class="oj-flex oj-sm-flex-direction-column oj-sm-align-items-center">
            <div class="oj-typography-body-md oj-text-color-secondary oj-sm-margin-2x-bottom">
              No data available
            </div>
            <p class="oj-typography-body-sm oj-text-color-secondary">
              No log volume data found for the selected time period.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- Chart Series Template ---
  const chartSeries = (series: any) => {
    return (
      <oj-c-line-chart-series
        markerDisplayed="on"
        lineType="curved">
      </oj-c-line-chart-series>
    );
  };

  // --- Chart Item Template ---
  const chartItem = (item: { data: ChartItem }) => {
    return (
      <oj-c-line-chart-item
        value={item.data.value}
        groupId={[item.data.quarter]}
        seriesId={item.data.series}>
      </oj-c-line-chart-item>
    );
  };

  return (
    <div class="oj-md-margin-4x-horizontal">
      <h3 class="oj-typography-heading-sm oj-text-color-primary oj-sm-margin-3x-bottom">
        Log Volume Trend
      </h3>
      <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-bottom">
        This chart displays the trend of log volumes over time.
      </p>
      <oj-c-line-chart
        id="volumeLineChart"
        data={chartDataProvider}
        hoverBehavior="dim"
        class="oj-sm-margin-2x-top"
        style="width: 100%;">

        <template slot="seriesTemplate" render={chartSeries}></template>
        <template slot="itemTemplate" render={chartItem}></template>
      </oj-c-line-chart>



    </div>
  );
};

export default VolumeLineChart;
