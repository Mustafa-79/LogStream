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

  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <div class="oj-md-margin-4x-horizontal">
        <h3 class="oj-typography-heading-sm oj-text-color-primary oj-sm-margin-3x-bottom">
          Log Counts
        </h3>
        <p class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-2x-bottom">
          This chart displays the number of logs per application.
        </p>
        <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center" style="height: 300px; width: 100%; border: 1px dashed #d1d5db; border-radius: 8px; background-color: #f9fafb;">
          <div class="oj-flex oj-sm-flex-direction-column oj-sm-align-items-center">
            <div class="oj-typography-body-md oj-text-color-secondary oj-sm-margin-2x-bottom">
              No data available
            </div>
            <p class="oj-typography-body-sm oj-text-color-secondary">
              No application data found for the selected time period.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        Log Counts
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
        class="oj-sm-margin-2x-top">
        <template slot="itemTemplate" render={chartItem}></template>
      </oj-chart>
    </div>
  );
};

export default ApplicationBarChart;
