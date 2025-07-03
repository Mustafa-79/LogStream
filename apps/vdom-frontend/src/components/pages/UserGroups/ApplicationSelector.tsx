import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { IApplication } from './types';

import 'ojs/ojcheckboxset';
import 'ojs/ojoption';

interface ApplicationSelectorProps {
  applications: IApplication[];
  selectedApplications: string[];
  onSelectionChange: (selectedApps: string[]) => void;
  error?: string;
  disabled?: boolean;
}

export function ApplicationSelector({ applications, selectedApplications, onSelectionChange, error, disabled = false }: ApplicationSelectorProps) {

  const [selectAllChecked, setSelectAllChecked] = useState(false);

  // Filter out deleted applications and only show active ones
  const activeApplications = applications.filter(app => app.active && !app.deleted);

  useEffect(() => {
    // Update select all state based on current selection
    setSelectAllChecked(selectedApplications.length === activeApplications.length && activeApplications.length > 0);
  }, [selectedApplications, activeApplications]);

  const handleSelectAllToggle = () => {
    const isChecked = !selectAllChecked;
    setSelectAllChecked(isChecked);
    if (isChecked) {
      onSelectionChange(activeApplications.map(app => app._id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleApplicationsToggle = (newSelection: string[]) => {
    onSelectionChange(newSelection);
    // Update select all state based on new selection
    setSelectAllChecked(newSelection.length === activeApplications.length && activeApplications.length > 0);
  };

  // const handleApplicationToggle = (appId: string) => {
  //   const isSelected = selectedApplications.includes(appId);
  //   let newSelection: string[];

  //   if (isSelected) {
  //     newSelection = selectedApplications.filter(id => id !== appId);
  //   } else {
  //     newSelection = [...selectedApplications, appId];
  //   }

  //   onSelectionChange(newSelection);
  // };

  return (
    <div class={`application-selector ${disabled ? 'oj-disabled' : ''}`}>
      {/* Select All Option */}
      <div class="oj-flex oj-sm-flex-items-center oj-sm-margin-2x-bottom">
        <oj-checkboxset
          value={selectAllChecked ? ['selectAll'] : []}
          onvalueChanged={(event: any) => {
            if (disabled) return;
            const isChecked = event.detail.value.includes('selectAll');
            if (isChecked !== selectAllChecked) {
              handleSelectAllToggle();
            }
          }}
          disabled={disabled}
        >
          <oj-option value="selectAll">
            <span class="oj-typography-body-md" style={{ fontWeight: 'bold' }}>
              Select All Applications ({activeApplications.length})
            </span>
          </oj-option>
        </oj-checkboxset>
      </div>


      {/* Applications List */}
      <div class={`oj-panel oj-panel-alt1 ${error ? 'oj-invalid' : ''} ${disabled ? 'oj-disabled' : ''}`} style={{
        maxHeight: '200px',
        overflow: 'auto',
        border: error ? '1px solid #d32f2f' : '1px solid #e0e0e0',
        borderRadius: '4px',
        padding: '8px',
        opacity: disabled ? '0.6' : '1'
      }}>
        {activeApplications.length === 0 ? (
          <div class="oj-typography-body-sm" style={{ color: '#666', textAlign: 'center', padding: '16px' }}>
            No applications available
          </div>
        ) : (
          <oj-checkboxset
            value={selectedApplications}
            onvalueChanged={(event: any) => !disabled && handleApplicationsToggle(event.detail.value)}
            class="oj-sm-padding-2x"
            disabled={disabled}
          >
            {activeApplications.map(app => (
              <oj-option key={app._id} value={app._id}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span class="oj-typography-body-md" style={{ fontWeight: '500' }}>{app.name}</span>
                  <span class="oj-typography-body-xs" style={{ color: '#666' }}>{app.description}</span>
                </div>
              </oj-option>
            ))}
          </oj-checkboxset>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div class="oj-text-color-danger oj-typography-body-xs oj-sm-margin-1x-top">
          {error}
        </div>
      )}

      {/* Disabled Message for Administrators Group */}
      {disabled && (
        <div class="oj-typography-body-xs oj-text-color-secondary oj-sm-margin-1x-top">
          The administrators group applications cannot be changed
        </div>
      )}

      {/* Selection Summary */}
      <div class="oj-flex oj-sm-justify-content-space-between oj-sm-margin-2x-top">
        <span class="oj-typography-body-sm" style={{ color: '#666' }}>
          {selectedApplications.length} of {activeApplications.length} applications selected
        </span>
      </div>


      {/* Selected Applications Summary */}
      {selectedApplications.length > 0 && (
        <div class="oj-sm-margin-2x-top">
          <div class="oj-typography-body-sm" style={{ color: '#666', marginBottom: '4px' }}>
            Selected Applications:
          </div>
          <div class="oj-flex oj-sm-flex-wrap" style={{ gap: '4px' }}>
            {selectedApplications.map(appId => {
              const app = activeApplications.find(a => a._id === appId);
              return app ? (
                <span key={appId} class="oj-badge oj-badge-success oj-typography-body-xs">
                  {app.name}
                </span>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
