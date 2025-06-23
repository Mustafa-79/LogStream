import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import ApiLinks from './apiLinks';

class ApiBaseHelper {
  static axiosInstance: AxiosInstance = axios.create({
    baseURL: ApiLinks.API_BASE_URL,
  });

  static updateAuthToken(token?: string): void {
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  static async get<T = any>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get<T>(url);
    return response.data;
  }

  static async post<T = any>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post<T>(url, data);
    return response.data;
  }

  static async put<T = any>(url: string, data?: unknown): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.put<T>(url, data);
    return response.data;
  }

  static async delete(url: string): Promise<void> {
    await this.axiosInstance.delete(url);
  }
}

export default ApiBaseHelper;
