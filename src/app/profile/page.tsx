"use client";

import { useEffect, useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Heart,
  Settings,
  Edit2,
  Save,
  X,
  LogOut,
  ChevronRight,
  Star,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Globe,
  Lock,
} from "lucide-react";
import { getProfile, updateProfile, getUserBookings, getFavorites, getUserProperties, updateUserSettings, getSettings } from "../../utils/profileApi";
import Navbar from "@/components/layout/Navbar";
import { useLanguage } from "@/context/LanguageContext";

interface Tab {
  name: string;
  key: string;
  icon: React.ReactNode;
}

interface Booking {
  id: string;
  propertyTitle: string;
  propertyLocation: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  imageUrl: string;
}

interface WishlistItem {
  id: string;
  title: string;
  location: string;
  price: number;
  imageUrl: string;
  rating: number;
}

interface HostedProperty {
  id: string;
  title: string;
  location: string;
  monthlyPrice: number;
  status: 'pending' | 'approved' | 'rejected';
  imageUrl: string;
  createdAt: string;
}

interface UserSettings {
  emailNotifications: {
    newMessages: boolean;
    bookingConfirmations: boolean;
    promotionalOffers: boolean;
  };
  privacy: {
    profilePublic: boolean;
    showEmail: boolean;
  };
  language: string;
  region: string;
  currency?: string;
}

