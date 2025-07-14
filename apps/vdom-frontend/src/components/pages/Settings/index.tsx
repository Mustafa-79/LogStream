import { useState, useEffect } from "preact/hooks";
import "oj-c/progress-circle";
import { AuthManager } from "../../../utils/auth";
import SettingsService from "../../../services/settingsService";
import { SettingsHeader } from "./SettingsHeader";
import { NotificationsSection } from "./NotificationsSection";
import { DataRetentionSection } from "./DataRetentionSection";
import { Application, ApplicationStatus } from "./types";
import { 
  timePeriods, 
  retentionPeriods, 
  getTimePeriodDisplay 
} from "./constants";

export function Settings() {
  const [enableAlerts, setEnableAlerts] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [alertThreshold, setAlertThreshold] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [dataRetentionPeriod, setDataRetentionPeriod] = useState("30days");
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const isAdmin = AuthManager.getCurrentUser()?.isAdmin || false;

  // Helper function to convert time period from minutes to display format
  const convertTimePeriodToDisplay = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
  };

  // Fetch user applications from API
  const fetchUserApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const userApps = await SettingsService.fetchUserApplications();
      
      // Transform user applications to dropdown format
      const appOptions: Application[] = userApps.map((app, index) => ({
        value: `app${index + 1}`,
        label: app.name
      }));
      setApplications(appOptions);
      
      // Transform user applications to status format
      const statusData: ApplicationStatus[] = userApps.map((app, index) => ({
        id: `app${index + 1}`,
        name: app.name,
        threshold: app.threshold.toString(),
        timePeriod: convertTimePeriodToDisplay(app.timePeriod),
        enabled: app.active,
        notificationsEnabled: app.notificationsEnabled
      }));
      setApplicationStatus(statusData);
      
    } catch (err) {
      setError('Failed to load user applications');
      console.error('Error fetching user applications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchUserApplications();
  }, []);

  const handleReset = () => {
    setSelectedApplication(null);
    setAlertThreshold("");
    setTimePeriod("");
    setEnableAlerts(true);
    // Reload data from API
    fetchUserApplications();
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
    
    // Find the corresponding application status
    const statusEntry = applicationStatus.find(app => app.id === selectedApp);
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
    
    setApplicationStatus(prev => 
      prev.map(app => {
        if (app.id === selectedApplication) {
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

  if (loading) {
    return (
      <div class="oj-web-applayout-page oj-sm-padding-8x">
        <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center" style="min-height: 200px;">
          <oj-progress-circle size="sm"></oj-progress-circle>
          <span class="oj-typography-body-md oj-text-color-secondary oj-sm-margin-4x-start">
            Loading applications...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div class="oj-web-applayout-page oj-sm-padding-8x">
        <div class="oj-flex oj-sm-justify-content-center oj-sm-align-items-center" style="min-height: 200px;">        <div class="oj-panel oj-panel-shadow-sm oj-sm-padding-6x" style="border: 1px solid #ef4444; background: #fef2f2;">
          <div class="oj-flex oj-sm-align-items-center">
            <div style="background: #ef4444; color: white; margin-right: 1rem; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">!</div>
            <div>
              <div class="oj-typography-body-md oj-text-color-danger">{error}</div>
              <button 
                class="oj-button-sm oj-sm-margin-2x-top"
                onClick={fetchUserApplications}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

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
