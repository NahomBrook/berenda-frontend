"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/NavBar";
import ChatList from "@/components/chat/ChatList";
import ChatRoom from "@/components/chat/ChatRoom";

export default function ChatPage() {
  const router = useRouter();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
    }

    // Check if mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, [router]);

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    if (isMobile) {
      setShowChatList(false);
    }
  };

  const handleBackToList = () => {
    setShowChatList(true);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto mt-8 px-4 pb-16">
        <div className="mb-6">
          <h1 className="text-3xl font-light text-gray-900">Messages</h1>
          <p className="text-gray-500">Chat with hosts and renters</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden h-[600px] lg:h-[700px]">
          <div className="flex h-full">
            {/* Chat List - Hidden on mobile when chat is selected */}
            <div
              className={`${
                isMobile && !showChatList ? 'hidden' : 'w-full lg:w-96'
              } border-r border-gray-200 overflow-y-auto`}
            >
              <ChatList
                onSelectChat={handleSelectChat}
                selectedChatId={selectedChatId || undefined}
              />
            </div>

            {/* Chat Room - Hidden on mobile when chat list is showing */}
            <div
              className={`${
                isMobile && showChatList ? 'hidden' : 'flex-1'
              } overflow-hidden`}
            >
              {selectedChatId ? (
                <ChatRoom
                  chatId={selectedChatId}
                  onBack={handleBackToList}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p>Select a conversation to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}