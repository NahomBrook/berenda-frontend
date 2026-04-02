// frontend/src/components/layout/NavBar.tsx
"use client";

import { useState, useEffect } from "react";
import { Globe, User, MessageCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

interface NavbarProps {
  onSearchClick?: () => void;
  showSearchButton?: boolean;
}

export default function Navbar({ onSearchClick, showSearchButton = false }: NavbarProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ fullName: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toggleLanguage, t } = useLanguage();

  // Check for authenticated user on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const storedUser = localStorage.getItem("user");
      // Handle case where storedUser is "undefined" string or null
      if (storedUser && storedUser !== "undefined") {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Failed to parse user:", e);
          setUser({ fullName: "User" });
        }
      } else {
        setUser({ fullName: "User" });
      }
      //fetchUnreadCount();
    }
  }, []);

  

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/");
  };

  const handleHostClick = () => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/auth/login");
    else router.push("/properties/host"); 
  };

  const handleSearchClick = () => {
    if (onSearchClick) {
      onSearchClick();
    }
  };

  return (
    <nav className="w-full flex justify-between items-center px-6 py-4 bg-white shadow-sm sticky top-0 z-40 transition-all duration-300">
      {/* Left: Logo */}
      <div
        className="flex items-center gap-2 font-bold text-xl cursor-pointer"
        onClick={() => router.push("/")}
      >
        <div className="w-8 h-8 bg-red-600 rounded-full" />
        <span>Berenda</span>
      </div>

      {/* Center: Nav Links */}
      <div className="hidden md:flex gap-6 font-medium text-gray-700">
        <span 
          className="cursor-pointer hover:text-gray-900 transition-colors" 
          onClick={() => router.push("/")}
        >
          {t('Home')}
        </span>
        
        {/* Search Link - Appears when scrolled */}
        {showSearchButton && (
          <span 
            className="cursor-pointer hover:text-red-600 transition-colors flex items-center gap-1 animate-fadeIn"
            onClick={handleSearchClick}
          >
            <Search className="w-4 h-4" />
            {t('search')}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 relative">
        {/* Search Button - Mobile */}
        {showSearchButton && (
          <button
            onClick={handleSearchClick}
            className="md:hidden p-1 hover:bg-gray-100 rounded-full transition"
          >
            <Search className="w-5 h-5 text-gray-700" />
          </button>
        )}

        {/* Host Button */}
        <span
          className="hidden md:block cursor-pointer hover:text-gray-900 transition-colors"
          onClick={handleHostClick}
        >
          {t('+ Host a Berenda')}
        </span>

        {/* Chat Button */}
        <button
          onClick={() => router.push("/chat")}
          className="relative p-1 hover:bg-gray-100 rounded-full transition"
        >
          <MessageCircle className="w-5 h-5 text-gray-700" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Globe / Language */}
        <Globe 
          className="w-5 h-5 cursor-pointer text-gray-700 hover:text-gray-900 transition-colors" 
          onClick={toggleLanguage}
        />

        {/* Profile / Auth Dropdown */}
        <div
          className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-medium cursor-pointer hover:bg-red-700 transition-colors"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {user ? user.fullName[0].toUpperCase() : <User className="w-5 h-5" />}
        </div>

        {isDropdownOpen && (
          <div className="absolute right-0 top-12 bg-white border shadow-md rounded-md w-40 flex flex-col z-50 animate-slideDown">
            {!user ? (
              <>
                <button
                  className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                  onClick={() => router.push("/auth/register")}
                >
                  {t('register')}
                </button>
                <button
                  className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                  onClick={() => router.push("/auth/login")}
                >
                  {t('login')}
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                  onClick={() => router.push("/profile")}
                >
                  {t('profile')}
                </button>
                
                <button
                  className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                  onClick={handleLogout}
                >
                  {t('logout')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}