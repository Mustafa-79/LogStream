import { AuthManager } from "../utils/auth";
import { Log } from "../utils/applicationUtils";
import ApiLinks from "../network/apiLinks";

interface LogsResponse {
  data: Log[];
}

class LogService {
  private static readonly FETCH_INTERVAL = 5000;

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

  static async fetchNewLogs(since?: string): Promise<Log[]> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const url = `${ApiLinks.GET_LOGS}${
        since ? `?since=${encodeURIComponent(since)}` : ''
      }`;

      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: LogsResponse = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching new logs:', error);
      throw error;
    }
  }

  static getFetchInterval(): number {
    return this.FETCH_INTERVAL;
  }
}

export default LogService;