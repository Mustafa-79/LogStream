import { h, ComponentProps } from "preact";
import { useState, useCallback, useMemo } from "preact/hooks";
import "ojs/ojchart";
import { ojChart } from "ojs/ojchart";
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");
import { LogLevelDistribution } from "./types";

// --- Types ---
type ChartItem = {
  id: number;
  series: string;
  group: string;
  value: number;
};

type ChartProps = ComponentProps<"oj-chart"> & {
  data: LogLevelDistribution[];
};

const PieChart = ({ data }: { data: LogLevelDistribution[] }) => {
  // Transform the analytics data to chart format
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      id: index,
      series: item._id,
      group: "Log Levels",
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
        Log Level Distribution
      </h3>
      <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-bottom">
        This chart shows the distribution of log entries by their log level.
      </p>
      <oj-chart
        id="logLevelPieChart"
        type="pie"
        data={chartDataProvider}
        animationOnDisplay="auto"
        animationOnDataChange="auto"
        hoverBehavior="dim"
        class="oj-sm-margin-2x-top">
        <template slot="itemTemplate" render={chartItem}></template>
      </oj-chart>
    </div>
  );
};

export default PieChart;
