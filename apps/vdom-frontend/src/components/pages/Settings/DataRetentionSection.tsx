import "ojs/ojselectsingle";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import { RetentionPeriod } from "./types";

interface DataRetentionSectionProps {
  readonly retentionPeriods: RetentionPeriod[];
  readonly dataRetentionPeriod: string;
  readonly onRetentionChange: (event: any) => void;
}

export function DataRetentionSection({
  retentionPeriods,
  dataRetentionPeriod,
  onRetentionChange
}: DataRetentionSectionProps) {
  const retentionPeriodsDataProvider = new ArrayDataProvider(retentionPeriods, { keyAttributes: "value" });

  return (
    <div class="oj-panel oj-panel-shadow-sm oj-sm-margin-4x-bottom oj-sm-padding-6x" 
         style="background: white; border-radius: 8px;">
      <div class="oj-flex oj-flex-wrap oj-sm-align-items-start" style="gap: 32px;">
        {/* Left Side - Header */}
        <div class="oj-flex oj-sm-flex-direction-column oj-flex-item" style="min-width: 300px;">
          <div class="oj-flex oj-sm-align-items-center oj-sm-margin-2x-bottom" style="gap: 12px;">
            <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" 
                 style="width: 24px; height: 24px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6"></path>
                <path d="m21 12-6-3-6 3-6-3"></path>
              </svg>
            </div>
            <h3 class="oj-typography-heading-sm oj-text-color-primary" style="margin: 0;">
              Data Retention
            </h3>
          </div>
          <p class="oj-typography-body-sm oj-text-color-secondary" style="margin: 0;">
            Configure how long data is stored in the system
          </p>
        </div>

        {/* Right Side - Dropdown */}
        <div class="oj-flex oj-sm-flex-direction-column oj-flex-item" style="min-width: 250px;">
          <label htmlFor="retention-period" class="oj-label oj-text-color-secondary">
            Retention Period
          </label>
          <oj-select-single
            id="retention-period"
            data={retentionPeriodsDataProvider}
            value={dataRetentionPeriod}
            onvalueChanged={onRetentionChange}
            placeholder="Select retention period..."
            class="oj-form-control-full-width"
          />
        </div>
      </div>
    </div>
  );
}
