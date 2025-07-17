import { h } from "preact";
import "ojs/ojbutton";

interface NotificationBannerProps {
  message: string | null;
  onClose: () => void;
  type?: 'success' | 'error';
}

export function NotificationBanner({ message, onClose, type = 'success' }: NotificationBannerProps) {
  if (!message) return null;

  const styles = {
    success: {
      backgroundColor: '#d4edda',
      border: '1px solid #c3e6cb',
      color: '#155724',
      iconClass: 'oj-ux-ico-checkmark-s',
      iconColor: '#28a745'
    },
    error: {
      backgroundColor: '#f8d7da',
      border: '1px solid #f5c6cb',
      color: '#721c24',
      iconClass: 'oj-ux-ico-error',
      iconColor: '#dc3545'
    }
  };

  const style = styles[type];

  return (
    <div class="oj-flex oj-sm-justify-content-center oj-sm-margin-1x-vertical">
      <div 
        class="oj-flex oj-sm-flex-items-center oj-sm-justify-content-space-between oj-sm-padding-4x" 
        style={{
          backgroundColor: style.backgroundColor,
          border: style.border,
          borderRadius: '8px',
          color: style.color,
          minWidth: '400px',
          maxWidth: '600px',
          width: '100%'
        }}
      >
        <div class="oj-flex oj-sm-flex-items-center" style={{ alignItems: 'center' }}>
          <span 
            class={`${style.iconClass} oj-sm-margin-2x-end`} 
            style={{ fontSize: '18px', color: style.iconColor }}
          ></span>
          <span class="oj-typography-body-md">{message}</span>
        </div>
        <oj-button
          display="icons"
          chroming="borderless"
          onojAction={onClose}
          style={{ color: style.color }}
        >
          <span slot='startIcon' class='oj-ux-ico-close'></span>
        </oj-button>
      </div>
    </div>
  );
}