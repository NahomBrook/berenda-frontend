import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { chatAPI, aiAPI } from '../services/api';
import { formatChatTime, formatMessageTime, getErrorMessage } from '../utils';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import type { Chat, Message } from '../types';

type ActiveView = 'list' | 'chat' | 'ai';

interface AIConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

const MessagesPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [view, setView] = useState<ActiveView>('list');
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // AI Chat state
  const [aiMessages, setAIMessages] = useState<AIConversationMessage[]>([]);
  const [aiInput, setAIInput] = useState('');
  const [isAISending, setIsAISending] = useState(false);
  const [aiConversationId] = useState(() => `conv_${Date.now()}`);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chats
  const loadChats = useCallback(async () => {
    try {
      const res = await chatAPI.getChats();
      setChats(res.data.chats || []);
    } catch {
      // Silent fail
    } finally {
      setIsLoadingChats(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  // Initialize AI chat with welcome message
  useEffect(() => {
    if (aiMessages.length === 0) {
      setAIMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: t('messages.aiWelcome'),
          createdAt: new Date().toISOString(),
        },
      ]);
    }
  }, [t]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom(messagesEndRef);
  }, [messages]);

  useEffect(() => {
    scrollToBottom(aiMessagesEndRef);
  }, [aiMessages]);

  // Load messages for selected chat + polling
  const loadMessages = useCallback(async (chatId: string) => {
    setIsLoadingMessages(true);
    try {
      const res = await chatAPI.getMessages(chatId);
      setMessages(res.data.messages || []);
    } catch {
      toast.error('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const startPolling = useCallback((chatId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await chatAPI.getMessages(chatId);
        setMessages(res.data.messages || []);
      } catch {}
    }, 3000);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  const openChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setView('chat');
    stopPolling();
    await loadMessages(chat.id);
    startPolling(chat.id);
    // Update unread count locally
    setChats((prev) =>
      prev.map((c) => (c.id === chat.id ? { ...c, unreadCount: 0 } : c))
    );
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || isSending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistic update
    const tempMsg: Message = {
      id: `temp_${Date.now()}`,
      chatId: selectedChat.id,
      senderId: user?.id || '',
      message: messageText,
      createdAt: new Date().toISOString(),
      isAi: false,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const res = await chatAPI.sendMessage(selectedChat.id, messageText);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMsg.id ? { ...tempMsg, ...res.data } : m))
      );
      // Refresh chat list to update last message
      loadChats();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      toast.error(getErrorMessage(err));
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendAIMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAISending) return;

    const messageText = aiInput.trim();
    setAIInput('');
    setIsAISending(true);

    // Add user message immediately
    const userMsg: AIConversationMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: messageText,
      createdAt: new Date().toISOString(),
    };
    setAIMessages((prev) => [...prev, userMsg]);

    // Add typing indicator
    const typingId = `typing_${Date.now()}`;
    setAIMessages((prev) => [
      ...prev,
      { id: typingId, role: 'assistant', content: '...', createdAt: new Date().toISOString() },
    ]);

    try {
      const res = await aiAPI.sendMessage(messageText, aiConversationId);
      const aiResponse = res.data;

      setAIMessages((prev) =>
        prev
          .filter((m) => m.id !== typingId)
          .concat({
            id: aiResponse.id || `ai_${Date.now()}`,
            role: 'assistant',
            content: aiResponse.message,
            createdAt: aiResponse.createdAt || new Date().toISOString(),
          })
      );
    } catch {
      setAIMessages((prev) => prev.filter((m) => m.id !== typingId));
      toast.error(t('messages.messageError'));
    } finally {
      setIsAISending(false);
      setTimeout(() => aiInputRef.current?.focus(), 100);
    }
  };

  const clearAIHistory = async () => {
    try {
      await aiAPI.clearHistory();
    } catch {}
    setAIMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: t('messages.aiWelcome'),
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  const totalUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-lg text-gray-900">
                {t('messages.title')}
                {totalUnread > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </h2>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setView('ai')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  view === 'ai' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                🤖 {t('messages.aiTab')}
              </button>
              <button
                onClick={() => { setView('list'); stopPolling(); }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  view === 'list' || view === 'chat'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                💬 {t('messages.chatsTab')}
              </button>
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {view === 'ai' ? (
              <div className="p-4">
                <div
                  className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 cursor-pointer hover:shadow-sm transition-all"
                  onClick={() => setView('ai')}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg flex-shrink-0">
                    🤖
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900">{t('messages.aiChat')}</p>
                    <p className="text-xs text-gray-500 truncate">{t('messages.startAIChat')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {isLoadingChats ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : chats.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                    <span className="text-4xl mb-3">💬</span>
                    <p className="text-sm text-gray-500">{t('messages.noChats')}</p>
                    <button
                      onClick={() => setView('ai')}
                      className="mt-3 text-xs text-blue-600 hover:underline"
                    >
                      {t('messages.startAIChat')} →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-0.5 p-2">
                    {chats.map((chat) => (
                      <ChatListItem
                        key={chat.id}
                        chat={chat}
                        isSelected={selectedChat?.id === chat.id && view === 'chat'}
                        currentUserId={user?.id || ''}
                        onClick={() => openChat(chat)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Main Area */}
        <main className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {view === 'ai' ? (
            <AIChatPanel
              messages={aiMessages}
              input={aiInput}
              onInputChange={setAIInput}
              onSend={handleSendAIMessage}
              onClear={clearAIHistory}
              isSending={isAISending}
              messagesEndRef={aiMessagesEndRef}
              inputRef={aiInputRef}
              t={t}
            />
          ) : view === 'chat' && selectedChat ? (
            <ChatPanel
              chat={selectedChat}
              messages={messages}
              currentUserId={user?.id || ''}
              isLoading={isLoadingMessages}
              newMessage={newMessage}
              onMessageChange={setNewMessage}
              onSend={handleSendMessage}
              isSending={isSending}
              messagesEndRef={messagesEndRef}
              inputRef={inputRef}
              onBack={() => { setView('list'); stopPolling(); }}
              t={t}
            />
          ) : (
            <EmptyState onStartAI={() => setView('ai')} t={t} />
          )}
        </main>
      </div>
    </div>
  );
};

// ─── Chat List Item ────────────────────────────────────────────────────────────

const ChatListItem: React.FC<{
  chat: Chat;
  isSelected: boolean;
  currentUserId: string;
  onClick: () => void;
}> = ({ chat, isSelected, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      <Avatar
        src={chat.participant?.profileImage}
        name={chat.participant?.fullName || '?'}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">
            {chat.participant?.fullName || 'Unknown'}
          </p>
          {chat.lastMessage && (
            <span className="text-xs text-gray-400 flex-shrink-0 ml-1">
              {formatChatTime(chat.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs text-gray-500 truncate">
            {chat.lastMessage
              ? `${chat.lastMessage.isFromMe ? 'You: ' : ''}${chat.lastMessage.content}`
              : 'No messages yet'}
          </p>
          {chat.unreadCount > 0 && (
            <span className="flex-shrink-0 ml-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

// ─── AI Chat Panel ────────────────────────────────────────────────────────────

const AIChatPanel: React.FC<{
  messages: AIConversationMessage[];
  input: string;
  onInputChange: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  onClear: () => void;
  isSending: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  t: (key: string) => string;
}> = ({ messages, input, onInputChange, onSend, onClear, isSending, messagesEndRef, inputRef, t }) => (
  <>
    {/* Header */}
    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">{t('messages.aiChat')}</p>
          <p className="text-xs text-green-500 font-medium">{t('messages.online')}</p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onClear} title={t('messages.clearHistory')}>
        🗑️
      </Button>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1">
              🤖
            </div>
          )}
          <div>
            {msg.content === '...' ? (
              <div className="chat-bubble-ai flex items-center gap-1 py-3">
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <div
                className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            )}
            <p className={`text-xs text-gray-400 mt-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              {formatMessageTime(msg.createdAt)}
            </p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>

    {/* Input */}
    <form onSubmit={onSend} className="px-4 py-3 border-t border-gray-100">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={t('messages.typeMessage')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-gray-50"
          disabled={isSending}
        />
        <Button
          type="submit"
          disabled={!input.trim()}
          isLoading={isSending}
          size="md"
        >
          ✈️
        </Button>
      </div>
    </form>
  </>
);

// ─── Chat Panel ───────────────────────────────────────────────────────────────

const ChatPanel: React.FC<{
  chat: Chat;
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  newMessage: string;
  onMessageChange: (v: string) => void;
  onSend: (e: React.FormEvent) => void;
  isSending: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onBack: () => void;
  t: (key: string) => string;
}> = ({
  chat,
  messages,
  currentUserId,
  isLoading,
  newMessage,
  onMessageChange,
  onSend,
  isSending,
  messagesEndRef,
  inputRef,
  onBack,
  t,
}) => (
  <>
    {/* Header */}
    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
      <button onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
        ←
      </button>
      <Avatar
        src={chat.participant?.profileImage}
        name={chat.participant?.fullName || '?'}
        size="sm"
      />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 truncate">
          {chat.participant?.fullName || 'Unknown'}
        </p>
      </div>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-center">
          <div>
            <span className="text-4xl">👋</span>
            <p className="text-sm text-gray-500 mt-2">{t('messages.noMessages')}</p>
          </div>
        </div>
      ) : (
        messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div>
                <div className={isMe ? 'chat-bubble-user' : 'chat-bubble-other'}>
                  <p className="text-sm">{msg.message}</p>
                </div>
                <p className={`text-xs text-gray-400 mt-0.5 ${isMe ? 'text-right' : 'text-left'}`}>
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />
    </div>

    {/* Input */}
    <form onSubmit={onSend} className="px-4 py-3 border-t border-gray-100">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder={t('messages.typeMessage')}
          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-gray-50"
          disabled={isSending}
        />
        <Button type="submit" disabled={!newMessage.trim()} isLoading={isSending} size="md">
          ✈️
        </Button>
      </div>
    </form>
  </>
);

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{
  onStartAI: () => void;
  t: (key: string) => string;
}> = ({ onStartAI, t }) => (
  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
    <span className="text-6xl mb-4">💬</span>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('messages.title')}</h3>
    <p className="text-sm text-gray-500 mb-6 max-w-xs">
      Select a conversation or chat with the Berenda AI Assistant.
    </p>
    <Button onClick={onStartAI} size="lg">
      🤖 {t('messages.startAIChat')}
    </Button>
  </div>
);

export default MessagesPage;
