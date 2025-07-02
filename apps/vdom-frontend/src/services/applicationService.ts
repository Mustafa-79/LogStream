import ApiLinks from "../network/apiLinks";

interface CreateApplicationData {
  name: string;
  description: string;
}

interface UpdateApplicationData {
  name?: string;
  description?: string;
  active?: boolean;
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
  static async fetchAllApplications() {
    try {
      const response = await fetch(ApiLinks.GET_ALL_APPLICATIONS);
      const json: ApiResponse<any[]> = await response.json();

      if (!response.ok) {
        throw new Error(json.message || `Failed to fetch applications`);
      }

      return json.data;
    } catch (error) {
      console.error("Error in fetchAllApplications:", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Cannot connect to the server. Please check your internet connection or try again later.");
      }

      throw error;
    }
  }

  static async createApplication(applicationData: CreateApplicationData) {
    try {
      const response = await fetch(ApiLinks.CREATE_APPLICATION, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
        headers: {
          'Content-Type': 'application/json',
        },
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

  static async updateThresholdAndTimePeriod(id: string, thresholdData: UpdateThresholdData) {
    try {
      const response = await fetch(ApiLinks.UPDATE_THRESHOLD_TIME_PERIOD(id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(thresholdData),
      });

      const json: ApiResponse<any> = await response.json();

      if (!response.ok) {
        throw new Error(json.message || `Failed to update threshold and time period`);
      }

      return json.data;
    } catch (error) {
      console.error("Error in updateThresholdAndTimePeriod:", error);

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error("Cannot connect to the server. Please check your internet connection or try again later.");
      }

      throw error;
    }
  }
}

export default ApplicationService;