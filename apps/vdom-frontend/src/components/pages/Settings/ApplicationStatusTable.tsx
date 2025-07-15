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
           style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; max-height: 400px;">
        {/* Scrollable container for horizontal scroll */}
        <div style="overflow-x: auto; overflow-y: auto; max-height: 400px;">
          <div style="min-width: 520px; width: max-content; display: table;"> {/* Table layout for consistent spacing */}
            {/* Table Header */}
            <div style="display: table-row; background: #f9fafb; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 10;">
              <div class="oj-typography-body-xs oj-text-color-secondary" 
                   style="display: table-cell; width: 180px; padding: 16px 12px 16px 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; vertical-align: middle;">
                Application
              </div>
              <div class="oj-typography-body-xs oj-text-color-secondary" 
                   style="display: table-cell; width: 120px; padding: 16px 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; vertical-align: middle;">
                Threshold
              </div>
              <div class="oj-typography-body-xs oj-text-color-secondary" 
                   style="display: table-cell; width: 120px; padding: 16px 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; vertical-align: middle;">
                Period
              </div>
              <div class="oj-typography-body-xs oj-text-color-secondary" 
                   style="display: table-cell; width: 100px; padding: 16px 16px 16px 16px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; text-align: center; vertical-align: middle;">
                Status
              </div>
            </div>

            {/* Table Body */}
            {applicationStatus.map((app) => (
              <div key={app.id} style="display: table-row; border-bottom: 1px solid #e5e7eb;">
                <div style="display: table-cell; width: 180px; padding: 16px 12px 16px 16px; vertical-align: middle;">
                  <div class="oj-flex oj-sm-align-items-center" style="gap: 8px;">
                    <div style="width: 8px; height: 8px; background: #0ea5e9; border-radius: 50%; flex-shrink: 0;"></div>
                    <span class="oj-typography-body-sm" 
                          style="color: #374151; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                      {app.name}
                    </span>
                  </div>
                </div>
                <div class="oj-typography-body-sm oj-text-color-secondary" 
                     style="display: table-cell; width: 120px; padding: 16px 16px; text-align: center; vertical-align: middle;">
                  {app.threshold}
                </div>
                <div class="oj-typography-body-sm oj-text-color-secondary" 
                     style="display: table-cell; width: 120px; padding: 16px 16px; text-align: center; vertical-align: middle;">
                  {getTimePeriodDisplay(app.timePeriod)}
                </div>
                <div style="display: table-cell; width: 100px; padding: 16px 16px 16px 16px; text-align: center; vertical-align: middle;">
                  <oj-switch
                    value={app.notificationsEnabled}
                    onvalueChanged={(event: any) => onStatusToggle(app.name, event.detail.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
