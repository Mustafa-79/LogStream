import "ojs/ojswitch";

interface AlertToggleProps {
  readonly enableAlerts: boolean;
  readonly onToggle: (enabled: boolean) => void;
}

export function AlertToggle({ enableAlerts, onToggle }: AlertToggleProps) {
  return (
    <div class="oj-sm-margin-4x-bottom oj-sm-padding-6x" style="border-bottom: 1px solid #d5d7db;">
      <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between">
        <div>
          <h4 class="oj-typography-body-md oj-text-color-primary" style="margin: 0; font-weight: 500;">
            Enable Alerts
          </h4>
          <p class="oj-typography-body-sm oj-text-color-secondary" style="margin: 0;">
            Receive notifications when log thresholds are exceeded
          </p>
        </div>
        <oj-switch
          value={enableAlerts}
          onvalueChanged={(event: any) => onToggle(event.detail.value)}
        />
      </div>
    </div>
  );
}
