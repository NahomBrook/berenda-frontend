export interface ChatParticipant {
  userId: string;
  fullName: string;
  profileImage?: string;
  lastSeen?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  message: string;
  isAi: boolean;
  createdAt: string;
  readAt?: string;
}

export interface Chat {
  id: string;
  createdAt: string;
  participants: ChatParticipant[];
  lastMessage?: Message;
  unreadCount?: number;
  propertyId?: string;
  propertyTitle?: string;
}

export interface SendMessageData {
  chatId: string;
  message: string;
}