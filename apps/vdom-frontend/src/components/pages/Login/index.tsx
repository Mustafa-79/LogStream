import { registerCustomElement } from "ojs/ojvcomponent";
import { useState } from "preact/hooks";
import { AuthManager } from "../../../utils/auth";
import "ojs/ojbutton";
import "ojs/ojlabel";
import "ojs/ojformlayout";
import Color = require("ojs/ojcolor");
import { AUTH_CONFIG } from "../../../config";

const GOOGLE_CLIENT_ID = AUTH_CONFIG.VITE_GOOGLE_CLIENT_ID;

type Props = Readonly<{
  loginSuccess?: () => void;
}>;

export const Login = registerCustomElement(
  "login-page",
  ({ loginSuccess }: Props) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // For demo purposes, simulate Google OAuth flow
        // In production, you would integrate with actual Google OAuth
        
        // Create Google OAuth URL
        const googleAuthUrl = AUTH_CONFIG.VITE_GOOGLE_AUTH_URL + '?' +
          `client_id=${GOOGLE_CLIENT_ID}&` +
          'response_type=token&' +
          'scope=openid email profile&' +
          'redirect_uri=' + encodeURIComponent(AUTH_CONFIG.VITE_REDIRECT_URI);

        // Open popup for OAuth
        const popup = window.open(
          googleAuthUrl,
          'google-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );

        if (!popup) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        // Listen for OAuth callback
        const handleOAuthCallback = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          
          if (event.data.type === 'OAUTH_SUCCESS') {
            AuthManager.loginWithGoogle(event.data.accessToken)
              .then(() => {
                window.removeEventListener('message', handleOAuthCallback);
                popup?.close();
                loginSuccess?.();
              })
              .catch((err: any) => {
                setError(err.message);
                setIsLoading(false);
                popup?.close();
              });
          } else if (event.data.type === 'OAUTH_ERROR') {
            setError(event.data.error);
            setIsLoading(false);
            popup?.close();
          }
        };

        window.addEventListener('message', handleOAuthCallback);

        // Check if popup is closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleOAuthCallback);
            setIsLoading(false);
          }
        }, 1000);

      } catch (err: any) {
        setError(err.message || 'Login failed');
        setIsLoading(false);
      }
    };

    return (
      <div class="oj-flex oj-flex-items-center oj-flex-justify-center oj-bg-neutral-20" 
           style="min-height: 100vh; height: 100vh; width: 100vw; position: fixed; top: 0; left: 0; padding: var(--oj-spacing-4x);">
        <div class="oj-panel" 
             style="max-width: 600px; width: 100%; border-radius: 10px; margin: auto; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07), 0 10px 20px rgba(0, 0, 0, 0.1), 0 20px 40px rgba(0, 0, 0, 0.08);">
          
          {/* Header Section */}
          <div style="text-align: center;">
            <img 
              src="/assets/logstream-logo.svg" 
              alt="LogStream Logo" 
              style="width: 240px; height: auto; display: block; margin: 20px auto;"
              onError={(e: any) => {
                e.target.style.display = 'none';
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div class="oj-bg-warning-30" style=" width: 80%; text-align: center; padding: 1rem 0; margin: 1rem auto; border: 1px solid red; border-radius: 8px;">
              <div>{error}</div>
            </div>
          )}

          {/* Login Form */}
          <oj-form-layout maxColumns={1} labelEdge="start">
            <oj-button
              disabled={isLoading}
              onojAction={handleGoogleLogin}
              style="width:80%; min-height: 44px; border-radius: var(--oj-border-radius-md); margin: 0 auto 20px auto; display: block;"
            >
              <span slot="startIcon" class="oj-icon oj-ux-ico-google" style="font-size: 16px;"></span>
              <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </oj-button>
          </oj-form-layout>
        </div>

        <style>{`
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .oj-flex {
              padding: var(--oj-spacing-2x) !important;
            }
            
            img {
              width: 200px !important;
            }
          }
        `}</style>
      </div>
    );
  }
)