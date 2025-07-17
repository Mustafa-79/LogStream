import { AuthManager } from "../utils/auth";
import ApiLinks from "../network/apiLinks";
import { LogsResponse, LogFilters, ApiResponse, ExportResponse } from "../components/pages/Dashboard/types";

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

  static async fetchLogs(
    since?: string, 
    page: number = 1, 
    limit: number = 25,
    filters?: LogFilters,
    searchTerm?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc' | 'default'
  ): Promise<LogsResponse> {
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

      if (filters?.applications && filters.applications.length > 0) {
        params.append('applications', filters.applications.join(','));
      }

      if (filters?.logLevels && filters.logLevels.length > 0) {
        params.append('logLevels', filters.logLevels.join(','));
      }

      if (filters?.fromDate) {
        params.append('fromDate', filters.fromDate);
      }

      if (filters?.toDate) {
        params.append('toDate', filters.toDate);
      }

      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      // Only add sort parameters if not default
      if (sortBy && sortOrder && sortOrder !== 'default') {
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
      }

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

  static async fetchLogStats(filters?: LogFilters) {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const params = new URLSearchParams();

      const url = ApiLinks.GET_LOG_STATS;

      const response = await fetch(url, {
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

  static async exportLogs(
    filters?: LogFilters,
    format: 'csv' | 'json' = 'csv',
    searchTerm?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc' | 'default'
  ): Promise<ExportResponse> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const params = new URLSearchParams();

      if (filters?.applications && filters.applications.length > 0) {
        params.append('applications', filters.applications.join(','));
      }

      if (filters?.logLevels && filters.logLevels.length > 0) {
        params.append('logLevels', filters.logLevels.join(','));
      }

      if (filters?.fromDate) {
        params.append('fromDate', filters.fromDate);
      }

      if (filters?.toDate) {
        params.append('toDate', filters.toDate);
      }

      if (searchTerm && searchTerm.trim()) {
        params.append('search', searchTerm.trim());
      }

      if (sortBy && sortOrder && sortOrder !== 'default') {
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
      }

      params.append('format', format);

      const url = `${ApiLinks.EXPORT_LOGS}?${params.toString()}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        
        let errorMessage = `Export failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
        }
        
        throw new Error(errorMessage);
      }

      const data: ApiResponse<ExportResponse> = await response.json();
      return data.data || { message: data.message };
    } catch (error) {
      console.error('Error exporting logs:', error);
      throw error;
    }
  }

  static getFetchInterval(): number {
    return this.FETCH_INTERVAL;
  }
}

export default LogService;