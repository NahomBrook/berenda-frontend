// frontend/src/services/chatApi.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface ChatPreview {
  id: string;
  participant: {
    id: string;
    fullName: string;
    profileImage?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  };
  unreadCount: number;
  propertyTitle?: string;
}

export interface Message {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
  isAi: boolean;
}

class ChatApiService {
  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'API request failed');
    }

    return response.json();
  }

  async getChats(): Promise<{ chats: ChatPreview[] }> {
    return this.fetch('/chats');
  }

  async getMessages(chatId: string): Promise<{ messages: Message[]; chat?: any }> {
    return this.fetch(`/chats/${chatId}/messages`);
  }

  async sendMessage(chatId: string, message: string): Promise<Message> {
    return this.fetch(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async sendAIMessage(chatId: string, message: string): Promise<Message> {
    return this.fetch(`/chats/${chatId}/ai`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async createChat(participantId: string, propertyId?: string): Promise<{ chatId: string }> {
    return this.fetch('/chats', {
      method: 'POST',
      body: JSON.stringify({ participantId, propertyId }),
    });
  }

  async getUnreadCount(): Promise<{ count: number }> {
    return this.fetch('/chats/unread');
  }
}

export const chatApi = new ChatApiService();