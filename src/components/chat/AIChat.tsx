// frontend/src/components/chat/AIChat.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, X, Sparkles, Loader2, Minimize2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { API_BASE_URL } from "@/utils/api";
import { useLanguage } from "../../context/LanguageContext";

interface Message {
  id: string;
  message: string;
  isAi: boolean;
  createdAt: Date;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const { t, language } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("aiConversationId") || "";
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize welcome message based on language
  useEffect(() => {
    setMessages([
      {
        id: "welcome",
        message: t("ai.welcome"),
        isAi: true,
        createdAt: new Date(),
      },
    ]);
  }, [language]); // Re-run when language changes

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        message: userMessage,
        isAi: false,
        createdAt: new Date(),
      },
    ]);

    setLoading(true);
    setIsTyping(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Not authenticated");
      }

      let cid = conversationId;
      if (!cid) {
        cid = `ai-session-${Date.now()}`;
        sessionStorage.setItem("aiConversationId", cid);
        setConversationId(cid);
      }

      // Send language preference to backend
      const response = await fetch(`${API_BASE_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          message: userMessage, 
          conversationId: cid,
          language: language === 'am' ? 'amharic' : 'english'
        }),
      });

      if (!response.ok) throw new Error("Failed to get AI response");

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          id: data.id,
          message: data.message,
          isAi: true,
          createdAt: new Date(data.createdAt),
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          message: t("ai.error"),
          isAi: true,
          createdAt: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const clearChat = () => {
    setMessages([
      {
        id: "welcome",
        message: t("ai.welcome"),
        isAi: true,
        createdAt: new Date(),
      },
    ]);
    try {
      const token = localStorage.getItem("token");
      if (token) {
        sessionStorage.removeItem("aiConversationId");
        setConversationId("");
        // Fire-and-forget backend conversation clear
        fetch(`${API_BASE_URL}/ai/chat/history`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ conversationId: conversationId || undefined }),
        }).catch(() => undefined);
      }
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-red-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
        >
          <Bot className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fadeIn"
        onClick={onClose}
      />
      
      <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col animate-slideUp overflow-hidden">
        {/* Header - Brand Red */}
        <div className="flex items-center justify-between p-4 border-b bg-red-600">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{t("ai.title")}</h3>
              <p className="text-xs text-red-100">{t("ai.subtitle")}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearChat}
              className="text-white hover:bg-white/20 rounded-full p-1 transition text-xs"
              title={t("ai.clear")}
            >
              {t("ai.clear")}
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-white hover:bg-white/20 rounded-full p-1 transition"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isAi ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] ${msg.isAi ? 'order-1' : 'order-2'}`}>
                {msg.isAi && (
                  <div className="flex items-center gap-1 mb-1">
                    <Sparkles className="w-3 h-3 text-red-500" />
                    <span className="text-xs text-gray-500">{t("ai.title")}</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    msg.isAi
                      ? 'bg-white text-gray-800 border border-gray-200'
                      : 'bg-red-600 text-white'
                  }`}
                >
                  <div className={`prose prose-sm max-w-none ${
                    msg.isAi ? 'prose-gray' : 'prose-invert'
                  }`}>
                    <ReactMarkdown>
                      {msg.message}
                    </ReactMarkdown>
                  </div>
                </div>
                <p className={`text-xs text-gray-400 mt-1 ${msg.isAi ? 'text-left' : 'text-right'}`}>
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          ))}
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
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("ai.placeholder")}
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || loading}
              className="w-10 h-10 bg-red-600 text-white rounded-full hover:bg-red-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            {t("ai.tip")}
          </p>
        </div>
      </div>
    </>
  );
}