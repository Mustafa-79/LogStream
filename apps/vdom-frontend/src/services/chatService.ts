import ApiLinks from "../network/apiLinks";
import { AuthManager } from "../utils/auth";

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  loading?: boolean;
  queryResults?: any[];
  success?: boolean;
}

interface ChatQueryRequest {
  query: string;
  conversationHistory?: any[];
}

interface ChatQueryData {
  interpretation: string;
  query_results: any[];
  success: boolean;
  conversationHistory?: any[];
}

interface ChatQueryResponse {
  status: number;
  message: string;
  data: ChatQueryData;
}

class ChatService {
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

  static async sendQuery(queryRequest: ChatQueryRequest): Promise<ChatQueryResponse> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(ApiLinks.SEND_CHAT_QUERY, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(queryRequest),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ChatQueryResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending chat query:', error);
      throw error;
    }
  }
}

export default ChatService;
export type { Message, ChatQueryRequest, ChatQueryData, ChatQueryResponse };