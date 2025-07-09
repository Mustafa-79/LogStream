import { AuthManager } from "../utils/auth";
import { Log } from "../utils/applicationUtils";
import ApiLinks from "../network/apiLinks";

interface LogsResponse {
  logs: Log[];
  pagination: Pagination;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
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

  static async fetchLogs(since?: string, page: number = 1, limit: number = 25): Promise<LogsResponse> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const params = new URLSearchParams();
      
      if (since) {
        params.append('since', since);
      }
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const url = `${ApiLinks.GET_LOGS}?${params.toString()}`;

      const response = await fetch(url, {
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
      console.error('Error fetching logs:', error);
      throw error;
    }
  }

  static async fetchLogStats() {

    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(ApiLinks.GET_LOG_STATS, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json: ApiResponse<any[]> = await response.json();
      return json.data;
    } catch (error) {
      console.error('Error fetching log stats:', error);
      throw error;
    }
  }

  static getFetchInterval(): number {
    return this.FETCH_INTERVAL;
  }
}

export default LogService;