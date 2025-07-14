import "oj-c/button";

interface SettingsHeaderProps {
  readonly onReset: () => void;
  readonly onSaveChanges: () => void;
}

export function SettingsHeader({ onReset, onSaveChanges }: SettingsHeaderProps) {
  return (
    <div class="oj-flex oj-justify-content-space-between oj-align-items-start oj-sm-margin-6x-bottom">
      <div class="oj-flex-item">
        <h1 class="oj-typography-heading-lg" style="color:rgb(0, 0, 0); margin: 0; font-family: 'Poppins', sans-serif;">
          Settings
        </h1>
        <p class="oj-typography-body-md oj-text-color-secondary oj-sm-margin-2x-top">
          Customize your logging dashboard experience and preferences.
        </p>
      </div>
      <div class="oj-flex oj-sm-margin-4x-start" style="gap: 12px;">
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