export default function ProfileDashboard() {
  const router = useRouter();
  const { t, setLanguage, language } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>({ name: "Profile", key: "profile", icon: <User className="w-5 h-5" /> });
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [hostedProperties, setHostedProperties] = useState<HostedProperty[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: {
      newMessages: true,
      bookingConfirmations: true,
      promotionalOffers: false,
    },
    privacy: {
      profilePublic: true,
      showEmail: false,
    },
    language: "en",
    region: "US",
    currency: "USD",
  });
  const [savingSettings, setSavingSettings] = useState(false);

  const tabs: Tab[] = [
    { name: t("profile.tab.profile"), key: "profile", icon: <User className="w-5 h-5" /> },
    { name: t("profile.tab.bookings"), key: "bookings", icon: <Calendar className="w-5 h-5" /> },
    { name: t("profile.tab.wishlist"), key: "wishlist", icon: <Heart className="w-5 h-5" /> },
    { name: t("profile.tab.hosting"), key: "hosting", icon: <Home className="w-5 h-5" /> },
    { name: t("profile.tab.settings"), key: "settings", icon: <Settings className="w-5 h-5" /> },
  ];

  useEffect(() => {
    const storedToken = localStorage.getItem("berenda_token");
    if (!storedToken) {
      router.push("/auth/login");
      return;
    }
    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) return;
    
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await getProfile(token);
        if (res.success) {
          setUser(res.data);
          setForm({
            fullName: res.data.fullName,
            email: res.data.email,
            phone: res.data.phone || "",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    const fetchBookings = async () => {
      try {
        const res = await getUserBookings(token);
        if (res.success && res.data) {
          const transformedBookings = res.data.map((booking: any) => ({
            id: booking.id,
            propertyTitle: booking.property?.title || "Property",
            propertyLocation: booking.property?.location || "Location",
            checkIn: booking.startDate,
            checkOut: booking.endDate,
            totalPrice: booking.totalPrice || booking.property?.monthlyPrice || 0,
            status: mapBookingStatus(booking.status),
            imageUrl: booking.property?.media?.[0]?.mediaUrl || "/placeholder.png"
          }));
          setBookings(transformedBookings);
        }
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };
    
    fetchBookings();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    const fetchWishlist = async () => {
      try {
        const res = await getFavorites(token);
        if (res.success && res.data) {
          setWishlist(res.data);
        }
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      }
    };
    
    fetchWishlist();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    const fetchHostedProperties = async () => {
      try {
        const res = await getUserProperties(token);
        if (res.success && res.data) {
          const transformedProperties = res.data.map((property: any) => ({
            id: property.id,
            title: property.title,
            location: property.location,
            monthlyPrice: property.monthlyPrice,
            status: property.approvalStatus,
            imageUrl: property.media?.[0]?.mediaUrl || "/placeholder.png",
            createdAt: property.createdAt,
          }));
          setHostedProperties(transformedProperties);
        }
      } catch (error) {
        console.error("Error fetching hosted properties:", error);
      }
    };
    
    fetchHostedProperties();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    
    const fetchSettings = async () => {
      try {
        const res = await getSettings(token);
        if (res.success && res.data) {
          setSettings({
            ...settings,
            ...res.data,
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    
    fetchSettings();
  }, [token]);

  const mapBookingStatus = (status: string): 'confirmed' | 'pending' | 'cancelled' | 'completed' => {
    switch (status.toLowerCase()) {
      case 'approved':
      case 'confirmed':
        return 'confirmed';
      case 'cancelled':
        return 'cancelled';
      case 'completed':
        return 'completed';
      default:
        return 'pending';
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!token) return;
    try {
      await updateProfile(form, token, imageFile || undefined);

      setMessage("Profile updated successfully!");
      setMessageType("success");
      setEditing(false);

      const refreshed = await getProfile(token);
      if (refreshed.success) {
        setUser(refreshed.data);
        localStorage.setItem("berenda_user", JSON.stringify(refreshed.data));
      }
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.message || "Failed to update profile");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // Auto-save settings function
  const handleAutoSaveSettings = async (newSettings: any) => {
    if (!token) return;
    
    try {
      await updateUserSettings(newSettings, token);
      setMessage("Settings saved!");
      setMessageType("success");
      setTimeout(() => setMessage(""), 2000);
    } catch (err: any) {
      console.error("Error auto-saving settings:", err);
    }
  };

  const handleSaveSettings = async () => {
    if (!token) return;
    setSavingSettings(true);
    try {
      await updateUserSettings(settings, token);
      setMessage("Settings updated successfully!");
      setMessageType("success");
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.message || "Failed to update settings");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("berenda_token");
    localStorage.removeItem("berenda_user");
    router.push("/");
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed':
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'pending':
      case 'pending_payment':
        return 'text-yellow-600 bg-yellow-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      case 'completed':
        return 'text-blue-600 bg-blue-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed':
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
      case 'pending_payment':
        return <Clock className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getHostingStatusColor = (status: string) => {
    switch(status) {
      case 'approved':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'rejected':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="col-span-1">
                <div className="h-96 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="col-span-3">
                <div className="h-96 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("profile.title")}</h1>
          <p className="text-gray-600 mt-2">{t("profile.subtitle")}</p>
        </div>

        {/* Message Toast */}
        {message && (
          <div className={`fixed top-20 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
            messageType === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="md:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              {/* Profile Summary */}
              <div className="p-6 text-center border-b border-gray-100">
                <div className="relative inline-block">
                  <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-red-100 shadow-lg bg-gradient-to-br from-red-100 to-red-50">
                    {imagePreview || user.profileImageUrl ? (
                      <img
                        src={imagePreview || user.profileImageUrl}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/default-avatar.png";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-400 to-red-600">
                        <span className="text-white text-4xl font-bold">
                          {user.fullName?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                    )}
                  </div>
                  {editing && (
                    <label className="absolute bottom-0 right-0 bg-red-500 rounded-full p-2 cursor-pointer hover:bg-red-600 transition shadow-lg">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                      <Edit2 className="w-4 h-4 text-white" />
                    </label>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{user.fullName}</h2>
                <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                {user.phone && (
                  <p className="text-sm text-gray-500 mt-1 flex items-center justify-center gap-1">
                    <Phone className="w-3 h-3" /> {user.phone}
                  </p>
                )}
              </div>

              {/* Navigation Tabs */}
              <nav className="p-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full flex items-center justify-between px-4 py-3 mb-2 rounded-xl transition-all duration-200 ${
                      activeTab.key === tab.key
                        ? "bg-red-50 text-red-600 font-medium shadow-sm"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {tab.icon}
                      <span>{tab.name}</span>
                    </div>
                    {activeTab.key === tab.key && (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ))}
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 mt-4 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span>{t("profile.logout")}</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            {activeTab.key === "profile" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">{t("profile.info.title")}</h2>
                        <p className="text-gray-600 mt-1">{t("profile.info.subtitle")}</p>
                    </div>
                    {!editing && (
                      <button
                        onClick={() => setEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                      >
                          <Edit2 className="w-4 h-4" />
                          {t("profile.editProfile")}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        {t("profile.field.fullName")}
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition ${
                          editing 
                            ? "border-gray-300 focus:border-red-500" 
                            : "bg-gray-50 border-gray-200 cursor-not-allowed"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-1" />
                        {t("profile.field.email")}
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        disabled={!editing}
                        className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition ${
                          editing 
                            ? "border-gray-300 focus:border-red-500" 
                            : "bg-gray-50 border-gray-200 cursor-not-allowed"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Phone className="w-4 h-4 inline mr-1" />
                        {t("profile.field.phone")}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        disabled={!editing}
                        placeholder={t("profile.field.phonePlaceholder")}
                        className={`w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition ${
                          editing 
                            ? "border-gray-300 focus:border-red-500" 
                            : "bg-gray-50 border-gray-200 cursor-not-allowed"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {t("profile.field.memberSince")}
                      </label>
                      <input
                        type="text"
                        value={new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long',
                          day: 'numeric'
                        })}
                        disabled
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {editing && (
                    <div className="mt-6 flex gap-3">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition shadow-md hover:shadow-lg"
                      >
                        <Save className="w-4 h-4" />
                        {t("profile.saveChanges")}
                      </button>
                      <button
                        onClick={() => {
                          setEditing(false);
                          setForm({
                            fullName: user.fullName,
                            email: user.email,
                            phone: user.phone || "",
                          });
                          setImagePreview("");
                          setImageFile(null);
                        }}
                        className="flex items-center gap-2 px-6 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition"
                      >
                        <X className="w-4 h-4" />
                        {t("profile.cancel")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab.key === "bookings" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-900">{t("profile.bookings.title")}</h2>
                  <p className="text-gray-600 mt-1">{t("profile.bookings.subtitle")}</p>
                </div>

                <div className="p-6">
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t("profile.bookings.empty")}</p>
                      <button
                        onClick={() => router.push("/")}
                        className="mt-4 text-red-500 hover:text-red-600 font-medium"
                      >
                        {t("profile.startExploring")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                          onClick={() => router.push(`/bookings/${booking.id}`)}>
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                              <img 
                                src={booking.imageUrl} 
                                alt={booking.propertyTitle}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.png";
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-900">{booking.propertyTitle}</h3>
                                  <p className="text-gray-600 text-sm mt-1">{booking.propertyLocation}</p>
                                </div>
                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getStatusColor(booking.status)}`}>
                                  {getStatusIcon(booking.status)}
                                  <span className="capitalize">{booking.status}</span>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Home className="w-4 h-4" />
                                  ${booking.totalPrice} total
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab.key === "wishlist" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-900">{t("profile.wishlist.title")}</h2>
                  <p className="text-gray-600 mt-1">{t("profile.wishlist.subtitle")}</p>
                </div>

                <div className="p-6">
                  {wishlist.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t("profile.wishlist.empty")}</p>
                      <button
                        onClick={() => router.push("/")}
                        className="mt-4 text-red-500 hover:text-red-600 font-medium"
                      >
                        {t("profile.wishlist.browse")}
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wishlist.map((item) => (
                        <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition cursor-pointer"
                          onClick={() => router.push(`/listings/${item.id}`)}>
                          <div className="h-48 bg-gray-100">
                            <img 
                              src={item.imageUrl} 
                              alt={item.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.png";
                              }}
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{item.location}</p>
                            <div className="flex justify-between items-center mt-3">
                              <p className="text-red-500 font-semibold">${item.price}<span className="text-gray-500 text-sm">{t("profile.wishlist.perMonth")}</span></p>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                {item.rating}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab.key === "hosting" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">{t("profile.hosting.title")}</h2>
                      <p className="text-gray-600 mt-1">{t("profile.hosting.subtitle")}</p>
                    </div>
                    <button
                      onClick={() => router.push("/properties/host")}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition shadow-md"
                    >
                      <Building2 className="w-4 h-4" />
                      {t("profile.hosting.addNew")}
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {hostedProperties.length === 0 ? (
                    <div className="text-center py-12">
                      <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t("profile.hosting.empty")}</p>
                      <button
                        onClick={() => router.push("/properties/host")}
                        className="mt-4 text-red-500 hover:text-red-600 font-medium"
                      >
                        {t("profile.hosting.start")}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {hostedProperties.map((property) => (
                        <div key={property.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                          onClick={() => router.push(`/properties/${property.id}`)}>
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                              <img 
                                src={property.imageUrl} 
                                alt={property.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.png";
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-semibold text-lg text-gray-900">{property.title}</h3>
                                  <p className="text-gray-600 text-sm mt-1">{property.location}</p>
                                </div>
                                <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${getHostingStatusColor(property.status)}`}>
                                  {property.status === 'pending' && <Clock className="w-4 h-4" />}
                                  {property.status === 'approved' && <CheckCircle className="w-4 h-4" />}
                                  {property.status === 'rejected' && <XCircle className="w-4 h-4" />}
                                  <span className="capitalize">{property.status}</span>
                                </div>
                              </div>
                              <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Home className="w-4 h-4" />
                                  ${property.monthlyPrice}{t("profile.hosting.perMonth")}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  Listed {new Date(property.createdAt).toLocaleDateString()}
                                </div>
                                {property.status === 'pending' && (
                                  <div className="flex items-center gap-1 text-yellow-600">
                                    <Clock className="w-4 h-4" />
                                    {t("profile.hosting.awaiting")}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab.key === "settings" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-900">{t("profile.settings.title")}</h2>
                  <p className="text-gray-600 mt-1">{t("profile.settings.subtitle")}</p>
                </div>

                <div className="p-6">
                  <div className="space-y-6">
                    {/* Privacy Section */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-red-500" />
                        {t("profile.settings.privacy")}
                      </h3>
                      <div className="space-y-3 pl-7">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.profilePublic}
                            onChange={(e) => {
                              const newSettings = {
                                ...settings,
                                privacy: {
                                  ...settings.privacy,
                                  profilePublic: e.target.checked
                                }
                              };
                              setSettings(newSettings);
                              handleAutoSaveSettings(newSettings);
                            }}
                            className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                          />
                          <span className="text-gray-700">{t("profile.settings.profilePublic")}</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.privacy.showEmail}
                            onChange={(e) => {
                              const newSettings = {
                                ...settings,
                                privacy: {
                                  ...settings.privacy,
                                  showEmail: e.target.checked
                                }
                              };
                              setSettings(newSettings);
                              handleAutoSaveSettings(newSettings);
                            }}
                            className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                          />
                          <span className="text-gray-700">{t("profile.settings.showEmail")}</span>
                        </label>
                      </div>
                    </div>

                    {/* Language & Region Section */}
                    <div className="pt-6 border-t border-gray-100">
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-red-500" />
                        {t("profile.settings.language")}
                      </h3>
                      <div className="space-y-4 pl-7">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t("profile.settings.languageLabel")}</label>
                          <select
                            value={language}
                            onChange={(e) => {
                              const lang = e.target.value as "en" | "am";
                              if (lang === "en" || lang === "am") {
                                setLanguage(lang);
                                const newSettings = { ...settings, language: lang };
                                setSettings(newSettings);
                                handleAutoSaveSettings(newSettings);
                              }
                            }}
                            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="en">English (US)</option>
                            <option value="am">አማርኛ (Amharic)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">{t("profile.settings.currencyLabel")}</label>
                          <select
                            value={settings.currency || "USD"}
                            onChange={(e) => {
                              const newSettings = {
                                ...settings,
                                currency: e.target.value
                              };
                              setSettings(newSettings);
                              handleAutoSaveSettings(newSettings);
                            }}
                            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="ETB">Ethiopian Birr (ETB)</option>
                            <option value="EUR">Euro (€)</option>
                            <option value="GBP">British Pound (£)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {savingSettings ? t("profile.settings.saving") : t("profile.settings.save")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </main>
  );
}