// frontend/src/components/chat/ChatList.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ChevronRight, Bot, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { chatApi, ChatPreview } from "@/services/chatApi";

interface ChatListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string;
}

export default function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const router = useRouter();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);

  useEffect(() => {
    fetchChats();
    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const data = await chatApi.getChats();
      setChats(data.chats || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching chats:", err);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const handleAIChat = () => {
    // Create a special AI chat (we'll use a flag to identify AI chats)
    setShowAIChat(true);
    // Create a temporary AI chat ID
    const aiChatId = 'ai-assistant';
    onSelectChat(aiChatId);
  };

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-2">{error}</p>
        <button
          onClick={fetchChats}
          className="text-sm text-red-600 hover:text-red-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* AI Assistant Button */}
      <div className="p-4 border-b border-gray-100">
        <button
          onClick={handleAIChat}
          className="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:from-purple-100 hover:to-pink-100 transition-all duration-200 border border-purple-200"
        >
          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            <p className="text-xs text-gray-500">Ask me anything about Berenda</p>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-400" />
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
            <p className="text-gray-500 text-sm mb-4">
              When you contact a host or a renter contacts you, your conversations will appear here.
            </p>
            <button
              onClick={() => router.push("/")}
              className="text-red-600 hover:text-red-700 font-medium text-sm"
            >
              Browse properties
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition ${
                  selectedChatId === chat.id ? 'bg-red-50' : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-medium">
                      {chat.participant.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>

                {/* Chat info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {chat.participant.fullName}
                    </h4>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  
                  {chat.propertyTitle && (
                    <p className="text-xs text-gray-500 mb-1">
                      Regarding: {chat.propertyTitle}
                    </p>
                  )}
                  
                  {chat.lastMessage ? (
                    <p className={`text-sm truncate ${
                      chat.unreadCount > 0 && !chat.lastMessage.isFromMe
                        ? 'font-medium text-gray-900'
                        : 'text-gray-600'
                    }`}>
                      {chat.lastMessage.isFromMe ? 'You: ' : ''}
                      {chat.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400">No messages yet</p>
                  )}
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}