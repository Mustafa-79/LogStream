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
  // Transform the analytics data to chart format
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      id: index,
      series: "Log Volume",
      quarter: new Date(item.timestamp).toLocaleDateString(),
      value: item.count
    }));
  }, [data]);

  const chartDataProvider = useMemo(() =>
    new MutableArrayDataProvider(chartData, { keyAttributes: "id" }),
    [chartData]
  );

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
        style="height: 300px; width: 100%;">

        <template slot="seriesTemplate" render={chartSeries}></template>
        <template slot="itemTemplate" render={chartItem}></template>
      </oj-c-line-chart>



    </div>
  );
};

export default VolumeLineChart;
