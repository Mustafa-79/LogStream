import { h } from "preact";
import "oj-c/button";

interface DeleteConfirmationModalProps {
  showDeleteConfirm: boolean;
  deleteError: string | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteConfirmationModal({
  showDeleteConfirm,
  deleteError,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteConfirmationModalProps) {
  if (!showDeleteConfirm) return null;

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
          <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: #111827; font-family: 'Poppins', sans-serif;">
            Delete Application
          </h2>
          <p style="margin: 16px 0 0 0; color: #6b7280; font-size: 0.875rem; font-family: 'Poppins', sans-serif;">
            Are you sure you want to delete this application? This action cannot be undone and will permanently remove all associated data.
          </p>
        </div>

        {deleteError && (
          <div style="
            margin-bottom: 16px;
            background-color: #fef2f2;
            color: #b91c1c;
            padding: 12px;
            border: 1px solid #fca5a5;
            border-radius: 6px;
            font-size: 0.875rem;
            font-family: 'Poppins', sans-serif;
          ">
            {deleteError}
          </div>
        )}

        <div class="oj-flex oj-justify-content-flex-end" style="gap: 12px;">
          <oj-button
            onojAction={onClose}
            disabled={isDeleting}
            style="border: 1px solid #d1d5db; color: #374151;"
          >
            Cancel
          </oj-button>
          <oj-button
            onojAction={onConfirm}
            disabled={isDeleting}
            style="--oj-button-bg-color: #ef4444; --oj-button-text-color: white; border: none;"
          >
            {isDeleting ? 'Deleting...' : 'Delete Application'}
          </oj-button>
        </div>
      </div>
    </div>
  );
}