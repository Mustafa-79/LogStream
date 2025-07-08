import { h, ComponentProps } from "preact";
import { useState, useCallback, useMemo } from "preact/hooks";
import "ojs/ojchart";
import { ojChart } from "ojs/ojchart";
import MutableArrayDataProvider = require("ojs/ojmutablearraydataprovider");
import { ApplicationCount } from "./types";

// --- Types ---
type ChartItem = {
  id: number;
  series: string;
  group: string;
  value: number;
};

type ChartProps = ComponentProps<"oj-chart"> & {
  data: ApplicationCount[];
};

const ApplicationBarChart = ({ data }: { data: ApplicationCount[] }) => {
  // Transform the analytics data to chart format
  const chartData = useMemo(() => {
    return data.map((item, index) => ({
      id: index,
      series: "Applications",
      group: item.applicationName,
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
        Application Counts
      </h3>
      <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-bottom">
        This chart displays the number of logs per application.
      </p>
      <oj-chart
        id="applicationBarChart"
        type="bar"
        data={chartDataProvider}
        animationOnDisplay="auto"
        animationOnDataChange="auto"
        hoverBehavior="dim"
        orientation="vertical"
        class="oj-sm-margin-2x-top chartStyle">
        <template slot="itemTemplate" render={chartItem}></template>
      </oj-chart>
    </div>
  );
};

export default ApplicationBarChart;
