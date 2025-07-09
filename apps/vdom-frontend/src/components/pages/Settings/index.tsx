import { h } from "preact";
import "oj-c/button";

export function Settings() {
  const handleReset = () => {
    console.log('Reset clicked');
  };

  const handleSaveChanges = () => {
    console.log('Save Changes clicked');
  };

  return (
    <div class="oj-web-applayout-page" style="padding: 40px; padding-top: 20px;">
      {/* Header */}
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
        <div>
          <h1 class="oj-header-page-title" style="margin: 0; font-size: 2rem; font-weight: 600; font-family: 'Poppins', sans-serif;">
            Settings
          </h1>
          <p style="color: #6b7280; margin: 0; font-size: 1rem; line-height: 1.5;">
            Customize your logging dashboard experience and preferences.
          </p>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <oj-c-button 
            label="Reset"
            chroming="outlined"
            onojAction={handleReset}
          >
          </oj-c-button>
          <oj-c-button 
            label="Save Changes"
            chroming="callToAction"
            onojAction={handleSaveChanges}
          >
          </oj-c-button>
        </div>
      </div>

      
    </div>
  );
}
