import ApiLinks from "../network/apiLinks";
import { AuthManager } from "../utils/auth";
import { 
  CreateApplicationData, 
  UpdateApplicationData, 
  ApplicationsResponse, 
  ApplicationFilters, 
  ApiResponse, 
  DropdownOption 
} from "../components/pages/Applications/types";

class ApplicationService {
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

  static async fetchAllApplications(
    page: number = 1,
    limit: number = 5,
    filters?: ApplicationFilters,
    searchTerm?: string // Add search parameter
  ): Promise<ApplicationsResponse> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filters?.active !== undefined) {
      params.append('active', filters.active.toString());
    }

    // Add search parameter to API call
    if (searchTerm && searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    }

    const url = `${ApiLinks.GET_ALL_APPLICATIONS}?${params.toString()}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const json: ApiResponse<ApplicationsResponse> = await response.json();
    return json.data;
  }

  static async fetchApplicationNames() {
    const response = await fetch(ApiLinks.GET_APPLICATION_NAMES, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json: ApiResponse<DropdownOption[]> = await response.json();
    return json.data;
  }

  static async createApplication(applicationData: CreateApplicationData) {
    try {
      const response = await fetch(ApiLinks.CREATE_APPLICATION, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(applicationData),
      });

      const json: ApiResponse<any> = await response.json();

      if (!response.ok) {
        throw new Error(json.message || `Failed to create application`);
      }

      return json.data;
    } catch (error) {
      console.error("Error in createApplication:", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Cannot connect to the server. Please check your internet connection or try again later.");
      }

      throw error;
    }
  }

  static async updateApplication(id: string, updateData: UpdateApplicationData) {
    try {
      const response = await fetch(ApiLinks.UPDATE_APPLICATION(id), {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const json: ApiResponse<any> = await response.json();

      if (!response.ok) {
        throw new Error(json.message || `Failed to update application`);
      }

      return json.data;
    } catch (error) {
      console.error("Error in updateApplication:", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Cannot connect to the server. Please check your internet connection or try again later.");
      }

      throw error;
    }
  }

  static async deleteApplication(id: string) {
    try {
      const response = await fetch(ApiLinks.DELETE_APPLICATION(id), {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const json: ApiResponse<any> = await response.json();

      if (!response.ok) {
        throw new Error(json.message || `Failed to delete application`);
      }

      return json.data;
    } catch (error) {
      console.error("Error in deleteApplication:", error);
      
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Cannot connect to the server. Please check your internet connection or try again later.");
      }

      throw error;
    }
  }
}

export default ApplicationService;