import { AlertToggle } from "./AlertToggle";
import { ApplicationConfig } from "./ApplicationConfig";
import { ApplicationStatusTable } from "./ApplicationStatusTable";
import { InfoNote } from "./InfoNote";
import { Application, TimePeriod, ApplicationStatus } from "./types";

interface NotificationsSectionProps {
  readonly enableAlerts: boolean;
  readonly applications: Application[];
  readonly timePeriods: TimePeriod[];
  readonly selectedApplication: string | null;
  readonly alertThreshold: string;
  readonly timePeriod: string;
  readonly applicationStatus: ApplicationStatus[];
  readonly validationErrors: Record<string, string>;
  readonly onAlertsToggle: (enabled: boolean) => void;
  readonly onApplicationChange: (event: any) => void;
  readonly onThresholdChange: (event: any) => void;
  readonly onTimePeriodChange: (event: any) => void;
  readonly onStatusToggle: (appName: string, enabled: boolean) => void;
  readonly getTimePeriodDisplay: (period: string) => string;
}

export function NotificationsSection({
  enableAlerts,
  applications,
  timePeriods,
  selectedApplication,
  alertThreshold,
  timePeriod,
  applicationStatus,
  validationErrors,
  onAlertsToggle,
  onApplicationChange,
  onThresholdChange,
  onTimePeriodChange,
  onStatusToggle,
  getTimePeriodDisplay
}: NotificationsSectionProps) {
  return (
    <div class="oj-panel oj-panel-shadow-sm oj-sm-margin-4x-bottom oj-sm-padding-6x" 
         style="background: white; border-radius: 8px;">
      {/* Notifications Header */}
      <div class="oj-flex oj-sm-align-items-center oj-sm-margin-4x-bottom">
        <div class="oj-flex oj-sm-align-items-center" style="gap: 12px;">
          <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" 
               style="width: 24px; height: 24px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
          </div>
          <div>
            <h3 class="oj-typography-heading-sm oj-text-color-primary" style="margin: 0;">
              Notifications
            </h3>
            <p class="oj-typography-body-sm oj-text-color-secondary" style="margin: 0;">
              Configure alert settings and thresholds for your applications
            </p>
          </div>
        </div>
      </div>

      <AlertToggle enableAlerts={enableAlerts} onToggle={onAlertsToggle} />

      {/* Conditionally render configuration and status table only when alerts are enabled */}
      {enableAlerts && (
        <>
          {/* Two Column Layout */}
          <div class="oj-flex oj-flex-wrap settings-main-layout" style="gap: 32px;">
            <ApplicationConfig
              applications={applications}
              timePeriods={timePeriods}
              selectedApplication={selectedApplication}
              alertThreshold={alertThreshold}
              timePeriod={timePeriod}
              validationErrors={validationErrors}
              onApplicationChange={onApplicationChange}
              onThresholdChange={onThresholdChange}
              onTimePeriodChange={onTimePeriodChange}
            />

            <ApplicationStatusTable
              applicationStatus={applicationStatus}
              onStatusToggle={onStatusToggle}
              getTimePeriodDisplay={getTimePeriodDisplay}
            />
          </div>

          <InfoNote message="You'll receive notifications via email alerts when thresholds are exceeded." />
        </>
      )}

      {/* Show a message when alerts are disabled */}
      {!enableAlerts && (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center oj-sm-padding-8x">
          <div class="oj-typography-body-md oj-text-color-secondary" style="text-align: center;">
            <div>Alerts are currently disabled</div>
            <div class="oj-typography-body-sm" style="margin-top: 4px;">
              Enable alerts above to configure application thresholds and notifications
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
