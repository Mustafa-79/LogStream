import ApiLinks from "../network/apiLinks";

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
  static async fetchAllApplications() {
    const response = await fetch(ApiLinks.GET_ALL_APPLICATIONS);
    const json: ApiResponse<any[]> = await response.json();
    return json.data;
  }

  static async createApplication(applicationData: CreateApplicationData) {
    const response = await fetch(ApiLinks.CREATE_APPLICATION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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
      headers: {
        'Content-Type': 'application/json',
      },
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