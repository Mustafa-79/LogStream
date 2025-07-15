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
  const [dataRetentionPeriod, setDataRetentionPeriod] = useState(30);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
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

  const convertPeriodToSeconds = (periodDisplay: string): number => {
      // Extract number and unit from strings like "5 minutes", "1 hour", "30 minutes"
      const regex = /(\d+)\s*(minute|minutes|hour|hours?)/i;
      const match = regex.exec(periodDisplay);
      
      if (!match) {
        return 300; // Default to 5 minutes if parsing fails
      }
      
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      
      // Convert to seconds based on unit
      if (unit.startsWith('minute')) {
        return value * 60; // minutes to seconds
      } else if (unit.startsWith('hour')) {
        return value * 3600; // hours to seconds
      }
      
      return 300; // Default fallback
    };

  // Validation function for alert threshold
  const validateAlertThreshold = (value: string): string | null => {
    if (!value || value.trim() === "") {
      return "Alert threshold is required";
    }

    // Remove any whitespace
    const trimmedValue = value.trim();
    
    // Check if the value contains only digits and at most one decimal point
    const numericRegex = /^\d+(\.\d+)?$/;
    if (!numericRegex.test(trimmedValue)) {
      return "Alert threshold must be a valid number (digits only)";
    }

    const numValue = parseFloat(trimmedValue);
    
    // Check if it's positive
    if (numValue <= 0) {
      return "Alert threshold must be a positive number";
    }

    // Check upper limit
    if (numValue > 1000) {
      return "Alert threshold cannot exceed 1000";
    }

    return null; // Valid
  };

  // Fetch user applications from API
  const fetchUserApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      const userApps = await SettingsService.fetchUserApplications();
      
      // Sort applications by name alphabetically
      const sortedUserApps = [...userApps].sort((a, b) => a.name.localeCompare(b.name));
      
      // Transform user applications to dropdown format
      const appOptions: Application[] = sortedUserApps.map((app, index) => ({
        value: app.id, // Use the actual MongoDB ID as the value
        label: app.name
      }));
      setApplications(appOptions);
      
      // Transform user applications to status format
      const statusData: ApplicationStatus[] = sortedUserApps.map((app, index) => ({
        id: app.id,
        name: app.name,
        threshold: app.threshold.toString(),
        timePeriod: convertTimePeriodToDisplay(app.timePeriod),
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

  // Fetch DRP from API
  const fetchDRP = async () => {
    try {
      const drp = await SettingsService.fetchDRP();
      console.log('Fetched DRP:', drp);
      setDataRetentionPeriod(drp);
    } catch (err) {
      console.error('Error fetching DRP:', err);
      // Keep the default value if API call fails
    }
  };

  // Load all data (applications and DRP if admin)
  const loadAllData = async () => {
    await fetchUserApplications();
    // Only fetch DRP if user is admin
    if (isAdmin) {
      await fetchDRP();
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, [isAdmin]);

  const handleReset = () => {
    setSelectedApplication(null);
    setAlertThreshold("");
    setTimePeriod("");
    setEnableAlerts(true);
    setValidationErrors({});
    // Reload data from API
    loadAllData();
  };

  const handleSaveChanges = () => {
    // Transform applicationStatus into the requested format
    const applicationsData = applicationStatus.reduce((acc, app, index) => {
      acc[index + 1] = {
        id: app.id, // MongoDB object ID
        name: app.name,
        threshold: app.threshold,
        period: convertPeriodToSeconds(app.timePeriod),
        status: app.notificationsEnabled // Use notificationsEnabled directly
      };
      return acc;
    }, {} as Record<number, { id: string; name: string; threshold: string; period: number; status: boolean }>);

    const saveData = {
      enableAlerts,
      applications: applicationsData,
      dataRetentionPeriod: dataRetentionPeriod
    };

    console.log('Save Changes:', saveData);
  };

  const handleApplicationChange = (event: any) => {
    const selectedAppId = event.detail.value;
    setSelectedApplication(selectedAppId);
    
    // Clear validation errors when changing application
    setValidationErrors(prev => ({
      ...prev,
      alertThreshold: ""
    }));
    
    // Find the corresponding application status by MongoDB ID
    const statusEntry = applicationStatus.find(app => app.id === selectedAppId);
    if (statusEntry) {
      setAlertThreshold(statusEntry.threshold);
      // Match the time period from status display format to dropdown value
      const periodValue = timePeriods.find(p => p.label === statusEntry.timePeriod)?.value || "";
      setTimePeriod(periodValue);
    } else {
      setAlertThreshold("");
      setTimePeriod("");
    }
  };

  const handleStatusToggle = (appName: string, enabled: boolean) => {
    setApplicationStatus(prev => 
      prev.map(app => app.name === appName ? { ...app, notificationsEnabled: enabled } : app)
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
    
    // Set the value regardless (for user to see what they typed)
    setAlertThreshold(newThreshold);

    // Validate the threshold
    const validationError = validateAlertThreshold(newThreshold);
    setValidationErrors(prev => ({
      ...prev,
      alertThreshold: validationError || ""
    }));

    // Only update application status if validation passes
    if (!validationError) {
      updateApplicationStatus(newThreshold);
    }
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
        validationErrors={validationErrors}
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
