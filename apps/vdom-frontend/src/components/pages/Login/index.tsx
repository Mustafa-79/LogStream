import { registerCustomElement } from "ojs/ojvcomponent";
import { useState } from "preact/hooks";
import { AuthManager } from "../../../utils/auth";
import "ojs/ojbutton";

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

    // Demo login for development
    const handleDemoLogin = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Simulate successful OAuth response
        const demoTokenResponse = {
          access_token: 'demo_token_' + Date.now()
        };
        
        await AuthManager.loginWithGoogle(demoTokenResponse.access_token);
        loginSuccess?.();
      } catch (err: any) {
        setError(err.message || 'Demo login failed');
        setIsLoading(false);
      }
    };

    return (
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
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
          </div>

          {error && (
            <div class="error-message">
              <div class="error-text">{error}</div>
            </div>
          )}

          <div class="login-buttons">
            <oj-button
              class="google-login-btn"
              disabled={isLoading}
              onojAction={handleGoogleLogin}
            >
              <span slot="startIcon">
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M9 3.48c1.69 0 2.83.73 3.48 1.34l2.54-2.54C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"/>
                  <path fill="#34A853" d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.21 1.18-.84 2.88-2.42 4.03l3.72 2.88c2.17-2.01 3.38-4.97 3.38-8.41z"/>
                  <path fill="#FBBC04" d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9.008 9.008 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"/>
                  <path fill="#EA4335" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-3.72-2.88c-.93.62-2.1.99-3.24.99-2.38 0-4.4-1.57-5.12-3.74L.96 13.04C2.44 15.98 5.48 18 9 18z"/>
                </svg>
              </span>
              {isLoading ? 'Signing in...' : 'Sign in with Google'}
            </oj-button>

            {/* Demo login for development */}
            <oj-button
              class="demo-login-btn"
              chroming="outlined"
              disabled={isLoading}
              onojAction={handleDemoLogin}
            >
              Demo Login (Development)
            </oj-button>
          </div>

          <div class="brand-bar"></div>
        </div>

        <style>{`
          .login-container {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #e5e5e5;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }

          .login-card {
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            min-width: 40rem;
            text-align: center;
            position: relative;
            padding: 2rem 3rem;
          }

          .login-header {
            margin-bottom: 2rem;
          }

          .logo {
            width: 200px;
            margin-bottom: 16px;
            display: block;
            margin-left: auto;
            margin-right: auto;
          }

          .login-header h1 {
            color: #3f51b5;
            font-size: 30px;
            margin: 16px 0 0 0;
            font-weight: normal;
          }

          .login-buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
            margin: 2rem 0;
          }

          .google-login-btn {
            width: 80%;
            margin: 0 auto;
            background: #3f51b5 !important;
            color: #fff !important;
            border: none;
            padding: 12px 0;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }

          .demo-login-btn {
            width: 80%;
            margin: 0 auto;
            padding: 12px 0;
            font-size: 14px;
          }

          .error-message {
            margin: 1rem 0;
            padding: 0.75rem;
            background-color: #fee;
            border: 1px solid #fcc;
            border-radius: 6px;
          }

          .error-text {
            color: #d00;
            font-size: 0.9rem;
          }

          .brand-bar {
            position: absolute;
            left: 0;
            bottom: 0;
            width: 100%;
            height: 6px;
            background: #3f51b5;
            border-bottom-left-radius: 8px;
            border-bottom-right-radius: 8px;
            box-shadow: 0 2px 6px rgba(63,81,181,0.15);
          }
        `}</style>
      </div>
    );
  }
);
