// frontend/src/components/admin/Sidebar.tsx
"use client";

import { LayoutDashboard, Users, Home, Calendar, History, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/auth/login");
  };

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "properties", label: "Properties", icon: Home },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "actions", label: "Activity Log", icon: History },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold">Admin Panel</h2>
        <p className="text-gray-400 text-sm mt-1">Berenda Platform</p>
      </div>
      
      <nav className="flex-1 mt-6">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-3 text-left transition ${
              activeTab === item.id
                ? "bg-red-600 text-white"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-6 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 text-gray-300 hover:text-white transition w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}