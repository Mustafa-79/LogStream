import ApiLinks from "../network/apiLinks";
import { AuthManager } from "../utils/auth";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

interface UserApplicationsData {
  applications: UserApplication[];
  totalApplications: number;
}

export interface UserApplication {
  id: string;  // Note: backend sends 'id' not '_id'
  name: string;
  description: string;
  threshold: number;
  timePeriod: number;
  active: boolean;
  notificationsEnabled: boolean;
}

class SettingsService {
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

  static async fetchUserApplications(): Promise<UserApplication[]> {
    try {
      const response = await fetch(ApiLinks.GET_USER_APPLICATIONS, {
        headers: this.getAuthHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const json: ApiResponse<UserApplicationsData> = await response.json();
      return json.data.applications;
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
  }

  static async fetchDRP(): Promise<number> {
    try {
      const response = await fetch(ApiLinks.GET_DRP, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AuthManager.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('DRP API Response:', data);

      // Extract the dataRetentionPeriod from the response
      if (data.data && typeof data.data.dataRetentionPeriod === 'number') {
        return data.data.dataRetentionPeriod;
      }

      throw new Error('Invalid DRP response format');
    } catch (error) {
      console.error('Error fetching DRP:', error);
      throw error;
    }
  }
}

export default SettingsService;
