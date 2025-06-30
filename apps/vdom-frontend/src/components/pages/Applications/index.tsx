/**
 * @license
 * Copyright (c) 2014, 2025, Oracle and/or its affiliates.
 * Licensed under The Universal Permissive License (UPL), Version 1.0
 * as shown at https://oss.oracle.com/licenses/upl/
 * @ignore
 */
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import ApplicationService from "../../../services/applicationService";

// Type definitions
type ApplicationStatus = 'active' | 'warning' | 'inactive';

interface Application {
  id: string;
  name: string;
  description: string;
  status: ApplicationStatus;
  lastUpdate: string;
  logsToday: number;
  errors: number;
}

export function Applications() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch applications on component mount
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const data = await ApplicationService.fetchAllApplications();
        console.log('Fetched applications:', data);
        setApplications(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  const getStatusBadge = (status: ApplicationStatus) => {
    const statusConfig: Record<ApplicationStatus, { class: string; text: string }> = {
      active: { class: 'oj-badge oj-badge-success', text: 'active' },
      warning: { class: 'oj-badge oj-badge-warning', text: 'warning' },
      inactive: { class: 'oj-badge oj-badge-danger', text: 'inactive' }
    };
    
    return statusConfig[status] || statusConfig.inactive;
  };

  const handleAddApplication = () => {
    console.log('Add Application clicked');
  };

  const handleApplicationSettings = (appId: string) => {
    console.log('Settings clicked for:', appId);
  };

  // Loading state
  if (loading) {
    return (
      <div class="oj-web-applayout-page" style="padding: 40px;">
        <div class="oj-flex oj-justify-content-center oj-align-items-center" style="height: 200px;">
          <span>Loading applications...</span>
        </div>
      </div>
    );
  }

  return (
    <div class="oj-web-applayout-page" style="padding: 40px;">
      {/* Header */}
      <div class="oj-flex oj-justify-content-space-between oj-align-items-start" style="margin-bottom: 24px;">
        <div style="flex: 1;">
          <h1 class="oj-header-page-title" style="color: #6366f1; margin: 0; font-size: 2rem; font-weight: 600; font-family: 'Poppins', sans-serif;">
            Applications
          </h1>
          <div class="oj-flex oj-align-items-center" style="margin-top: 4px; gap: 8px;">
            <span style="color: #6b7280; font-size: 0.975rem; font-family: 'Poppins', sans-serif;">
              Manage and monitor all your connected applications.
            </span>
            <div class="oj-flex oj-align-items-center" style="gap: 4px;">
              <span class="oj-badge oj-badge-success" style="width: 8px; height: 8px; border-radius: 50%; padding: 0;"></span>
              <span style="color: #6b7280; font-size: 0.875rem;">Live Status</span>
            </div>
          </div>
        </div>
        <div style="flex-shrink: 0; margin-left: 16px;">
            <oj-button 
            class="oj-button-primary"
            onojAction={handleAddApplication}
            style="background: #6366f1; border-color: #6366f1;">
            <span slot="startIcon" class="oj-ux-ico-plus"></span>
            Add Application
            </oj-button>
        </div>
      </div>

      {/* Applications Grid */}
      <div class="oj-flex oj-flex-wrap" style="gap: 24px;">
        {applications.map(app => {
          const statusBadge = getStatusBadge(app.status);
          
          return (
            <div 
              key={app.id}
              class="oj-panel oj-panel-shadow-sm"
              style="
                flex: 1;
                min-width: 400px;
                width: '100%';
                max-width: 400px;
                padding: 20px;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
                background: white;
              "
            >
              {/* Card Header */}
              <div class="oj-flex oj-justify-content-space-between oj-align-items-start" style="margin-bottom: 16px;">
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 4px 0; font-size: 1.125rem; font-weight: 600; color: #111827;">
                    {app.name}
                  </h3>
                  <p style="margin: 0; color: #6b7280; font-size: 0.875rem;">
                    {app.description}
                  </p>
                </div>
                <oj-button 
                  display="icons" 
                  chroming="borderless"
                  onojAction={() => handleApplicationSettings(app.id)}
                >
                  <span slot="startIcon" class="oj-ux-ico-settings"></span>
                </oj-button>
              </div>

              {/* Status and Last Update */}
              <div class="oj-flex oj-justify-content-space-between oj-align-items-center" style="margin-bottom: 16px;">
                <span class={statusBadge.class} style="font-size: 0.75rem; padding: 4px 8px;">
                  {statusBadge.text}
                </span>
                <span style="color: #6b7280; font-size: 0.875rem;">
                  {app.lastUpdate}
                </span>
              </div>

              {/* Metrics */}
              <div style="border-top: 1px solid #f3f4f6; padding-top: 16px;">
                <div class="oj-flex oj-justify-content-space-between" style="margin-bottom: 8px;">
                  <span style="color: #374151; font-size: 0.875rem;">Logs today:</span>
                  <span style="color: #6366f1; font-weight: 600; font-size: 0.875rem;">
                    {app.logsToday}
                  </span>
                </div>
                <div class="oj-flex oj-justify-content-space-between">
                  <span style="color: #374151; font-size: 0.875rem;">Errors:</span>
                  <span style="color: #ef4444; font-weight: 600; font-size: 0.875rem;">
                    {app.errors}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {applications.length === 0 && !loading && (
        <div class="oj-flex oj-justify-content-center oj-align-items-center" style="height: 200px;">
          <div style="text-align: center;">
            <h3 style="color: #6b7280; margin-bottom: 8px;">No applications found</h3>
            <p style="color: #9ca3af;">Click "Add Application" to get started.</p>
          </div>
        </div>
      )}
    </div>
  );
}