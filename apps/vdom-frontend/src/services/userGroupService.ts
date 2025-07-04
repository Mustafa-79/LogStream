import { AuthManager } from '../utils/auth';
import { IGroup, CreateUserGroupPayload, IUser, IApplication } from '../components/pages/UserGroups/types';
import { API_CONFIG } from '../config';

interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  body?: any;
  customErrorHandling?: boolean;
}

export class UserGroupsAPI {
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

  private static async makeApiRequest<T>(options: ApiRequestOptions): Promise<T> {
    const { method, endpoint, body, customErrorHandling = false } = options;
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const requestOptions: RequestInit = {
        method,
        headers: this.getAuthHeaders(),
        signal: controller.signal
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        requestOptions.body = JSON.stringify(body);
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, requestOptions);

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;

        if (customErrorHandling) {
          try {
            const errorData = await response.json();
            if (errorData.message) {
              errorMessage = errorData.message;
            } else if (errorData.error) {
              errorMessage = errorData.error;
            } else if (errorData.details) {
              errorMessage = errorData.details;
            }

            // Handle specific error types
            if (response.status === 409) {
              errorMessage = 'A group with this name already exists. Please choose a different name.';
            } else if (response.status === 400) {
              errorMessage = errorData.message || 'Invalid request. Please check your input and try again.';
            } else if (response.status === 403) {
              errorMessage = 'You do not have permission to perform this action.';
            } else if (response.status === 404) {
              errorMessage = 'The requested group was not found.';
            }
          } catch (parseError) {
            console.warn('Could not parse error response:', parseError);
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data.data as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }

      // Handle network/connection errors specifically
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('ERR_CONNECTION_REFUSED')) {
          throw new Error('Unable to connect to server. Please check your connection and try again.');
        } else if (error.message.includes('NetworkError') || error.message.includes('ERR_NETWORK')) {
          throw new Error('Network error occurred. Please check your connection and try again.');
        }
      }

      console.error(`Error with ${method} request to ${endpoint}:`, error);
      throw error instanceof Error ? error : new Error(`Failed to complete ${method} request`);
    }
  }

  static async getUserGroups(): Promise<IGroup[]> {
    return this.makeApiRequest<IGroup[]>({
      method: 'GET',
      endpoint: API_CONFIG.ENDPOINTS.USER_GROUPS
    });
  }

  static async deleteUserGroup(id: string): Promise<IGroup> {
    return this.makeApiRequest<IGroup>({
      method: 'DELETE',
      endpoint: `${API_CONFIG.ENDPOINTS.USER_GROUPS}/${id}`
    });
  }

  static async restoreUserGroup(id: string): Promise<IGroup> {
    return this.makeApiRequest<IGroup>({
      method: 'POST',
      endpoint: `${API_CONFIG.ENDPOINTS.USER_GROUPS}/${id}/restore`
    });
  }

  static async createUserGroup(payload: CreateUserGroupPayload): Promise<IGroup> {
    return this.makeApiRequest<IGroup>({
      method: 'POST',
      endpoint: API_CONFIG.ENDPOINTS.USER_GROUPS,
      body: payload,
      customErrorHandling: true
    });
  }

  static async updateUserGroup(id: string, payload: CreateUserGroupPayload): Promise<IGroup> {
    return this.makeApiRequest<IGroup>({
      method: 'PUT',
      endpoint: `${API_CONFIG.ENDPOINTS.USER_GROUPS}/${id}`,
      body: payload,
      customErrorHandling: true
    });
  }

  static async getUsers(): Promise<IUser[]> {
    return this.makeApiRequest<IUser[]>({
      method: 'GET',
      endpoint: '/user'
    });
  }

  static async getApplications(): Promise<IApplication[]> {
    return this.makeApiRequest<IApplication[]>({
      method: 'GET',
      endpoint: '/application'
    });
  }
}
