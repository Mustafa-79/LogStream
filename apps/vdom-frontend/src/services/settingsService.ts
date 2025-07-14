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
}

export default SettingsService;
