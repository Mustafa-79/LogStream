import "oj-c/button";

interface SettingsHeaderProps {
  readonly onReset: () => void;
  readonly onSaveChanges: () => void;
}

export function SettingsHeader({ onReset, onSaveChanges }: SettingsHeaderProps) {
  return (
    <div class="oj-flex oj-justify-content-space-between oj-align-items-start" style="margin-bottom: 24px;">
      <div style="flex: 1;">
        <h1 class="oj-typography-heading-lg" style="margin: 0;">
          Settings
        </h1>
        <p class="oj-typography-body-md" style="color: #6b7280; margin-top: 4px;">
          Customize your logging dashboard experience and preferences.
        </p>
      </div>
      <div style="flex-shrink: 0; margin-left: 16px; display: flex; gap: 12px;">
        <oj-c-button 
          label="Reset"
          chroming="outlined"
          onojAction={onReset}
        />
        <oj-c-button 
          label="Save Changes"
          chroming="callToAction"
          onojAction={onSaveChanges}
        />
      </div>
    </div>
  );
}
