// frontend/src/components/layout/NavBar.tsx
"use client";

import { useState, useEffect } from "react";
import { Globe, User, MessageCircle, Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

interface NavbarProps {
  onSearchClick?: () => void;
  showSearchButton?: boolean;
}

export default function Navbar({ onSearchClick, showSearchButton = false }: NavbarProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ fullName: string } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const { language, setLanguage, t } = useLanguage();

  // Check for authenticated user on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const storedUser = localStorage.getItem("user");
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

  const handleLanguageChange = (lang: "en" | "am") => {
    setLanguage(lang);
    setIsLanguageDropdownOpen(false);
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
          {t('nav.home')}
        </span>
        
        {/* Search Link - Appears when scrolled */}
        {showSearchButton && (
          <span 
            className="cursor-pointer hover:text-red-600 transition-colors flex items-center gap-1 animate-fadeIn"
            onClick={handleSearchClick}
          >
            <Search className="w-4 h-4" />
            {t('common.search')}
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
          {t('nav.host')}
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

        {/* Language Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Globe className="w-5 h-5 text-gray-700" />
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          {isLanguageDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsLanguageDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    language === "en" ? "bg-red-50 text-red-600" : "text-gray-700"
                  }`}
                >
                  <span>English</span>
                  {language === "en" && <span className="text-red-600">✓</span>}
                </button>
                <button
                  onClick={() => handleLanguageChange("am")}
                  className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                    language === "am" ? "bg-red-50 text-red-600" : "text-gray-700"
                  }`}
                >
                  <span>አማርኛ</span>
                  {language === "am" && <span className="text-red-600">✓</span>}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Profile / Auth Dropdown */}
        <div
          className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-medium cursor-pointer hover:bg-red-700 transition-colors"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          {user ? user.fullName[0].toUpperCase() : <User className="w-5 h-5" />}
        </div>

        {isDropdownOpen && (
          <div className="absolute right-0 top-12 bg-white border shadow-md rounded-md w-40 flex flex-col z-50 animate-slideDown overflow-hidden">
            {!user ? (
              <>
                <button
                  className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                  onClick={() => router.push("/auth/register")}
                >
                  {t('nav.register')}
                </button>
                <button
                  className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                  onClick={() => router.push("/auth/login")}
                >
                  {t('nav.login')}
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                  onClick={() => router.push("/profile")}
                >
                  {t('nav.profile')}
                </button>
                <button
                  className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                  onClick={() => router.push("/bookings")}
                >
                  {t('nav.bookings')}
                </button>
                <button
                  className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                  onClick={handleLogout}
                >
                  {t('nav.logout')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}