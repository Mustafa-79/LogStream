class ApiLinks {
  static API_BASE_URL: string = "http://localhost:3000/api";

  // Application APIs
  static GET_ALL_APPLICATIONS: string = `${ApiLinks.API_BASE_URL}/application`;
  static CREATE_APPLICATION: string = `${ApiLinks.API_BASE_URL}/application`;
  static UPDATE_APPLICATION = (id: string): string => `${ApiLinks.API_BASE_URL}/application/${id}`;
  static DELETE_APPLICATION = (id: string): string => `${ApiLinks.API_BASE_URL}/application/${id}`;
  static UPDATE_THRESHOLD_TIME_PERIOD = (id: string): string => `${ApiLinks.API_BASE_URL}/application/${id}/threshold-time`;

   // Log APIs
  static GET_LOGS: string = `${ApiLinks.API_BASE_URL}/logs/new`;

}

export default ApiLinks;