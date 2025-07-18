import "ojs/ojbutton";

interface NotificationBannerProps {
  successMessage?: string | null;
  deletedGroup?: any | null;
  onDismissSuccess?: () => void;
  onUndoDelete?: () => void;
  onDismissUndo?: () => void;
}

export function NotificationBanner({
  successMessage,
  deletedGroup,
  onDismissSuccess,
  onUndoDelete,
  onDismissUndo
}: NotificationBannerProps) {
  return (
    <>
      {/* Success Message */}
      {successMessage && (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-1x-vertical">
          <div class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-4x" style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724',
            minWidth: '400px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <div class="oj-flex oj-sm-flex-items-center" style={{ alignItems: 'center' }}>
              <span class="oj-ux-ico-checkmark-s oj-sm-margin-2x-end" style={{ fontSize: '18px', color: '#28a745' }}></span>
              <span class="oj-typography-body-md">{successMessage}</span>
            </div>
            <oj-button
              display="icons"
              chroming="borderless"
              onojAction={onDismissSuccess}
              style={{ color: '#155724' }}
            >
              <span slot='startIcon' class='oj-ux-ico-close'></span>
            </oj-button>
          </div>
        </div>
      )}

      {/* Undo Delete Notification */}
      {deletedGroup && (
        <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-1x-vertical">
          <div class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-4x" style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            borderRadius: '8px',
            color: '#155724',
            minWidth: '400px',
            maxWidth: '600px',
            width: '100%'
          }}>
            <div class="oj-flex oj-sm-flex-items-center" style={{ alignItems: 'center' }}>
              <span class="oj-ux-ico-checkmark-s oj-sm-margin-2x-end" style={{ fontSize: '18px', color: '#28a745' }}></span>
              <span class="oj-typography-body-md">
                User group <strong>"{deletedGroup.name}"</strong> has been deleted.
              </span>
            </div>
            <div class="oj-flex oj-sm-flex-items-center" style={{ gap: '8px' }}>
              <oj-button
                chroming="outlined"
                onojAction={onUndoDelete}
                style={{
                  borderColor: '#28a745',
                  color: '#28a745',
                  backgroundColor: 'transparent'
                }}
              >
                <span slot='startIcon' class='oj-ux-ico-undo'></span>
                Undo
              </oj-button>
              <oj-button
                display="icons"
                chroming="borderless"
                onojAction={onDismissUndo}
                style={{ color: '#155724' }}
              >
                <span slot='startIcon' class='oj-ux-ico-close'></span>
              </oj-button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
