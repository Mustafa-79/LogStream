
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
    <div
      class="oj-panel oj-panel-shadow-lg"
      style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, width: 'clamp(320px, 30vw, 600px)', maxHeight: '60vh', minHeight: '120px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
    >
      <div class="oj-panel-header oj-sm-padding-4x-bottom" style={{ position: 'sticky', top: 0, zIndex: 2, background: 'inherit', width: '100%' }}>
        <h3 class="oj-typography-heading-md oj-panel-title" style={{ width: '100%' }}>Alerts ({unreadCount} unresolved)</h3>
      </div>
      <div class="oj-panel-body oj-sm-padding-0" style={{ overflowY: 'auto', width: '100%' }}>
        {loading ? (
          <div class="oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
            <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
              <div class="oj-typography-body-md oj-sm-margin-2x-bottom">Loading alerts...</div>
              <div class="oj-flex oj-sm-justify-content-center oj-sm-width-full">
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
          <div class="oj-flex oj-sm-justify-content-center oj-sm-padding-8x">
            <div class="oj-flex oj-sm-flex-direction-column oj-sm-flex-items-center">
              <div class="oj-typography-body-md oj-sm-margin-2x-bottom oj-text-color-danger">
                Error loading alerts
              </div>
              <p class="oj-typography-body-md oj-sm-margin-2x-bottom">{error}</p>
              <oj-c-button class="oj-button-primary" onojAction={() => refetch()}>
                Retry
              </oj-c-button>
            </div>
          </div>
        ) : alerts.length === 0 ? (
          <div class="oj-sm-padding-4x oj-sm-text-align-center">
            <span class="oj-typography-body-md oj-text-color-secondary">No alerts</span>
          </div>
        ) : (
          <div class="oj-flex oj-sm-flex-direction-column">
            {alerts.map((alert, index) => (
              <div
                key={alert._id}
                class={`oj-sm-padding-2x oj-flex oj-sm-align-items-center oj-sm-border-radius oj-bg-neutral-10 oj-sm-border-1`}
                style={{ borderColor: 'var(--oj-core-divider-color)', borderStyle: 'solid', borderWidth: '1px', marginBottom: '12px' }}
              >
                {/* LEFT SIDE: TEXT */}
                <div class="oj-flex-item oj-flex oj-sm-flex-direction-column" style={{ flex: 1, minWidth: 0 }}>
                  <div class="oj-typography-body-md oj-typography-bold oj-sm-margin-1x-bottom">
                    Error Threshold Exceeded
                  </div>
                  <div class="oj-typography-body-md oj-text-color-primary oj-sm-margin-1x-bottom">
                    {alert.applicationName || 'Unknown App'}
                  </div>
                  <div class="oj-typography-body-md oj-sm-margin-1x-bottom">
                    {alert.errorCount} errors in {alert.period} minutes
                  </div>
                  <div class="oj-typography-caption oj-text-color-tertiary">
                    {formatTimestamp(alert.timestamp)}
                  </div>
                </div>
                {/* RIGHT SIDE: ACTION */}
                {!alert.resolved && (
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
                    <oj-c-button
                      chroming="outlined"
                      display="icons"
                      size="sm"
                      onojAction={() => handleMarkResolved(alert._id)}
                      disabled={resolvingAlerts.has(alert._id)}
                      label="Mark as Resolved"
                    >
                      <span
                        slot="startIcon"
                        class={resolvingAlerts.has(alert._id) ? "oj-ux-ico-clock" : "oj-ux-ico-check"}
                      ></span>
                    </oj-c-button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} class="oj-flex oj-sm-align-items-center oj-sm-justify-content-end" style={{ position: 'relative' }}>
      <oj-c-button
        display="icons"
        chroming="borderless"
        onojAction={() => setIsOpen(!isOpen)}
        label={
          unreadCount === 0 ? "No Alerts"
            : unreadCount === 1 ? "1 Alert"
            : `${unreadCount} Alerts`
        }
      >
        <span
          slot="startIcon"
          class={
            unreadCount === 0
              ? "oj-ux-ico-bell-ring"
              : "oj-ux-ico-bell-ring-s"
          }
        ></span>
      </oj-c-button>
      {isOpen && renderPopupContent()}
    </div>
  );
};
