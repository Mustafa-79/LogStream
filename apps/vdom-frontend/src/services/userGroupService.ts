import { IGroup, CreateUserGroupPayload, IUser, IApplication } from '../components/pages/UserGroups/types';
import { API_CONFIG } from '../config';

export class UserGroupsAPI {
  static async getUserGroups(): Promise<IGroup[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_GROUPS}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data as IGroup[];
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      console.error('Error fetching user groups:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch user groups');
    }
  }

  static async deleteUserGroup(id: string): Promise<IGroup> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_GROUPS}/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data as IGroup;
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
      
      console.error('Error deleting user group:', error);
      throw error instanceof Error ? error : new Error('Failed to delete user group');
    }
  }

  static async restoreUserGroup(id: string): Promise<IGroup> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_GROUPS}/${id}/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data as IGroup;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      console.error('Error restoring user group:', error);
      throw error instanceof Error ? error : new Error('Failed to restore user group');
    }
  }

  static async createUserGroup(payload: CreateUserGroupPayload): Promise<IGroup> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_GROUPS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
        
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
          // If we can't parse the error response, use the default message
          console.warn('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data.data as IGroup;
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
      
      console.error('Error creating user group:', error);
      throw error instanceof Error ? error : new Error('Failed to create user group');
    }
  }

  static async getUsers(): Promise<IUser[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/user`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();

      return data.data as IUser[];
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      console.error('Error fetching users:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch users');
    }
  }

  static async getApplications(): Promise<IApplication[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/application`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();

      return data.data as IApplication[];
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      console.error('Error fetching applications:', error);
      throw error instanceof Error ? error : new Error('Failed to fetch applications');
    }
  }

  static async updateUserGroup(id: string, payload: CreateUserGroupPayload): Promise<IGroup> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER_GROUPS}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`;
        
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
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      return data.data as IGroup;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection and try again.');
      }
      
      console.error('Error updating user group:', error);
      throw error instanceof Error ? error : new Error('Failed to update user group');
    }
  }
}
