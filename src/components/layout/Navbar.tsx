"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, User, MessageCircle, Search, ChevronDown, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

interface NavbarProps {
  onSearchClick?: () => void;
  showSearchButton?: boolean;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function Navbar({ onSearchClick, showSearchButton = false }: NavbarProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [user, setUser] = useState<{ fullName: string; roles?: { name: string }[] } | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { language, setLanguage, t } = useLanguage();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

  useEffect(() => {
    const token = localStorage.getItem("berenda_token");
    if (token) {
      const storedUser = localStorage.getItem("berenda_user");
      if (storedUser && storedUser !== "undefined") {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          setUser({ fullName: "User" });
        }
      } else {
        setUser({ fullName: "User" });
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("berenda_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (_) {}
  }, [API_BASE_URL]);

  // Poll for notifications every 30 seconds when logged in
  useEffect(() => {
    const token = localStorage.getItem("berenda_token");
    if (!token) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem("berenda_token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const handleMarkOneRead = async (id: string) => {
    const token = localStorage.getItem("berenda_token");
    if (!token) return;
    try {
      await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (_) {}
  };

  const isAdmin = user?.roles?.some(
    (r) => r.name === "ADMIN" || r.name === "SUPER_ADMIN" || r.name === "admin" || r.name === "super_admin"
  );

  const handleLogout = () => {
    localStorage.removeItem("berenda_token");
    localStorage.removeItem("berenda_user");
    setUser(null);
    setIsDropdownOpen(false);
    router.push("/");
  };

  const handleHostClick = () => {
    const token = localStorage.getItem("berenda_token");
    if (!token) router.push("/auth/login");
    else router.push("/properties/host");
  };

  const handleLanguageChange = (lang: "en" | "am") => {
    setLanguage(lang);
    setIsLanguageDropdownOpen(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <nav className="w-full flex justify-between items-center px-6 py-4 bg-white shadow-sm sticky top-0 z-40 transition-all duration-300">
      {/* Left: Logo */}
      <div
        className="flex items-center gap-2 font-bold text-xl cursor-pointer"
        onClick={() => router.push("/")}
      >
        <img src="/logo.png" alt="Berenda" className="h-9 w-auto object-contain" />
        <span>Berenda</span>
      </div>

      {/* Center: Nav Links */}
      <div className="hidden md:flex gap-6 font-medium text-gray-700">
        <span
          className="cursor-pointer hover:text-gray-900 transition-colors"
          onClick={() => router.push("/")}
        >
          {t("nav.home")}
        </span>

        {showSearchButton && (
          <span
            className="cursor-pointer hover:text-red-600 transition-colors flex items-center gap-1"
            onClick={onSearchClick}
          >
            <Search className="w-4 h-4" />
            {t("common.search")}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 relative">
        {/* Search Button - Mobile */}
        {showSearchButton && (
          <button
            onClick={onSearchClick}
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
          {t("nav.host")}
        </span>

        {/* Chat / Messages Button */}
        <button
          onClick={() => router.push("/chat")}
          className="relative p-1 hover:bg-gray-100 rounded-full transition"
        >
          <MessageCircle className="w-5 h-5 text-gray-700" />
        </button>

        {/* Notification Bell — shown only when logged in */}
        {user && (
          <div className="relative">
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsLanguageDropdownOpen(false);
                setIsDropdownOpen(false);
              }}
              className="relative p-1 hover:bg-gray-100 rounded-full transition"
              aria-label={t("nav.notifications")}
            >
              <Bell className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                    <span className="font-semibold text-gray-800 text-sm">{t("notifications.title")}</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        {t("notifications.markAllRead")}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-400 text-sm">
                        {t("notifications.empty")}
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleMarkOneRead(notif.id)}
                          className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                            !notif.isRead ? "bg-red-50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!notif.isRead && (
                              <span className="mt-1.5 w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                            )}
                            <div className={!notif.isRead ? "" : "ml-4"}>
                              <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Language Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setIsLanguageDropdownOpen(!isLanguageDropdownOpen);
              setIsNotifOpen(false);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Globe className="w-5 h-5 text-gray-700" />
            <ChevronDown className="w-3 h-3 text-gray-500" />
          </button>

          {isLanguageDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsLanguageDropdownOpen(false)} />
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
          onClick={() => {
            setIsDropdownOpen(!isDropdownOpen);
            setIsNotifOpen(false);
          }}
        >
          {user ? user.fullName[0].toUpperCase() : <User className="w-5 h-5" />}
        </div>

        {isDropdownOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
            <div className="absolute right-0 top-12 bg-white border shadow-md rounded-md w-40 flex flex-col z-50 overflow-hidden">
              {!user ? (
                <>
                  <button
                    className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                    onClick={() => { router.push("/auth/register"); setIsDropdownOpen(false); }}
                  >
                    {t("nav.register")}
                  </button>
                  <button
                    className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                    onClick={() => { router.push("/auth/login"); setIsDropdownOpen(false); }}
                  >
                    {t("nav.login")}
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                    onClick={() => { router.push("/profile"); setIsDropdownOpen(false); }}
                  >
                    {t("nav.profile")}
                  </button>
                  {isAdmin && (
                    <button
                      className="px-4 py-2 text-left hover:bg-purple-50 text-purple-700 transition-colors"
                      onClick={() => { router.push("/admin"); setIsDropdownOpen(false); }}
                    >
                      🛡️ {t("nav.admin")}
                    </button>
                  )}
                  <button
                    className="px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                    onClick={handleLogout}
                  >
                    {t("nav.logout")}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
