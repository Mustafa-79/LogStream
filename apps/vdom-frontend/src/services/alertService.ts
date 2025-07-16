import ApiLinks from "../network/apiLinks";
import { AuthManager } from "../utils/auth";

interface Alert {
  _id: string;
  appId: string;
  errorCount: number;
  threshold: number;
  period: number;
  timestamp: Date;
  resolved: boolean;
  __v: number;
  applicationName?: string; // Optional, for enriched alerts
}

interface AlertsResponse {
  status: number;
  message: string;
  data: Alert[];
}

class AlertService {
  private static getAuthHeaders(): HeadersInit {
    const token = AuthManager.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
  }

  static async fetchAlerts(): Promise<AlertsResponse> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(ApiLinks.GET_ALERTS, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AlertsResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  static async resolveAlert(alertId: string): Promise<Alert> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(ApiLinks.RESOLVE_ALERT(alertId), {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }
}

export default AlertService;
export type { Alert, AlertsResponse };