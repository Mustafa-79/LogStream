import { useState, useEffect } from "preact/hooks";
import "oj-c/progress-circle";
import "oj-c/button";
import { AuthManager } from "../../../utils/auth";
import SettingsService from "../../../services/settingsService";
import { NotificationsSection } from "./NotificationsSection";
import { DataRetentionSection } from "./DataRetentionSection";
import { Application, ApplicationStatus } from "./types";
import { 
  timePeriods, 
  retentionPeriods, 
  getTimePeriodDisplay 
} from "./constants";

export function Settings() {
  // Consolidated form state
  const [formData, setFormData] = useState({
    enableAlerts: true,
    selectedApplication: null as string | null,
    alertThreshold: "",
    timePeriod: "",
    dataRetentionPeriod: 30
  });
  
  // Data state
  const [dataState, setDataState] = useState({
    applications: [] as Application[],
    applicationStatus: [] as ApplicationStatus[]
  });
  
  // UI state
  const [uiState, setUIState] = useState({
    loading: true,
    error: null as string | null,
    validationErrors: {} as Record<string, string>
  });
  
  // Store initial state for reset functionality
  const [initialState, setInitialState] = useState({
    enableAlerts: true,
    applications: [] as Application[],
    applicationStatus: [] as ApplicationStatus[],
    dataRetentionPeriod: 30
  });
  
  const isAdmin = AuthManager.getCurrentUser()?.isAdmin || false;

  // Simplified helper functions (inline)
  const convertTimePeriodToDisplay = (minutes: number): string => {
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  };

  const convertPeriodToSeconds = (periodDisplay: string): number => {
    const match = /(\d+)\s*(minute|hour)s?/i.exec(periodDisplay);
    if (!match) return 300;
    const value = parseInt(match[1], 10);
    return match[2].toLowerCase().startsWith('minute') ? value * 60 : value * 3600;
  };

  // Simplified validation function
  const validateAlertThreshold = (value: string): string | null => {
    if (!value?.trim()) return "Alert threshold is required";
    
    const numValue = parseFloat(value.trim());
    if (isNaN(numValue) || numValue <= 0) return "Alert threshold must be a positive number";
    if (numValue > 1000) return "Alert threshold cannot exceed 1000";
    
    return null;
  };

  // Fetch user applications from API
  const fetchUserApplications = async () => {
    try {
      setUIState(prev => ({ ...prev, loading: true, error: null }));
      const userApps = await SettingsService.fetchUserApplications();
      
      // Sort applications by name alphabetically
      const sortedUserApps = [...userApps].sort((a, b) => a.name.localeCompare(b.name));
      
      // Transform user applications to dropdown format
      const appOptions: Application[] = sortedUserApps.map((app, index) => ({
        value: app.id, // Use the actual MongoDB ID as the value
        label: app.name
      }));
      
      // Transform user applications to status format
      const statusData: ApplicationStatus[] = sortedUserApps.map((app, index) => ({
        id: app.id,
        name: app.name,
        threshold: app.threshold.toString(),
        timePeriod: convertTimePeriodToDisplay(app.timePeriod),
        notificationsEnabled: app.notificationsEnabled
      }));
      
      setDataState({ applications: appOptions, applicationStatus: statusData });
      
      // Check if all applications have notifications disabled
      const allNotificationsDisabled = sortedUserApps.length === 0 || 
        sortedUserApps.every(app => !app.notificationsEnabled);
      
      const initialAlertsState = !allNotificationsDisabled;
      setFormData(prev => ({ ...prev, enableAlerts: initialAlertsState }));
      
      // Store initial state for reset functionality
      setInitialState({
        enableAlerts: initialAlertsState,
        applications: appOptions,
        applicationStatus: statusData,
        dataRetentionPeriod: formData.dataRetentionPeriod // Use current DRP value
      });
      
    } catch (err) {
      setUIState(prev => ({ ...prev, error: 'Failed to load user applications' }));
      console.error('Error fetching user applications:', err);
    } finally {
      setUIState(prev => ({ ...prev, loading: false }));
    }
  };

  // Fetch DRP from API
  const fetchDRP = async () => {
    try {
      const drp = await SettingsService.fetchDRP();
      setFormData(prev => ({ ...prev, dataRetentionPeriod: drp }));
      return drp;
    } catch (err) {
      console.error('Error fetching DRP:', err);
      // Keep the default value if API call fails
      return formData.dataRetentionPeriod;
    }
  };

  // Load all data (applications and DRP if admin)
  const loadAllData = async () => {
    await fetchUserApplications();
    // Only fetch DRP if user is admin
    if (isAdmin) {
      const drpValue = await fetchDRP();
      // Update initial state with fetched DRP
      setInitialState(prev => ({
        ...prev,
        dataRetentionPeriod: drpValue
      }));
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadAllData();
  }, [isAdmin]);

  const handleReset = () => {
    // Reset to initial state without backend calls
    setFormData({
      enableAlerts: initialState.enableAlerts,
      selectedApplication: null,
      alertThreshold: "",
      timePeriod: "",
      dataRetentionPeriod: initialState.dataRetentionPeriod
    });
    setDataState({
      applications: initialState.applications,
      applicationStatus: initialState.applicationStatus
    });
    setUIState(prev => ({ ...prev, validationErrors: {} }));
  };

  const handleSaveChanges = async () => {
    try {
      // Transform applicationStatus into the requested format
      const applicationsData = dataState.applicationStatus.reduce((acc, app, index) => {
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
        enableAlerts: formData.enableAlerts,
        applications: applicationsData,
        dataRetentionPeriod: formData.dataRetentionPeriod
      };
      
      // Send data to backend
      await SettingsService.saveSettings(saveData);
      
      // Refetch data after successful save to reflect DB changes
      await loadAllData();
      
      // Update initial state with the current state after successful save
      setInitialState({
        enableAlerts: formData.enableAlerts,
        applications: dataState.applications,
        applicationStatus: dataState.applicationStatus,
        dataRetentionPeriod: formData.dataRetentionPeriod
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    }
  };

  // Consolidated form handler
  const handleFormChange = (field: string, value: any, event?: any) => {
    switch (field) {
      case 'selectedApplication': {
        const selectedAppId = event?.detail?.value || value;
        setFormData(prev => ({ ...prev, selectedApplication: selectedAppId }));
        
        // Clear validation errors when changing application
        setUIState(prev => ({
          ...prev,
          validationErrors: { ...prev.validationErrors, alertThreshold: "" }
        }));
        
        // Find the corresponding application status by MongoDB ID
        const statusEntry = dataState.applicationStatus.find(app => app.id === selectedAppId);
        if (statusEntry) {
          setFormData(prev => ({
            ...prev,
            alertThreshold: statusEntry.threshold,
            timePeriod: timePeriods.find(p => p.label === statusEntry.timePeriod)?.value || ""
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            alertThreshold: "",
            timePeriod: ""
          }));
        }
        break;
      }
        
      case 'alertThreshold': {
        const newThreshold = event?.detail?.value || value;
        setFormData(prev => ({ ...prev, alertThreshold: newThreshold }));

        // Validate the threshold
        const validationError = validateAlertThreshold(newThreshold);
        setUIState(prev => ({
          ...prev,
          validationErrors: { ...prev.validationErrors, alertThreshold: validationError || "" }
        }));

        // Only update application status if validation passes
        if (!validationError) {
          updateApplicationStatus(newThreshold);
        }
        break;
      }
        
      case 'timePeriod': {
        const newPeriod = event?.detail?.value || value;
        setFormData(prev => ({ ...prev, timePeriod: newPeriod }));
        const periodDisplay = timePeriods.find(p => p.value === newPeriod)?.label || newPeriod;
        updateApplicationStatus(undefined, periodDisplay);
        break;
      }
        
      case 'dataRetentionPeriod':
        setFormData(prev => ({ ...prev, dataRetentionPeriod: event?.detail?.value || value }));
        break;
    }
  };

  // Consolidated toggle handler
  const handleToggleChange = (type: string, identifier: string, enabled: boolean) => {
    if (type === 'alerts') {
      setFormData(prev => ({ ...prev, enableAlerts: enabled }));
      if (!enabled) {
        // If disabling alerts, disable all application notifications
        setDataState(prev => ({
          ...prev,
          applicationStatus: prev.applicationStatus.map(app => ({ ...app, notificationsEnabled: false }))
        }));
      }
    } else if (type === 'status') {
      setDataState(prev => ({
        ...prev,
        applicationStatus: prev.applicationStatus.map(app => 
          app.name === identifier ? { ...app, notificationsEnabled: enabled } : app
        )
      }));
    }
  };

  const updateApplicationStatus = (threshold?: string, period?: string) => {
    if (!formData.selectedApplication) return;
    
    setDataState(prev => ({
      ...prev,
      applicationStatus: prev.applicationStatus.map(app => {
        if (app.id === formData.selectedApplication) {
          return {
            ...app,
            threshold: threshold ?? app.threshold,
            timePeriod: period ?? app.timePeriod
          };
        }
        return app;
      })
    }));
  };

  if (uiState.loading) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">Loading Settings...</div>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <oj-c-progress-circle
              class="oj-sm-margin-4x-vertical oj-sm-padding-4x"
              aria-labelledby="lgLabel indetLabel"
              size="lg"
              value={-1}
            ></oj-c-progress-circle>
          </div>
        </div>
      </div>
    );
  }

  if (uiState.error) {
    return (
      <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
        <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
          <div class="oj-typography-heading-md oj-sm-margin-2x-bottom" style={{ color: 'var(--oj-core-color-danger)' }}>
            Error loading settings page
          </div>
          <p class="oj-typography-body-md oj-sm-margin-2x-bottom">{uiState.error}</p>
          <oj-button class="oj-button-primary" onojAction={fetchUserApplications}>
            Retry
          </oj-button>
        </div>
      </div>
    );
  }

  return (
    <div class="oj-web-applayout-page" style="padding: 40px;">
      {/* Inline Settings Header */}
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
            onojAction={handleReset}
          />
          <oj-c-button 
            label="Save Changes"
            chroming="callToAction"
            onojAction={handleSaveChanges}
          />
        </div>
      </div>

      <NotificationsSection
        enableAlerts={formData.enableAlerts}
        applications={dataState.applications}
        timePeriods={timePeriods}
        selectedApplication={formData.selectedApplication}
        alertThreshold={formData.alertThreshold}
        timePeriod={formData.timePeriod}
        applicationStatus={dataState.applicationStatus}
        validationErrors={uiState.validationErrors}
        onAlertsToggle={(enabled: boolean) => handleToggleChange('alerts', '', enabled)}
        onApplicationChange={(event: any) => handleFormChange('selectedApplication', null, event)}
        onThresholdChange={(event: any) => handleFormChange('alertThreshold', null, event)}
        onTimePeriodChange={(event: any) => handleFormChange('timePeriod', null, event)}
        onStatusToggle={(appName: string, enabled: boolean) => handleToggleChange('status', appName, enabled)}
        getTimePeriodDisplay={getTimePeriodDisplay}
      />

      {isAdmin && (
        <DataRetentionSection
          retentionPeriods={retentionPeriods}
          dataRetentionPeriod={formData.dataRetentionPeriod}
          onRetentionChange={(event: any) => handleFormChange('dataRetentionPeriod', null, event)}
        />
      )}

      <style>{`
        .settings-config-section,
        .settings-status-section {
          flex: 1;
          max-width: 100%;
        }
        
        @media (max-width: 768px) {
          .settings-config-section,
          .settings-status-section {
            min-width: unset !important;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
