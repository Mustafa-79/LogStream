import ApiLinks from "../network/apiLinks";
import { AuthManager } from "../utils/auth";
import { AnalyticsResponse } from "../components/pages/Analytics/types";
import { FilterState } from "../components/LogFilter/types";

interface AnalyticsFilters {
  applicationIDs?: string[];
  logLevels?: string[];
  from?: string;
  to?: string;
}

class AnalyticsService {
  // Helper function to get authenticated headers
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

  // Convert FilterState to AnalyticsFilters
  private static convertFiltersToQuery(filters?: FilterState): AnalyticsFilters {
    if (!filters) return {};
    
    const queryFilters: AnalyticsFilters = {};
    
    if (filters.applications && filters.applications.length > 0) {
      queryFilters.applicationIDs = filters.applications;
    }
    
    if (filters.logLevels && filters.logLevels.length > 0) {
      queryFilters.logLevels = filters.logLevels;
    }
    
    if (filters.fromDate) {
      queryFilters.from = filters.fromDate;
    }
    
    if (filters.toDate) {
      queryFilters.to = filters.toDate;
    }
    
    return queryFilters;
  }

  // Build query string from filters
  private static buildQueryString(filters: AnalyticsFilters): string {
    const params = new URLSearchParams();
    
    if (filters.applicationIDs && filters.applicationIDs.length > 0) {
      params.append('applicationIDs', filters.applicationIDs.join(','));
    }
    
    if (filters.logLevels && filters.logLevels.length > 0) {
      params.append('logLevels', filters.logLevels.join(','));
    }
    
    if (filters.from) {
      params.append('from', filters.from);
    }
    
    if (filters.to) {
      params.append('to', filters.to);
    }
    
    return params.toString();
  }

  static async fetchAnalytics(filters?: FilterState): Promise<AnalyticsResponse> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const queryFilters = this.convertFiltersToQuery(filters);
      const queryString = this.buildQueryString(queryFilters);
      const url = queryString ? `${ApiLinks.GET_ANALYTICS}?${queryString}` : ApiLinks.GET_ANALYTICS;
      
      const response = await fetch(url, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AnalyticsResponse = await response.json();

      return data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
}

export default AnalyticsService;