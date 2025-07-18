// Configuration for API endpoints
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000/api',
  ENDPOINTS: {
    USER_GROUPS: '/user-groups'
  },
  // Request timeout in milliseconds
  TIMEOUT: 10000
};

export const AUTH_CONFIG = {
  VITE_GOOGLE_CLIENT_ID: "68897052946-qov2lsf2ga6sb9fuqpk0ruk8nkgsuj6n.apps.googleusercontent.com",
  VITE_GOOGLE_AUTH_URL: "https://accounts.google.com/o/oauth2/v2/auth",
  VITE_REDIRECT_URI: "http://localhost:8000/oauth-callback.html"
};
