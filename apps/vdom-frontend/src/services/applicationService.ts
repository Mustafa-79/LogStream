import ApiLinks from "../network/apiLinks";
import { AuthManager } from "../utils/auth";

interface CreateApplicationData {
  name: string;
  description: string;
}

interface UpdateApplicationData {
  name?: string;
  description?: string;
}

interface UpdateThresholdData {
  threshold: number;
  time_period: number;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

class ApplicationService {
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

  static async fetchAllApplications() {
    const response = await fetch(ApiLinks.GET_ALL_APPLICATIONS, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const json: ApiResponse<any[]> = await response.json();
    return json.data;
  }

  static async createApplication(applicationData: CreateApplicationData) {
    const response = await fetch(ApiLinks.CREATE_APPLICATION, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json: ApiResponse<any> = await response.json();
    return json.data;
  }

  static async updateApplication(id: string, updateData: UpdateApplicationData) {
    const response = await fetch(ApiLinks.UPDATE_APPLICATION(id), {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json: ApiResponse<any> = await response.json();
    return json.data;
  }

  static async deleteApplication(id: string) {
    const response = await fetch(ApiLinks.DELETE_APPLICATION(id), {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json: ApiResponse<any> = await response.json();
    return json.data;
  }

  static async updateThresholdAndTimePeriod(id: string, thresholdData: UpdateThresholdData) {
    const response = await fetch(ApiLinks.UPDATE_THRESHOLD_TIME_PERIOD(id), {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(thresholdData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json: ApiResponse<any> = await response.json();
    return json.data;
  }
}

export default ApplicationService;