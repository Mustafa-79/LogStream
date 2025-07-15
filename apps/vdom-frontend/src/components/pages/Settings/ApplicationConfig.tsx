import "ojs/ojselectsingle";
import "ojs/ojinputtext";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import { Application, TimePeriod } from "./types";

interface ApplicationConfigProps {
  readonly applications: Application[];
  readonly timePeriods: TimePeriod[];
  readonly selectedApplication: string | null;
  readonly alertThreshold: string;
  readonly timePeriod: string;
  readonly validationErrors: Record<string, string>;
  readonly onApplicationChange: (event: any) => void;
  readonly onThresholdChange: (event: any) => void;
  readonly onTimePeriodChange: (event: any) => void;
}

export function ApplicationConfig({
  applications,
  timePeriods,
  selectedApplication,
  alertThreshold,
  timePeriod,
  validationErrors,
  onApplicationChange,
  onThresholdChange,
  onTimePeriodChange
}: ApplicationConfigProps) {
  const applicationsDataProvider = new ArrayDataProvider(applications, { keyAttributes: "value" });
  const timePeriodsDataProvider = new ArrayDataProvider(timePeriods, { keyAttributes: "value" });

  return (
    <div class="oj-flex oj-sm-flex-direction-column oj-flex-item settings-config-section" style="min-width: 300px;">
      <h4 class="oj-typography-body-lg oj-text-color-primary oj-sm-margin-4x-bottom">
        Configure Application
      </h4>
      
      <div class="oj-sm-margin-4x-bottom">
        <label htmlFor="app-select" class="oj-label oj-text-color-secondary">
          Select Application
        </label>
        <oj-select-single
          id="app-select"
          data={applicationsDataProvider}
          value={selectedApplication}
          onvalueChanged={onApplicationChange}
          placeholder="Choose an application..."
          class="oj-form-control-full-width"
        />
      </div>

      <div class="oj-sm-margin-4x-bottom">
        <label htmlFor="alert-threshold" class="oj-label oj-text-color-secondary">
          Alert Threshold (logs/period)
        </label>
        <oj-input-text
          id="alert-threshold"
          value={alertThreshold}
          onvalueChanged={onThresholdChange}
          placeholder="e.g., 100 (max: 1000)"
          class="oj-form-control-full-width"
        />
        {validationErrors.alertThreshold && (
          <div class="oj-text-color-danger oj-typography-body-sm" style="margin-top: 4px;">
            {validationErrors.alertThreshold}
          </div>
        )}
      </div>

      <div class="oj-sm-margin-4x-bottom">
        <label htmlFor="time-period" class="oj-label oj-text-color-secondary">
          Time Period
        </label>
        <oj-select-single
          id="time-period"
          data={timePeriodsDataProvider}
          value={timePeriod}
          onvalueChanged={onTimePeriodChange}
          placeholder="Select time period..."
          class="oj-form-control-full-width"
        />
      </div>
    </div>
  );
}
