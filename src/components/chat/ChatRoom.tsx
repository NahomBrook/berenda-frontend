// frontend/src/components/chat/ChatRoom.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, Bot, Loader2, Sparkles } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
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
  const [isAIChat, setIsAIChat] = useState(false);
  const [participant, setParticipant] = useState<{ fullName: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if this is an AI chat
    setIsAIChat(chatId === 'ai-assistant');
    
    // Get current user
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const parsedUser = JSON.parse(user);
        setCurrentUserId(parsedUser.id);
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }

    if (chatId !== 'ai-assistant') {
      fetchMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    } else {
      // For AI chat, load welcome message
      setMessages([{
        id: 'welcome',
        senderId: 'ai',
        message: "👋 Hello! I'm your Berenda AI Assistant. I can help you with:\n\n🏠 **Finding properties** - Search by location, price, or amenities\n📅 **Making bookings** - Guide you through the booking process\n💰 **Pricing questions** - Explain pricing and fees\n📍 **Location information** - Tell you about neighborhoods\n🔑 **Hosting your property** - Guide you through becoming a host\n👤 **Account management** - Help with profile and settings\n\nWhat would you like to know?",
        createdAt: new Date().toISOString(),
        isAi: true
      }]);
      setLoading(false);
    }
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    try {
      const data = await chatApi.getMessages(chatId);
      setMessages(data.messages || []);
      
      // Get participant info
      if (data.chat?.participants) {
        const otherParticipant = data.chat.participants.find(
          (p: any) => p.userId !== currentUserId
        );
        if (otherParticipant) {
          setParticipant(otherParticipant);
        }
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
    
    // Add user message immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: currentUserId || 'user',
      message: messageText,
      createdAt: new Date().toISOString(),
      isAi: false
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      if (isAIChat) {
        // Send to AI endpoint
        setIsTyping(true);
        const aiResponse = await chatApi.sendAIMessage('ai-assistant', messageText);
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      } else {
        // Regular chat
        const sentMessage = await chatApi.sendMessage(chatId, messageText);
        // Replace temp message with real one
        setMessages(prev => prev.map(m => m.id === tempUserMessage.id ? sentMessage : m));
      }
      
      inputRef.current?.focus();
    } catch (err) {
      console.error("Error sending message:", err);
      // Remove the temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      setNewMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      return format(messageDate, 'h:mm a');
    } else {
      return format(messageDate, 'MMM d, h:mm a');
    }
  };

  const formatMessageDate = (date: string, index: number, messagesArray: Message[]) => {
    const currentDate = new Date(date).toDateString();
    const prevDate = index > 0 ? new Date(messagesArray[index - 1].createdAt).toDateString() : null;
    
    if (index === 0 || currentDate !== prevDate) {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      let displayDate = '';
      if (currentDate === today) displayDate = 'Today';
      else if (currentDate === yesterday) displayDate = 'Yesterday';
      else displayDate = format(new Date(date), 'MMMM d, yyyy');
      
      return (
        <div className="text-center my-4">
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
            {displayDate}
          </span>
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
        <button
          onClick={onBack}
          className="lg:hidden text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {isAIChat ? (
          <>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                AI Assistant
                <Sparkles className="w-4 h-4 text-purple-500" />
              </h3>
              <p className="text-xs text-gray-500">Always here to help</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-medium">
                {participant?.fullName?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {participant?.fullName || "User"}
              </h3>
              <p className="text-xs text-green-500">Online</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        {messages.map((msg, idx) => {
          const isFromMe = msg.senderId === currentUserId;
          const dateHeader = formatMessageDate(msg.createdAt, idx, messages);
          
          return (
            <div key={msg.id}>
              {dateHeader}
              <div className={`flex ${isFromMe && !msg.isAi ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isFromMe && !msg.isAi ? 'order-2' : 'order-1'}`}>
                  {!isFromMe && !isAIChat && !msg.isAi && (
                    <p className="text-xs text-gray-500 mb-1 ml-2">
                      {participant?.fullName}
                    </p>
                  )}
                  
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isFromMe && !msg.isAi
                        ? 'bg-red-500 text-white'
                        : msg.isAi
                        ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-gray-800 border border-purple-200'
                        : 'bg-white text-gray-800 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {msg.message}
                    </p>
                  </div>
                  
                  <p className={`text-xs text-gray-400 mt-1 ${isFromMe && !msg.isAi ? 'text-right' : 'text-left'}`}>
                    {formatMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-2 border border-gray-200">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
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
            onKeyPress={handleKeyPress}
            placeholder={
              isAIChat 
                ? "Ask me anything about Berenda..." 
                : "Type a message..."
            }
            className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className={`p-2 rounded-full transition ${
              newMessage.trim() && !sending
                ? isAIChat
                  ? 'bg-purple-500 text-white hover:bg-purple-600'
                  : 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        {isAIChat && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            💡 I can help with properties, bookings, pricing, locations, and more!
          </p>
        )}
      </div>
    </div>
  );
}