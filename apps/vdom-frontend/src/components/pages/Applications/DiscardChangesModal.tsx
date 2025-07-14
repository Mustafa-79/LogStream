import { h } from "preact";
import "oj-c/button";

interface DiscardChangesModalProps {
  showDiscardConfirm: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DiscardChangesModal({ 
  showDiscardConfirm, 
  onConfirm, 
  onCancel 
}: DiscardChangesModalProps) {
  if (!showDiscardConfirm) return null;

  return (
    <div class="modal-overlay" style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    ">
      <div class="modal-content oj-panel" style="
        background: white;
        border-radius: 8px;
        padding: 24px;
        width: 400px;
        max-width: 90vw;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      ">
        <div style="margin-bottom: 20px;">
          <div class="oj-flex oj-align-items-start" style="gap: 12px; margin-bottom: 16px;">
            <span 
              class="oj-ux-ico-warning" 
              style="
                color: #f59e0b; 
                font-size: 20px; 
                margin-top: 2px;
                flex-shrink: 0;
              "
            ></span>
            <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #111827; font-family: 'Poppins', sans-serif;">
              Discard Changes?
            </h2>
          </div>
          <p style="margin: 0; color: #6b7280; font-size: 0.875rem; font-family: 'Poppins', sans-serif; line-height: 1.5;">
            You have unsaved changes. Are you sure you want to discard them?
          </p>
          <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 0.8rem; font-family: 'Poppins', sans-serif;">
            This action cannot be undone.
          </p>
        </div>

        <div class="oj-flex oj-justify-content-flex-end" style="gap: 12px;">
          <oj-button
            onojAction={onCancel}
            style="border: 1px solid #d1d5db; color: #374151;"
          >
            Continue Editing
          </oj-button>
          <oj-button
            onojAction={onConfirm}
            style="--oj-button-bg-color: #ef4444; --oj-button-text-color: white; border: none;"
          >
            Discard Changes
          </oj-button>
        </div>
      </div>
    </div>
  );
}