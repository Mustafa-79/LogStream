import { useState } from "preact/hooks";
import "oj-c/button";
import "ojs/ojswitch";
import "ojs/ojselectsingle";
import "ojs/ojinputtext";
import ArrayDataProvider = require("ojs/ojarraydataprovider");
import { AuthManager } from "../../../utils/auth";

export function Settings() {
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [alertThreshold, setAlertThreshold] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  
  // Check if current user is admin using AuthManager
  const currentUser = AuthManager.getCurrentUser();
  const isAdmin = currentUser?.isAdmin || false;
  const [dataRetentionPeriod, setDataRetentionPeriod] = useState("30days");

  // Static data for applications
  const applications = [
    { value: "app1", label: "Authentication Service" },
    { value: "app2", label: "Payment Gateway" },
    { value: "app3", label: "User Management" },
    { value: "app4", label: "Analytics Engine" },
    { value: "app5", label: "Notification Service" }
  ];

  const timePeriods = [
    { value: "5min", label: "5 minutes" },
    { value: "10min", label: "10 minutes" },
    { value: "15min", label: "15 minutes" },
    { value: "30min", label: "30 minutes" },
    { value: "1hr", label: "1 hour" }
  ];

  const retentionPeriods = [
    { value: "7days", label: "7 days" },
    { value: "30days", label: "30 days" },
    { value: "90days", label: "90 days" },
    { value: "180days", label: "180 days" },
    { value: "1year", label: "1 year" },
    { value: "2years", label: "2 years" }
  ];

  // Create data providers for Oracle JET components
  const applicationsDataProvider = new ArrayDataProvider(applications, { keyAttributes: "value" });
  const timePeriodsDataProvider = new ArrayDataProvider(timePeriods, { keyAttributes: "value" });
  const retentionPeriodsDataProvider = new ArrayDataProvider(retentionPeriods, { keyAttributes: "value" });

  // Application status data as state
  const [applicationStatus, setApplicationStatus] = useState([
    { id: "auth", name: "Authentication Service", threshold: "100", timePeriod: "5 minutes", enabled: true },
    { id: "payment", name: "Payment Gateway", threshold: "50", timePeriod: "10 minutes", enabled: true },
    { id: "user", name: "User Management", threshold: "75", timePeriod: "5 minutes", enabled: false },
    { id: "analytics", name: "Analytics Engine", threshold: "200", timePeriod: "15 minutes", enabled: true },
    { id: "notification", name: "Notification Service", threshold: "25", timePeriod: "5 minutes", enabled: true }
  ]);

  // Mapping between application selector values and status table IDs
  const appMapping: Record<string, string> = {
    "app1": "auth",
    "app2": "payment", 
    "app3": "user",
    "app4": "analytics",
    "app5": "notification"
  };

  const handleReset = () => {
    console.log('Reset clicked');
    setSelectedApplication(null);
    setAlertThreshold("");
    setTimePeriod("");
    setEnableAlerts(true);
  };

  const handleSaveChanges = () => {
    console.log('Save Changes clicked');
    console.log({
      enableAlerts,
      selectedApplication,
      alertThreshold,
      timePeriod
    });
  };

  const handleApplicationChange = (event: any) => {
    const selectedApp = event.detail.value;
    setSelectedApplication(selectedApp);
    
    // Find the corresponding status entry and populate form
    const statusId = appMapping[selectedApp];
    if (statusId) {
      const statusEntry = applicationStatus.find(app => app.id === statusId);
      if (statusEntry) {
        setAlertThreshold(statusEntry.threshold);
        // Convert display format back to selector value
        const periodValue = timePeriods.find(p => p.label === statusEntry.timePeriod)?.value || "";
        setTimePeriod(periodValue);
      }
    } else {
      // Reset form if no mapping found
      setAlertThreshold("");
      setTimePeriod("");
    }
  };

  const handleStatusToggle = (appName: string, enabled: boolean) => {
    console.log(`Toggle ${appName}: ${enabled}`);
  };

  // Function to update status table when form values change
  const updateApplicationStatus = (threshold?: string, period?: string) => {
    if (!selectedApplication) return;
    
    const statusId = appMapping[selectedApplication];
    if (!statusId) return;

    setApplicationStatus(prevStatus => 
      prevStatus.map(app => {
        if (app.id === statusId) {
          return {
            ...app,
            threshold: threshold ?? app.threshold,
            timePeriod: period ?? app.timePeriod
          };
        }
        return app;
      })
    );
  };

  const handleThresholdChange = (event: any) => {
    const newThreshold = event.detail.value;
    setAlertThreshold(newThreshold);
    updateApplicationStatus(newThreshold);
  };

  const handleTimePeriodChange = (event: any) => {
    const newPeriod = event.detail.value;
    setTimePeriod(newPeriod);
    // Convert the period value to display format
    const periodDisplay = timePeriods.find(p => p.value === newPeriod)?.label || newPeriod;
    updateApplicationStatus(undefined, periodDisplay);
  };

  const handleDataRetentionChange = (event: any) => {
    setDataRetentionPeriod(event.detail.value);
  };

  const getTimePeriodDisplay = (period: string): string => {
    const periodMap: Record<string, string> = {
      "5 minutes": "5 min",
      "10 minutes": "10 min", 
      "15 minutes": "15 min"
    };
    return periodMap[period] || period;
  };

  return (
    <div class="oj-web-applayout-page" style="padding: 40px; padding-top: 20px;">
      {/* Header */}
      <div class="header-container" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
        <div>
          <h1 class="oj-header-page-title" style="margin: 0; font-size: 2rem; font-weight: 600; color: #1f2937;">
            Settings
          </h1>
          <p style="color: #6b7280; margin: 0; font-size: 1rem; line-height: 1.5;">
            Customize your logging dashboard experience and preferences.
          </p>
        </div>
        <div class="header-buttons" style="display: flex; align-items: center; gap: 12px;">
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

      {/* Notifications Block */}
      <div class="notifications-block oj-sm-shadow" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; rgba(0, 0, 0, 0.1);">
        {/* Notifications Header */}
        <div style="display: flex; align-items: center; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; color: #111827; font-size: 1.125rem; font-weight: 600;">Notifications</h3>
              <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">Configure alert settings and thresholds for your applications</p>
            </div>
          </div>
        </div>

        {/* Enable Alerts Toggle */}
        <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <h4 style="margin: 0; color: #374151; font-size: 1rem; font-weight: 500;">Enable Alerts</h4>
              <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">Receive notifications when log thresholds are exceeded</p>
            </div>
            <oj-switch
              value={enableAlerts}
              onvalueChanged={(event: any) => setEnableAlerts(event.detail.value)}
            />
          </div>
        </div>

        {/* Two Column Layout */}
        <div class="notifications-grid">
          {/* Left Column - Configure Application */}
          <div>
            <h4 style="margin: 0 0 16px 0; color: #374151; font-size: 1rem; font-weight: 500;">Configure Application</h4>
            
            <div style="margin-bottom: 20px;">
              <label htmlFor="app-select" style="display: block; margin-bottom: 8px; color: #6b7280; font-size: 0.875rem; font-weight: 500;">
                Select Application
              </label>
              <oj-select-single
                id="app-select"
                data={applicationsDataProvider}
                value={selectedApplication}
                onvalueChanged={handleApplicationChange}
                placeholder="Choose an application..."
                style="width: 100%;"
              />
            </div>

            <div style="margin-bottom: 20px;">
              <label htmlFor="alert-threshold" style="display: block; margin-bottom: 8px; color: #6b7280; font-size: 0.875rem; font-weight: 500;">
                Alert Threshold (logs/period)
              </label>
              <oj-input-text
                id="alert-threshold"
                value={alertThreshold}
                onvalueChanged={handleThresholdChange}
                placeholder="e.g., 100"
                style="width: 100%;"
              />
            </div>

            <div style="margin-bottom: 20px;">
              <label htmlFor="time-period" style="display: block; margin-bottom: 8px; color: #6b7280; font-size: 0.875rem; font-weight: 500;">
                Time Period
              </label>
              <oj-select-single
                id="time-period"
                data={timePeriodsDataProvider}
                value={timePeriod}
                onvalueChanged={handleTimePeriodChange}
                placeholder="Select time period..."
                style="width: 100%;"
              />
            </div>
          </div>

          {/* Right Column - Application Status */}
          <div>
            <h4 style="margin: 0 0 16px 0; color: #374151; font-size: 1rem; font-weight: 500;">Application Status</h4>
            
            <div class="status-table" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
              {/* Table Header */}
              <div class="status-table-inner" style="display: grid; grid-template-columns: 2fr 1fr 1fr 80px; gap: 8px; padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <div style="color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Application</div>
                <div style="color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Threshold</div>
                <div style="color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Period</div>
                <div style="color: #6b7280; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Status</div>
              </div>

              {/* Table Body */}
              {applicationStatus.map((app) => (
                <div key={app.id} class="status-table-inner" style="display: grid; grid-template-columns: 2fr 1fr 1fr 80px; gap: 8px; padding: 12px 16px; border-bottom: 1px solid #e5e7eb; align-items: center;">
                  <div style="display: flex; align-items: center; gap: 8px; min-width: 0;">
                    <div style="width: 8px; height: 8px; background: #0ea5e9; border-radius: 50%; flex-shrink: 0;"></div>
                    <span style="color: #374151; font-size: 0.875rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{app.name}</span>
                  </div>
                  <div style="color: #6b7280; font-size: 0.875rem; text-align: center;">{app.threshold}</div>
                  <div style="color: #6b7280; font-size: 0.875rem; text-align: center;">{getTimePeriodDisplay(app.timePeriod)}</div>
                  <div style="display: flex; justify-content: center;">
                    <oj-switch
                      value={app.enabled}
                      onvalueChanged={(event: any) => handleStatusToggle(app.name, event.detail.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div style="margin-top: 20px; padding: 12px 16px; background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 6px; display: flex; align-items: flex-start; gap: 8px;">
          <div style="width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; margin-top: 2px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <div>
            <p style="margin: 0; color: #0c4a6e; font-size: 0.875rem; line-height: 1.4;">
              <strong>Note:</strong> Changes to alert configurations will take effect within 5 minutes. 
              You'll receive notifications via email and in-app alerts when thresholds are exceeded.
            </p>
          </div>
        </div>
      </div>

      {/* Data Retention Block - Admin Only */}
      {isAdmin && (
        <div class="data-retention-block" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);">
          {/* Data Retention Layout */}
          <div class="data-retention-grid">
            {/* Left Side - Header */}
            <div>
              <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                <div style="width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6"></path>
                    <path d="m21 12-6-3-6 3-6-3"></path>
                  </svg>
                </div>
                <h3 style="margin: 0; color: #111827; font-size: 1.125rem; font-weight: 600;">Data Retention</h3>
              </div>
              <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">Configure how long data is stored in the system</p>
            </div>

            {/* Right Side - Dropdown */}
            <div>
              <label htmlFor="retention-period" style="display: block; margin-bottom: 8px; color: #6b7280; font-size: 0.875rem; font-weight: 500;">
                Retention Period
              </label>
              <oj-select-single
                id="retention-period"
                data={retentionPeriodsDataProvider}
                value={dataRetentionPeriod}
                onvalueChanged={handleDataRetentionChange}
                placeholder="Select retention period..."
                style="width: 100%; min-width: 200px;"
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Grid Layout */
        .notifications-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        .notifications-grid > div {
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
        }

        /* Data Retention Grid */
        .data-retention-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          align-items: start;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
        }

        /* Notifications Block */
        .notifications-block {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          padding: 16px !important;
        }

        /* Data Retention Block */
        .data-retention-block {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
          overflow: hidden;
          padding: 16px !important;
        }

        /* Form Elements */
        oj-select-single,
        oj-input-text {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }

        .notifications-grid label,
        .notifications-grid div[style*="margin-bottom"] {
          width: 100%;
          max-width: 100%;
          box-sizing: border-box;
        }

        /* Responsive Breakpoints */
        @media (min-width: 768px) {
          .notifications-block,
          .data-retention-block {
            padding: 24px !important;
          }
        }

        @media (max-width: 1024px) {
          .notifications-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
        }

        @media (max-width: 768px) {
          .oj-web-applayout-page {
            padding: 16px !important;
            padding-top: 12px !important;
          }
          
          .header-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          
          .header-buttons {
            width: 100% !important;
            justify-content: flex-end !important;
          }

          .notifications-grid {
            gap: 20px !important;
          }

          .data-retention-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }
        
        @media (max-width: 640px) {
          .oj-web-applayout-page {
            padding: 12px !important;
            padding-top: 8px !important;
          }

          .notifications-grid {
            gap: 16px !important;
          }
          
          .status-table {
            overflow-x: auto;
          }
          
          .status-table-inner {
            min-width: 350px;
            grid-template-columns: 2fr 70px 70px 60px !important;
            gap: 6px !important;
            font-size: 0.8rem !important;
          }
          
          .header-buttons {
            flex-direction: column !important;
            width: 100% !important;
            gap: 8px !important;
          }
          
          .header-buttons oj-c-button {
            width: 100% !important;
          }
        }

        @media (max-width: 480px) {
          .status-table-inner {
            min-width: 320px;
            grid-template-columns: 2fr 60px 60px 50px !important;
            gap: 4px !important;
            padding: 8px 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
