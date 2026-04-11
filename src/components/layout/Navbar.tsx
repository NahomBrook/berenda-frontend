"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, User, MessageCircle, Search, Bell, Home } from "lucide-react";
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
  link?: string;
}

export default function Navbar({ onSearchClick, showSearchButton = false }: NavbarProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
        try { setUser(JSON.parse(storedUser)); }
        catch { setUser({ fullName: "User" }); }
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

  const handleNotifClick = async (notif: Notification) => {
    // Mark as read
    const token = localStorage.getItem("berenda_token");
    if (token && !notif.isRead) {
      try {
        await fetch(`${API_BASE_URL}/notifications/${notif.id}/read`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (_) {}
    }
    // Navigate if there's a link
    if (notif.link) {
      setIsNotifOpen(false);
      router.push(notif.link);
    }
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
    <nav className="w-full bg-white shadow-sm sticky top-0 z-40">
      <div className="flex items-center px-4 md:px-6 py-3 md:py-4">

        {/* ── LEFT: Logo ── */}
        <div
          className="flex items-center gap-2 font-bold text-xl cursor-pointer shrink-0"
          onClick={() => router.push("/")}
        >
          <img src="/logo.png" alt="Berenda" className="h-8 md:h-9 w-auto object-contain" />
          <span className="hidden sm:inline text-gray-900">Berenda</span>
        </div>

        {/* ── CENTER ── */}
        {/* Mobile: Search icon + Host icon */}
        <div className="flex md:hidden flex-1 justify-center items-center gap-6">
          <button
            onClick={showSearchButton ? onSearchClick : () => router.push("/")}
            className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-red-600 transition-colors"
            aria-label={t("common.search")}
          >
            <Search className="w-5 h-5" />
            <span className="text-[10px] font-medium">Search</span>
          </button>
          <button
            onClick={handleHostClick}
            className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-red-600 transition-colors"
            aria-label={t("nav.host")}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium">Host</span>
          </button>
        </div>

        {/* Desktop: Nav links in center */}
        <div className="hidden md:flex flex-1 justify-center gap-6 font-medium text-gray-700">
          <span className="cursor-pointer hover:text-gray-900 transition-colors" onClick={() => router.push("/")}>
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

        {/* ── RIGHT ── */}
        <div className="flex items-center gap-1 md:gap-2 shrink-0 relative">

          {/* Desktop: Host link + Chat */}
          <span
            className="hidden md:inline cursor-pointer hover:text-gray-900 transition-colors whitespace-nowrap text-sm font-medium px-2"
            onClick={handleHostClick}
          >
            {t("nav.host")}
          </span>
          <button
            onClick={() => router.push("/chat")}
            className="hidden md:flex p-2 hover:bg-gray-100 rounded-full transition"
            aria-label={t("nav.messages")}
          >
            <MessageCircle className="w-5 h-5 text-gray-700" />
          </button>

          {/* Notification Bell — both mobile & desktop when logged in */}
          {user && (
            <div className="relative">
              <button
                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsDropdownOpen(false); }}
                className="relative p-2 hover:bg-gray-100 rounded-full transition"
                aria-label={t("nav.notifications")}
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 z-20 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
                      <span className="font-semibold text-gray-800 text-sm">{t("notifications.title")}</span>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} className="text-xs text-red-600 hover:text-red-700 font-medium">
                          {t("notifications.markAllRead")}
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-gray-400 text-sm">
                          {t("notifications.empty")}
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-start gap-3 ${!notif.isRead ? "bg-red-50" : ""}`}
                          >
                            {!notif.isRead && (
                              <span className="mt-1.5 w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                            )}
                            <div className={!notif.isRead ? "" : "ml-5"}>
                              <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                              {notif.link && (
                                <p className="text-xs text-red-500 mt-1 font-medium">Tap to view →</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
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

          {/* Profile avatar */}
          <div
            className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-medium cursor-pointer hover:bg-red-700 transition-colors shrink-0"
            onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotifOpen(false); }}
          >
            {user ? user.fullName[0].toUpperCase() : <User className="w-5 h-5" />}
          </div>

          {/* Profile dropdown */}
          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 top-12 bg-white border border-gray-100 shadow-xl rounded-2xl w-52 flex flex-col z-50 overflow-hidden">
                {!user ? (
                  <>
                    <button
                      className="px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm text-gray-700"
                      onClick={() => { router.push("/auth/register"); setIsDropdownOpen(false); }}
                    >
                      {t("nav.register")}
                    </button>
                    <button
                      className="px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm text-gray-700"
                      onClick={() => { router.push("/auth/login"); setIsDropdownOpen(false); }}
                    >
                      {t("nav.login")}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Profile */}
                    <button
                      className="px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm text-gray-700 flex items-center gap-3"
                      onClick={() => { router.push("/profile"); setIsDropdownOpen(false); }}
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      {t("nav.profile")}
                    </button>

                    {/* Chat */}
                    <button
                      className="px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm text-gray-700 flex items-center gap-3 border-t border-gray-100"
                      onClick={() => { router.push("/chat"); setIsDropdownOpen(false); }}
                    >
                      <MessageCircle className="w-4 h-4 text-gray-400" />
                      {t("nav.messages")}
                    </button>

                    {/* Language */}
                    <div className="px-4 py-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                        <Globe className="w-3 h-3" />
                        {t("nav.language") || "Language"}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setLanguage("en")}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            language === "en" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          EN
                        </button>
                        <button
                          onClick={() => setLanguage("am")}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            language === "am" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          አማ
                        </button>
                      </div>
                    </div>

                    {/* Admin */}
                    {isAdmin && (
                      <button
                        className="px-4 py-3 text-left hover:bg-purple-50 text-purple-700 transition-colors text-sm border-t border-gray-100 flex items-center gap-3"
                        onClick={() => { router.push("/admin"); setIsDropdownOpen(false); }}
                      >
                        🛡️ {t("nav.admin")}
                      </button>
                    )}

                    {/* Logout */}
                    <button
                      className="px-4 py-3 text-left hover:bg-red-50 text-red-600 transition-colors text-sm border-t border-gray-100"
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
      </div>
    </nav>
  );
}
