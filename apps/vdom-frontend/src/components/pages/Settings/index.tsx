import { useState } from "preact/hooks";
import { AuthManager } from "../../../utils/auth";
import { SettingsHeader } from "./SettingsHeader";
import { NotificationsSection } from "./NotificationsSection";
import { DataRetentionSection } from "./DataRetentionSection";
import { 
  applications, 
  timePeriods, 
  retentionPeriods, 
  initialApplicationStatus, 
  appMapping, 
  getTimePeriodDisplay 
} from "./constants";

export function Settings() {
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [alertThreshold, setAlertThreshold] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [dataRetentionPeriod, setDataRetentionPeriod] = useState("30days");
  const [applicationStatus, setApplicationStatus] = useState(initialApplicationStatus);
  
  const isAdmin = AuthManager.getCurrentUser()?.isAdmin || false;

  const handleReset = () => {
    setSelectedApplication(null);
    setAlertThreshold("");
    setTimePeriod("");
    setEnableAlerts(true);
  };

  const handleSaveChanges = () => {
    console.log('Save Changes:', {
      enableAlerts,
      selectedApplication,
      alertThreshold,
      timePeriod,
      dataRetentionPeriod
    });
  };

  const handleApplicationChange = (event: any) => {
    const selectedApp = event.detail.value;
    setSelectedApplication(selectedApp);
    
    const statusId = appMapping[selectedApp];
    const statusEntry = applicationStatus.find(app => app.id === statusId);
    if (statusEntry) {
      setAlertThreshold(statusEntry.threshold);
      const periodValue = timePeriods.find(p => p.label === statusEntry.timePeriod)?.value || "";
      setTimePeriod(periodValue);
    } else {
      setAlertThreshold("");
      setTimePeriod("");
    }
  };

  const handleStatusToggle = (appName: string, enabled: boolean) => {
    setApplicationStatus(prev => 
      prev.map(app => app.name === appName ? { ...app, enabled } : app)
    );
  };

  const updateApplicationStatus = (threshold?: string, period?: string) => {
    if (!selectedApplication) return;
    
    const statusId = appMapping[selectedApplication];
    if (!statusId) return;

    setApplicationStatus(prev => 
      prev.map(app => {
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
    const periodDisplay = timePeriods.find(p => p.value === newPeriod)?.label || newPeriod;
    updateApplicationStatus(undefined, periodDisplay);
  };

  const handleDataRetentionChange = (event: any) => {
    setDataRetentionPeriod(event.detail.value);
  };

  return (
    <div class="oj-web-applayout-page oj-sm-padding-8x">
      <SettingsHeader onReset={handleReset} onSaveChanges={handleSaveChanges} />

      <NotificationsSection
        enableAlerts={enableAlerts}
        applications={applications}
        timePeriods={timePeriods}
        selectedApplication={selectedApplication}
        alertThreshold={alertThreshold}
        timePeriod={timePeriod}
        applicationStatus={applicationStatus}
        onAlertsToggle={setEnableAlerts}
        onApplicationChange={handleApplicationChange}
        onThresholdChange={handleThresholdChange}
        onTimePeriodChange={handleTimePeriodChange}
        onStatusToggle={handleStatusToggle}
        getTimePeriodDisplay={getTimePeriodDisplay}
      />

      {isAdmin && (
        <DataRetentionSection
          retentionPeriods={retentionPeriods}
          dataRetentionPeriod={dataRetentionPeriod}
          onRetentionChange={handleDataRetentionChange}
        />
      )}

      <style>{`
        .settings-main-layout {
          margin: 0 2rem;
        }

        .settings-config-section {
          flex: 1;
          max-width: 100%;
        }

        .settings-status-section {
          flex: 1;
          max-width: 100%;
        }

        .settings-status-table {
          width: 100%;
          overflow-x: auto;
        }
        
        @media (max-width: 768px) {
          .settings-main-layout {
            margin: 0 1rem;
            flex-direction: column !important;
            gap: 24px !important;
          }

          .settings-config-section,
          .settings-status-section {
            min-width: unset !important;
            width: 100%;
            max-width: 100%;
          }

          .settings-status-table {
            overflow-x: auto;
            min-width: 320px;
          }

          .settings-period-col {
            display: none !important;
          }

          .settings-table-header,
          .settings-table-row {
            padding: 0.75rem 0.5rem !important;
          }

          .settings-threshold-col {
            flex: 0.8 !important;
          }

          .settings-status-col {
            width: 60px !important;
          }
        }
        
        @media (max-width: 640px) {
          .settings-main-layout {
            margin: 0 0.5rem;
          }

          .settings-table-header,
          .settings-table-row {
            padding: 0.5rem 0.25rem !important;
          }

          .settings-status-col {
            width: 50px !important;
          }
        }

        @media (max-width: 480px) {
          .settings-threshold-col {
            text-align: left !important;
          }

          .settings-status-table {
            min-width: 280px;
          }
        }
      `}</style>
    </div>
  );
}
