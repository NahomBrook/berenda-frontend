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
  XCircle
} from "lucide-react";
import { getProfile, updateProfile, uploadProfileImage } from "../../utils/profileApi";
import Navbar from "@/components/layout/NavBar";
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
  status: 'confirmed' | 'pending' | 'cancelled';
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

export default function ProfileDashboard() {
  const router = useRouter();
  const { t } = useLanguage();
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

  const tabs: Tab[] = [
    { name: "Profile", key: "profile", icon: <User className="w-5 h-5" /> },
    { name: "Bookings", key: "bookings", icon: <Calendar className="w-5 h-5" /> },
    { name: "Wishlist", key: "wishlist", icon: <Heart className="w-5 h-5" /> },
    { name: "Settings", key: "settings", icon: <Settings className="w-5 h-5" /> },
  ];

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
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
          
          // Mock bookings data - replace with actual API call
          setBookings([
            {
              id: "1",
              propertyTitle: "Luxury Beachfront Villa",
              propertyLocation: "Malibu, California",
              checkIn: "2024-03-15",
              checkOut: "2024-03-20",
              totalPrice: 2450,
              status: "confirmed",
              imageUrl: "/placeholder.png"
            },
            {
              id: "2",
              propertyTitle: "Downtown Loft",
              propertyLocation: "New York, NY",
              checkIn: "2024-04-01",
              checkOut: "2024-04-05",
              totalPrice: 1200,
              status: "pending",
              imageUrl: "/placeholder.png"
            }
          ]);
          
          // Mock wishlist data
          setWishlist([
            {
              id: "1",
              title: "Mountain Retreat",
              location: "Aspen, Colorado",
              price: 350,
              imageUrl: "/placeholder.png",
              rating: 4.8
            },
            {
              id: "2",
              title: "Modern City Apartment",
              location: "Chicago, Illinois",
              price: 180,
              imageUrl: "/placeholder.png",
              rating: 4.6
            }
          ]);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [token]);

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
      await updateProfile(form, token);
      if (imageFile) await uploadProfileImage(imageFile, token);

      setMessage("Profile updated successfully!");
      setMessageType("success");
      setEditing(false);

      const refreshed = await getProfile(token);
      if (refreshed.success) setUser(refreshed.data);
      
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.message || "Failed to update profile");
      setMessageType("error");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'cancelled': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return null;
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
                  <div className="w-28 h-28 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-red-100 shadow-lg">
                    <img
                      src={imagePreview || user.profileImageUrl || "/default-avatar.png"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
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
                  <span>Logout</span>
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
                        <h2 className="text-2xl font-semibold text-gray-900">{t("profile.tab.profile")}</h2>
                        <p className="text-gray-600 mt-1">{t("profile.subtitle")}</p>
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
                        Full Name
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
                        Email Address
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
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        disabled={!editing}
                        placeholder="Add your phone number"
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
                        Member Since
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
                        Save Changes
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
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab.key === "bookings" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                      <h2 className="text-2xl font-semibold text-gray-900">{t("bookings.title")}</h2>
                      <p className="text-gray-600 mt-1">{t("bookings.title")}</p>
                </div>

                <div className="p-6">
                  {bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t("bookings.noBookings")}</p>
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
                        <div key={booking.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="w-full md:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                              <img 
                                src={booking.imageUrl} 
                                alt={booking.propertyTitle}
                                className="w-full h-full object-cover"
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
                  <h2 className="text-2xl font-semibold text-gray-900">{t("profile.tab.wishlist")}</h2>
                  <p className="text-gray-600 mt-1">{t("profile.tab.wishlist")}</p>
                </div>

                <div className="p-6">
                  {wishlist.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">{t("bookings.noBookings")}</p>
                      <button 
                        onClick={() => router.push("/")}
                        className="mt-4 text-red-500 hover:text-red-600 font-medium"
                      >
                        Browse properties →
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {wishlist.map((item) => (
                        <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition cursor-pointer"
                          onClick={() => router.push(`/listings/${item.id}`)}>
                          <div className="h-48 bg-gray-100">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-gray-600 text-sm mt-1">{item.location}</p>
                            <div className="flex justify-between items-center mt-3">
                              <p className="text-red-500 font-semibold">${item.price}/night</p>
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

            {activeTab.key === "settings" && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-2xl font-semibold text-gray-900">{t("profile.tab.settings")}</h2>
                  <p className="text-gray-600 mt-1">{t("profile.tab.settings")}</p>
                </div>

                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">{t("profile.tab.settings")}</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 text-red-500 rounded" />
                          <span className="text-gray-700">Email me about new messages</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 text-red-500 rounded" />
                          <span className="text-gray-700">Email me about booking confirmations</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 text-red-500 rounded" />
                          <span className="text-gray-700">Receive promotional offers</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <h3 className="font-medium text-gray-900 mb-3">Privacy</h3>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 text-red-500 rounded" />
                          <span className="text-gray-700">Make my profile public</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 text-red-500 rounded" />
                          <span className="text-gray-700">Show my email on profile</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100">
                      <h3 className="font-medium text-gray-900 mb-3">Language & Region</h3>
                      <select className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option>English (US)</option>
                        <option>Amharic (Ethiopia)</option>
                      </select>
                    </div>

                    <div className="pt-6">
                      <button className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition">
                        {t("profile.saveChanges")}
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