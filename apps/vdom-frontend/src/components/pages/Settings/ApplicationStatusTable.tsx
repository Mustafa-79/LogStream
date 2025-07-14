import "ojs/ojswitch";
import { ApplicationStatus } from "./types";

interface ApplicationStatusTableProps {
  readonly applicationStatus: ApplicationStatus[];
  readonly onStatusToggle: (appName: string, enabled: boolean) => void;
  readonly getTimePeriodDisplay: (period: string) => string;
}

export function ApplicationStatusTable({
  applicationStatus,
  onStatusToggle,
  getTimePeriodDisplay
}: ApplicationStatusTableProps) {
  return (
    <div class="oj-flex oj-sm-flex-direction-column oj-flex-item settings-status-section" style="min-width: 400px;">
      <h4 class="oj-typography-body-lg oj-text-color-primary oj-sm-margin-4x-bottom">
        Application Status
      </h4>
      
      <div class="oj-panel oj-panel-shadow-sm settings-status-table" 
           style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; max-height: 400px; overflow-y: auto;">
        {/* Table Header */}
        <div class="oj-flex oj-sm-padding-4x settings-table-header" 
             style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 10; backdrop-filter: blur(8px);">
          <div class="oj-flex-item oj-typography-body-xs oj-text-color-secondary" 
               style="flex: 2; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            Application
          </div>
          <div class="oj-flex-item oj-typography-body-xs oj-text-color-secondary oj-text-align-center settings-threshold-col" 
               style="flex: 1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            Threshold
          </div>
          <div class="oj-flex-item oj-typography-body-xs oj-text-color-secondary oj-text-align-center settings-period-col" 
               style="flex: 1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            Period
          </div>
          <div class="oj-typography-body-xs oj-text-color-secondary oj-text-align-center settings-status-col" 
               style="width: 80px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
            Status
          </div>
        </div>

        {/* Table Body */}
        {applicationStatus.map((app) => (
          <div key={app.id} class="oj-flex oj-sm-align-items-center oj-sm-padding-4x settings-table-row" 
               style="border-bottom: 1px solid #e5e7eb;">
            <div class="oj-flex oj-sm-align-items-center oj-flex-item" 
                 style="flex: 2; gap: 8px; min-width: 0;">
              <div style="width: 8px; height: 8px; background: #0ea5e9; border-radius: 50%; flex-shrink: 0;"></div>
              <span class="oj-typography-body-sm" 
                    style="color: #374151; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                {app.name}
              </span>
            </div>
            <div class="oj-flex-item oj-typography-body-sm oj-text-color-secondary oj-text-align-center settings-threshold-col" 
                 style="flex: 1;">
              {app.threshold}
            </div>
            <div class="oj-flex-item oj-typography-body-sm oj-text-color-secondary oj-text-align-center settings-period-col" 
                 style="flex: 1;">
              {getTimePeriodDisplay(app.timePeriod)}
            </div>
            <div class="oj-flex oj-sm-justify-content-center settings-status-col" style="width: 80px;">
              <oj-switch
                value={app.enabled}
                onvalueChanged={(event: any) => onStatusToggle(app.name, event.detail.value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
