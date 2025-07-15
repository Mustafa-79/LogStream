class ApiLinks {
  static readonly API_BASE_URL: string = "http://localhost:3000/api";

  // Application APIs
  static readonly GET_ALL_APPLICATIONS: string = `${ApiLinks.API_BASE_URL}/application`;
  static readonly GET_APPLICATION_NAMES: string = `${ApiLinks.API_BASE_URL}/application/names`;
  static readonly CREATE_APPLICATION: string = `${ApiLinks.API_BASE_URL}/application`;
  static readonly UPDATE_APPLICATION = (id: string): string => `${ApiLinks.API_BASE_URL}/application/${id}`;
  static readonly DELETE_APPLICATION = (id: string): string => `${ApiLinks.API_BASE_URL}/application/${id}`;
  static readonly UPDATE_THRESHOLD_TIME_PERIOD = (id: string): string => `${ApiLinks.API_BASE_URL}/application/${id}/threshold-time`;

   // Log APIs
  static GET_LOGS: string = `${ApiLinks.API_BASE_URL}/logs`;
  static GET_LOG_STATS: string = `${ApiLinks.API_BASE_URL}/logs/stats`;
  static EXPORT_LOGS: string = `${ApiLinks.API_BASE_URL}/logs/export`;

  // Analytics APIs
  static readonly GET_ANALYTICS: string = `${ApiLinks.API_BASE_URL}/analytics`;

  // Settings APIs
  static readonly GET_USER_APPLICATIONS: string = `${ApiLinks.API_BASE_URL}/settings/user-applications`;
  static readonly GET_DRP: string = `${ApiLinks.API_BASE_URL}/settings/drp`;
  static readonly SAVE_SETTINGS: string = `${ApiLinks.API_BASE_URL}/settings`;
}

export default ApiLinks;