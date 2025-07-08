import { h, ComponentProps } from "preact";
import { useState, useCallback, useMemo } from "preact/hooks";
import "ojs/ojchart";
import { ojChart } from "ojs/ojchart";
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");
import { VolumeTrend } from "./types";

// --- Types ---
type ChartItem = {
  id: number;
  series: string;
  group: string;
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
      group: new Date(item.timestamp).toLocaleDateString(),
      value: item.count
    }));
  }, [data]);

  const chartDataProvider = useMemo(() => 
    new MutableArrayDataProvider(chartData, { keyAttributes: "id" }),
    [chartData]
  );

  // --- Chart Item Template ---
  const chartItem = (
    item: ojChart.ItemTemplateContext<ChartItem["id"], ChartItem>
  ) => {
    return (
      <oj-chart-item
        value={item.data.value}
        groupId={[item.data.group]}
        seriesId={item.data.series}>
      </oj-chart-item>
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
      <oj-chart
        id="volumeLineChart"
        type="line"
        data={chartDataProvider}
        animationOnDisplay="auto"
        animationOnDataChange="auto"
        hoverBehavior="dim"
        class="oj-sm-margin-2x-top"
        style="height: 300px; width: 100%;">
        <template slot="itemTemplate" render={chartItem}></template>
      </oj-chart>
    </div>
  );
};

export default VolumeLineChart;
