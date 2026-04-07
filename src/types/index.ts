export interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
  phone?: string;
  profileImageUrl?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  roles: { name: string }[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface Chat {
  id: string;
  createdAt: string;
  participant: {
    id: string;
    fullName: string;
    profileImage?: string;
  } | null;
  lastMessage: {
    content: string;
    createdAt: string;
    isFromMe: boolean;
  } | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  chatId?: string;
  senderId: string;
  message: string;
  createdAt: string;
  isAi: boolean;
  readAt?: string | null;
}

export interface AIMessage {
  id: string;
  senderId: string;
  message: string;
  createdAt: string;
  isAi: boolean;
}
