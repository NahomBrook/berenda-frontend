// frontend/src/components/chat/ChatList.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, ChevronRight } from "lucide-react";
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

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchChats = async () => {
    try {
      const token = localStorage.getItem("berenda_token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const data = await chatApi.getChats();
      setChats(data.chats || []);
      setError(null);
    } catch (err: any) {
      // Token expired or invalid — clear session and redirect to login
      if (err?.message?.toLowerCase().includes("token") || err?.message?.toLowerCase().includes("401") || err?.message?.toLowerCase().includes("unauthorized")) {
        localStorage.removeItem("berenda_token");
        localStorage.removeItem("berenda_user");
        router.push("/auth/login");
        return;
      }
      console.error("Error fetching chats:", err);
      setError("Failed to load conversations");
    } finally {
      setLoading(false);
    }
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
        <button onClick={fetchChats} className="text-sm text-red-600 hover:text-red-700">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
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
                  selectedChatId === chat.id ? "bg-red-50" : ""
                }`}
              >
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

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-medium text-gray-900 truncate">{chat.participant.fullName}</h4>
                    {chat.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {chat.propertyTitle && (
                    <p className="text-xs text-gray-500 mb-1">Regarding: {chat.propertyTitle}</p>
                  )}

                  {chat.lastMessage ? (
                    <p className={`text-sm truncate ${
                      chat.unreadCount > 0 && !chat.lastMessage.isFromMe
                        ? "font-medium text-gray-900"
                        : "text-gray-600"
                    }`}>
                      {chat.lastMessage.isFromMe ? "You: " : ""}
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
