// frontend/src/components/chat/ChatRoom.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { chatApi, Message } from "@/services/chatApi";

interface ChatRoomProps {
  chatId: string;
  onBack: () => void;
}

export default function ChatRoom({ chatId, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [participant, setParticipant] = useState<{ fullName: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = localStorage.getItem("berenda_user");
    if (user) {
      try {
        const parsed = JSON.parse(user);
        setCurrentUserId(parsed.id);
      } catch (e) {
        console.error("Error parsing user:", e);
      }
    }

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const data = await chatApi.getMessages(chatId);
      setMessages(data.messages || []);

      if (data.chat?.participants) {
        const other = data.chat.participants.find((p: any) => p.userId !== currentUserId);
        if (other) setParticipant(other);
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId || "user",
      message: messageText,
      createdAt: new Date().toISOString(),
      isAi: false,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const sent = await chatApi.sendMessage(chatId, messageText);
      setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? sent : m)));
      inputRef.current?.focus();
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);
    return diffHours < 24 ? format(d, "h:mm a") : format(d, "MMM d, h:mm a");
  };

  const formatMessageDate = (date: string, index: number, arr: Message[]) => {
    const current = new Date(date).toDateString();
    const prev = index > 0 ? new Date(arr[index - 1].createdAt).toDateString() : null;
    if (index === 0 || current !== prev) {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      let label = "";
      if (current === today) label = "Today";
      else if (current === yesterday) label = "Yesterday";
      else label = format(new Date(date), "MMMM d, yyyy");
      return (
        <div className="text-center my-4">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">{label}</span>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4 flex items-center space-x-3 bg-white">
        <button onClick={onBack} className="lg:hidden text-gray-600 hover:text-gray-900 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-red-600 font-medium">
            {participant?.fullName?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{participant?.fullName || "User"}</h3>
          <p className="text-xs text-green-500">Online</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((msg, idx) => {
          const isFromMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id}>
              {formatMessageDate(msg.createdAt, idx, messages)}
              <div className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%]`}>
                  {!isFromMe && (
                    <p className="text-xs text-gray-500 mb-1 ml-2">{participant?.fullName}</p>
                  )}
                  <div className={`rounded-2xl px-4 py-2 ${
                    isFromMe
                      ? "bg-red-500 text-white"
                      : "bg-white text-gray-800 border border-gray-200"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                  <p className={`text-xs text-gray-400 mt-1 ${isFromMe ? "text-right" : "text-left"}`}>
                    {formatMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-2 rounded-full transition ${
              newMessage.trim() && !sending
                ? "bg-red-500 text-white hover:bg-red-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
