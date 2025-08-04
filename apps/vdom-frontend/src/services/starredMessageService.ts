import ApiLinks from "../network/apiLinks";
import { AuthManager } from "../utils/auth";

export interface StarredMessage {
  _id: string;
  userId: string;
  messageContent: string;
  createdAt: string;
  updatedAt: string;
}

interface StarMessageRequest {
  messageContent: string;
}

interface StarredMessagesResponse {
  status: number;
  message: string;
  data: {
    starredMessages: StarredMessage[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}

interface StarMessageResponse {
  status: number;
  message: string;
  data: StarredMessage;
}

class StarredMessageService {
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

  static async starMessage(request: StarMessageRequest): Promise<StarMessageResponse> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(ApiLinks.STAR_MESSAGE, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        if (response.status === 409) {
          throw new Error('Message is already starred');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: StarMessageResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error starring message:', error);
      throw error;
    }
  }

  static async unstarMessage(starredMessageId: string): Promise<void> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(ApiLinks.UNSTAR_MESSAGE(starredMessageId), {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        if (response.status === 404) {
          throw new Error('Starred message not found');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error unstarring message:', error);
      throw error;
    }
  }

  static async getStarredMessages(
    page: number = 1,
    limit: number = 20,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<StarredMessagesResponse> {
    if (!AuthManager.isAuthenticated()) {
      throw new Error('User not authenticated');
    }

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
      });

      const response = await fetch(`${ApiLinks.STARRED_MESSAGES}?${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('UNAUTHORIZED');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: StarredMessagesResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching starred messages:', error);
      throw error;
    }
  }

}

export default StarredMessageService;
export type { StarMessageRequest, StarredMessagesResponse, StarMessageResponse };
