
import { h } from "preact";
import { useState, useEffect, useRef } from "preact/hooks";
import "ojs/ojbutton";
import "ojs/ojpopup";
import "oj-c/button";
import { useAlerts } from "../hooks/useAlerts";
import { Alert } from "../services/alertService";
import "ojs/ojbutton";
import "oj-c/progress-circle";

export function Notifications() {
  const { alerts, loading, error, refetch, resolveAlert } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const [resolvingAlerts, setResolvingAlerts] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = alerts.filter(alert => !alert.resolved).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkResolved = async (alertId: string) => {
    setResolvingAlerts(prev => new Set(prev).add(alertId));
    
    try {
      await resolveAlert(alertId);
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    } finally {
      setResolvingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };


  const renderPopupContent = () => (
    <div class="oj-panel oj-panel-shadow-sm" style="position: absolute; top: 100%; right: 0; z-index: 1000; width: 320px; max-height: 400px; overflow-y: auto; background: white;">
      <div class="oj-panel-header">
        <h3 class="oj-panel-title">Notifications ({unreadCount} unread)</h3>
      </div>
      <div class="oj-panel-body oj-sm-padding-0">
        {loading ? (
          <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
            <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
              <div class="oj-typography-heading-md oj-sm-margin-2x-bottom">Loading notifications...</div>
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
        ) : error ? (
          <div class="oj-sm-12 oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
            <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
              <div class="oj-typography-heading-md oj-sm-margin-2x-bottom" style={{ color: 'var(--oj-core-color-danger)' }}>
                Error loading notifications
              </div>
              <p class="oj-typography-body-md oj-sm-margin-2x-bottom">{error}</p>
              <oj-c-button class="oj-button-primary" onojAction={() => refetch()}>
                Retry
              </oj-c-button>
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <div class="oj-sm-padding-4x oj-sm-text-align-center">
            <span class="oj-typography-body-sm oj-text-color-secondary">No notifications</span>
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={alert._id}
              class={`oj-sm-padding-2x ${index !== alerts.length - 1 ? 'oj-sm-border-bottom' : ''} ${alert.resolved ? 'oj-disabled' : ''}`}
            >
              <div class="oj-flex oj-sm-align-items-flex-start oj-sm-justify-content-space-between">
                <div class="oj-flex-item">
                  <div class="oj-typography-body-md oj-typography-bold oj-sm-margin-1x-bottom">
                    Error Threshold Exceeded
                  </div>
                  <div class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-1x-bottom">
                    {alert.applicationName ? alert.applicationName : 'Unknown Application'} ({alert.appId})
                  </div>
                  <div class="oj-typography-body-sm oj-text-color-secondary oj-sm-margin-1x-bottom">
                    {alert.errorCount} errors in {alert.period} minutes (threshold: {alert.threshold})
                  </div>
                  <div class="oj-typography-caption oj-text-color-tertiary">
                    {formatTimestamp(alert.timestamp)}
                  </div>
                </div>

                {!alert.resolved && (
                  <oj-c-button
                    size="sm"
                    chroming="outlined"
                    disabled={resolvingAlerts.has(alert._id)}
                    onojAction={() => handleMarkResolved(alert._id)}
                    label={resolvingAlerts.has(alert._id) ? "Resolving..." : "Mark as resolved"}
                    class="oj-sm-margin-start"
                  >
                    <span slot="startIcon" class={resolvingAlerts.has(alert._id) ? "oj-ux-ico-clock" : "oj-ux-ico-check"}></span>
                  </oj-c-button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} style="position: relative;">
      <oj-c-button
        display="icons"
        chroming="borderless"
        onojAction={() => setIsOpen(!isOpen)}
        label="Notifications"
      >
        <span
          slot="startIcon"
          class="oj-ux-ico-bell-ring"
        ></span>
      </oj-c-button>

      {isOpen && renderPopupContent()}
    </div>
  );
};
