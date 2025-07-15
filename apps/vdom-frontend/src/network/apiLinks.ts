class ApiLinks {
  static API_BASE_URL: string = "http://localhost:3000/api";

  // Application APIs
  static GET_ALL_APPLICATIONS: string = `${ApiLinks.API_BASE_URL}/application`;
  static GET_APPLICATION_NAMES: string = `${ApiLinks.API_BASE_URL}/application/names`;
  static CREATE_APPLICATION: string = `${ApiLinks.API_BASE_URL}/application`;
  static UPDATE_APPLICATION = (id: string): string => `${ApiLinks.API_BASE_URL}/application/${id}`;
  static DELETE_APPLICATION = (id: string): string => `${ApiLinks.API_BASE_URL}/application/${id}`;
  static UPDATE_THRESHOLD_TIME_PERIOD = (id: string): string => `${ApiLinks.API_BASE_URL}/application/${id}/threshold-time`;

   // Log APIs
  static GET_LOGS: string = `${ApiLinks.API_BASE_URL}/logs`;
  static GET_LOG_STATS: string = `${ApiLinks.API_BASE_URL}/logs/stats`;
  static EXPORT_LOGS: string = `${ApiLinks.API_BASE_URL}/logs/export`;

  // Analytics APIs
  static GET_ANALYTICS: string = `${ApiLinks.API_BASE_URL}/analytics`;

}

export default ApiLinks;