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
    { value: "7", label: "7 days" },
    { value: "10", label: "10 days" },
    { value: "15", label: "15 days" },
    { value: "20", label: "20 days" },
    { value: "25", label: "25 days" },
    { value: "30", label: "30 days" },
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
    <div class="oj-web-applayout-page oj-sm-padding-8x">
      {/* Header */}
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

      {/* Notifications Card */}
      <div class="oj-panel oj-panel-shadow-sm oj-sm-margin-4x-bottom oj-sm-padding-6x" style="background: white; border-radius: 8px;">
        {/* Notifications Header */}
        <div class="oj-flex oj-sm-align-items-center oj-sm-margin-4x-bottom">
          <div class="oj-flex oj-sm-align-items-center" style="gap: 12px;">
            <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" style="width: 24px; height: 24px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <div>
              <h3 class="oj-typography-heading-sm oj-text-color-primary" style="margin: 0;">Notifications</h3>
              <p class="oj-typography-body-sm oj-text-color-secondary" style="margin: 0;">Configure alert settings and thresholds for your applications</p>
            </div>
          </div>
        </div>

        {/* Enable Alerts Toggle */}
        <div class="oj-sm-margin-4x-bottom oj-sm-padding-6x" style="border-bottom: 1px solid #d5d7db;">
          <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-space-between">
            <div>
              <h4 class="oj-typography-body-md oj-text-color-primary" style="margin: 0; font-weight: 500;">Enable Alerts</h4>
              <p class="oj-typography-body-sm oj-text-color-secondary" style="margin: 0;">Receive notifications when log thresholds are exceeded</p>
            </div>
            <oj-switch
              value={enableAlerts}
              onvalueChanged={(event: any) => setEnableAlerts(event.detail.value)}
            />
          </div>
        </div>

        {/* Two Column Layout using Oracle JET Flex */}
        <div class="oj-flex oj-flex-wrap oj-sm-margin-8x-horizontal" style="gap: 32px;">
          {/* Left Column - Configure Application */}
          <div class="oj-flex oj-sm-flex-direction-column oj-flex-item" style="min-width: 300px;">
            <h4 class="oj-typography-body-md oj-text-color-primary oj-sm-margin-4x-bottom" style="margin: 0; font-weight: 500;">Configure Application</h4>
            
            <div class="oj-sm-margin-4x-bottom">
              <label htmlFor="app-select" class="oj-label oj-text-color-secondary">
                Select Application
              </label>
              <oj-select-single
                id="app-select"
                data={applicationsDataProvider}
                value={selectedApplication}
                onvalueChanged={handleApplicationChange}
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
                onvalueChanged={handleThresholdChange}
                placeholder="e.g., 100"
                class="oj-form-control-full-width"
              />
            </div>

            <div class="oj-sm-margin-4x-bottom">
              <label htmlFor="time-period" class="oj-label oj-text-color-secondary">
                Time Period
              </label>
              <oj-select-single
                id="time-period"
                data={timePeriodsDataProvider}
                value={timePeriod}
                onvalueChanged={handleTimePeriodChange}
                placeholder="Select time period..."
                class="oj-form-control-full-width"
              />
            </div>
          </div>

          {/* Right Column - Application Status */}
          <div class="oj-flex oj-sm-flex-direction-column oj-flex-item" style="min-width: 400px;">
            <h4 class="oj-typography-body-md oj-text-color-primary oj-sm-margin-4x-bottom" style="margin: 0; font-weight: 500;">Application Status</h4>
            
              <div class="oj-flex oj-sm-padding-4x" style="background: #f9fafb; border-bottom: 1px solid #e5e7eb; position: sticky; top: 0; z-index: 10; backdrop-filter: blur(8px);">
                <div class="oj-flex-item oj-typography-body-xs oj-text-color-secondary" style="flex: 2; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Application</div>
                <div class="oj-flex-item oj-typography-body-xs oj-text-color-secondary oj-text-align-center" style="flex: 1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Threshold</div>
                <div class="oj-flex-item oj-typography-body-xs oj-text-color-secondary oj-text-align-center" style="flex: 1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Period</div>
                <div class="oj-typography-body-xs oj-text-color-secondary oj-text-align-center" style="width: 80px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Status</div>
              </div>
            <div class="oj-panel oj-panel-shadow-sm" style="border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden; max-height: 400px; overflow-y: auto;">
              {/* Table Header */}

              {/* Table Body */}
              {applicationStatus.map((app) => (
                <div key={app.id} class="oj-flex oj-sm-align-items-center oj-sm-padding-4x" style="border-bottom: 1px solid #e5e7eb;">
                  <div class="oj-flex oj-sm-align-items-center oj-flex-item" style="flex: 2; gap: 8px; min-width: 0;">
                    <div style="width: 8px; height: 8px; background: #0ea5e9; border-radius: 50%; flex-shrink: 0;"></div>
                    <span class="oj-typography-body-sm" style="color: #374151; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{app.name}</span>
                  </div>
                  <div class="oj-flex-item oj-typography-body-sm oj-text-color-secondary oj-text-align-center" style="flex: 1;">{app.threshold}</div>
                  <div class="oj-flex-item oj-typography-body-sm oj-text-color-secondary oj-text-align-center" style="flex: 1;">{getTimePeriodDisplay(app.timePeriod)}</div>
                  <div class="oj-flex oj-sm-justify-content-center" style="width: 80px;">
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
        <div class="oj-panel oj-panel-shadow-sm oj-sm-margin-4x-top oj-sm-padding-4x" style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 6px;">
          <div class="oj-flex oj-sm-align-items-flex-start" style="gap: 8px;">
            <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" style="width: 16px; height: 16px; margin-top: 2px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
            </div>
            <div>
              <p class="oj-typography-body-sm" style="margin: 0; color: #0c4a6e; line-height: 1.4;">
                <strong>Note:</strong> You'll receive notifications via email alerts when thresholds are exceeded.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Retention Card - Admin Only */}
      {isAdmin && (
        <div class="oj-panel oj-panel-shadow-sm oj-sm-margin-4x-bottom oj-sm-padding-6x" style="background: white; border-radius: 8px;">
          {/* Data Retention Layout using Oracle JET Flex */}
          <div class="oj-flex oj-flex-wrap oj-sm-align-items-start" style="gap: 32px;">
            {/* Left Side - Header */}
            <div class="oj-flex oj-sm-flex-direction-column oj-flex-item" style="min-width: 300px;">
              <div class="oj-flex oj-sm-align-items-center oj-sm-margin-2x-bottom" style="gap: 12px;">
                <div class="oj-flex oj-sm-align-items-center oj-sm-justify-content-center" style="width: 24px; height: 24px;">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M12 1v6m0 6v6"></path>
                    <path d="m21 12-6-3-6 3-6-3"></path>
                  </svg>
                </div>
                <h3 class="oj-typography-heading-sm oj-text-color-primary" style="margin: 0;">Data Retention</h3>
              </div>
              <p class="oj-typography-body-sm oj-text-color-secondary" style="margin: 0;">Configure how long data is stored in the system</p>
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
                onvalueChanged={handleDataRetentionChange}
                placeholder="Select retention period..."
                class="oj-form-control-full-width"
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Minimal custom styles - mostly using OJET classes now */
        .oj-flex[style*="gap: 32px"] {
          gap: 32px;
        }
        
        .oj-flex[style*="gap: 12px"] {
          gap: 12px;
        }
        
        .oj-flex[style*="gap: 8px"] {
          gap: 8px;
        }
        
        @media (max-width: 768px) {
          .oj-flex[style*="gap: 32px"] {
            flex-direction: column !important;
            gap: 16px !important;
          }
        }
        
        @media (max-width: 640px) {
          .oj-flex[style*="gap: 12px"] {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
        }
      `}</style>
    </div>
  );
}
