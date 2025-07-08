import ApiLinks from "../network/apiLinks";
import { AuthManager } from "../utils/auth";
import { AnalyticsResponse } from "../components/pages/Analytics/types";

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

  static async fetchAnalytics(): Promise<AnalyticsResponse> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(ApiLinks.GET_ANALYTICS, {
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