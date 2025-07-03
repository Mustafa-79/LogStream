import { registerCustomElement } from "ojs/ojvcomponent";
import { useState } from "preact/hooks";
import { AuthManager } from "../../../utils/auth";
import "ojs/ojbutton";
import Color = require("ojs/ojcolor");

const GOOGLE_CLIENT_ID = "68897052946-qov2lsf2ga6sb9fuqpk0ruk8nkgsuj6n.apps.googleusercontent.com";

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
        const googleAuthUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' +
          `client_id=${GOOGLE_CLIENT_ID}&` +
          'response_type=token&' +
          'scope=openid email profile&' +
          'redirect_uri=' + encodeURIComponent('http://localhost:8000/oauth-callback.html');

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
      <div class="login-container">
        <div class="login-card">
          <header class="login-header">
            <img 
              src="/src/assets/GoSaas_Logo.jpg" 
              alt="GoSaaS Logo" 
              class="logo"
              onError={(e: any) => {
                // Hide image if it fails to load
                e.target.style.display = 'none';
              }}
            />
            <h1>LogStream</h1>
          </header>

          {error && (
            <div class="error-message" role="alert" aria-live="polite">
              <p class="error-text">{error}</p>
            </div>
          )}

          <main class="login-buttons">
            <oj-button
              class="google-login-btn"
              disabled={isLoading}
              onojAction={handleGoogleLogin}
              aria-describedby={error ? "error-description" : undefined}
            >
              <span slot="startIcon">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/>
                </svg>
              </span>
              <span style={'color: white'}>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </oj-button>
          </main>

          <footer class="brand-bar" aria-hidden="true"></footer>
        </div>

        <style>{`
          .login-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: var(--oj-core-bg-color-1, #fafafa);
            font-family: var(--oj-typography-body-font-family, 'Helvetica Neue', Helvetica, Arial, sans-serif);
            padding: 2rem;
          }

          .login-card {
            background: var(--oj-core-bg-color-2, #ffffff);
            border-radius: var(--oj-border-radius-lg, 12px);
            box-shadow: var(--oj-box-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.12));
            min-width: 400px;
            max-width: 480px;
            width: 100%;
            text-align: center;
            position: relative;
            padding: 3rem 2.5rem;
            border: 1px solid var(--oj-border-color-1, #e5e5e5);
          }

          .login-header {
            margin-bottom: 2.5rem;
          }

          .logo {
            width: 180px;
            margin-bottom: 1.5rem;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }

          .login-header h1 {
            color: var(--oj-text-color-primary, #161513);
            font-size: var(--oj-typography-heading-lg-font-size, 2rem);
            font-weight: var(--oj-typography-heading-lg-font-weight, 300);
            margin: 0;
            letter-spacing: -0.02em;
          }

          .login-buttons {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            margin: 2.5rem 0;
          }

          .google-login-btn {
            width: 100%;
            height: 48px;
            background: var(--oj-button-primary-bg-color, #0572ce) !important;
            color: var(--oj-button-primary-text-color, #ffffff) !important;
            border: none !important;
            border-radius: var(--oj-border-radius-md, 6px) !important;
            font-size: var(--oj-typography-body-md-font-size, 1rem) !important;
            font-weight: var(--oj-typography-body-md-font-weight, 400) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 0.75rem !important;
            transition: all 0.2s ease !important;
            box-shadow: var(--oj-box-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.12)) !important;
          }

          .google-login-btn:hover {
            background: var(--oj-button-primary-bg-color-hover, #0461b4) !important;
            box-shadow: var(--oj-box-shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15)) !important;
            transform: translateY(-1px);
          }

          .google-login-btn:active {
            transform: translateY(0);
            box-shadow: var(--oj-box-shadow-sm, 0 1px 3px rgba(0, 0, 0, 0.12)) !important;
          }

          .google-login-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
          }

          .error-message {
            margin: 1.5rem 0;
            padding: 1rem;
            background-color: var(--oj-core-bg-color-danger-1, #fef7f7);
            border: 1px solid var(--oj-border-color-danger, #d73527);
            border-radius: var(--oj-border-radius-md, 6px);
            border-left-width: 4px;
          }

          .error-text {
            color: var(--oj-text-color-danger, #d73527);
            font-size: var(--oj-typography-body-sm-font-size, 0.875rem);
            font-weight: var(--oj-typography-body-sm-font-weight, 400);
            margin: 0;
          }

          .brand-bar {
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, var(--oj-button-primary-bg-color, #0572ce) 0%, var(--oj-core-accent-color, #667eea) 100%);
            border-bottom-left-radius: var(--oj-border-radius-lg, 12px);
            border-bottom-right-radius: var(--oj-border-radius-lg, 12px);
          }

          /* Responsive design */
          @media (max-width: 768px) {
            .login-container {
              padding: 1rem;
            }
            
            .login-card {
              min-width: unset;
              padding: 2rem 1.5rem;
            }
            
            .logo {
              width: 150px;
            }
            
            .login-header h1 {
              font-size: var(--oj-typography-heading-md-font-size, 1.5rem);
            }
          }

          /* Focus states for accessibility */
          .google-login-btn:focus {
            outline: 2px solid var(--oj-core-focus-border-color, #0572ce);
            outline-offset: 2px;
          }

          /* Loading state animation */
          .google-login-btn[disabled] {
            position: relative;
            overflow: hidden;
          }

          .google-login-btn[disabled]::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: loading-shimmer 1.5s infinite;
          }

          @keyframes loading-shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    );
  }
);
