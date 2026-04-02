// frontend/src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDashboardStats } from "@/utils/adminApi";

// Components
import StatsCards from "@/components/admin/StatsCards";
import UsersTable from "@/components/admin/UsersTable";
import PropertiesTable from "@/components/admin/PropertiesTable";
import BookingsTable from "@/components/admin/BookingsTable";
import ActionsTable from "@/components/admin/ActionsTable";
import Sidebar from "@/components/admin/Sidebar";

type TabType = "dashboard" | "users" | "properties" | "bookings" | "actions";

export default function AdminPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);

  // Check authentication and admin role
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    
    if (!token) {
      router.push("/auth/login");
      return;
    }
    
    try {
      const user = JSON.parse(userStr || "{}");
      // Prefer role-based check; fallback to email for older accounts
      const role = typeof user.role === "string" ? user.role.toUpperCase() : (user.roles ? "ADMIN" : "");
      if (role === "ADMIN" || role === "SUPERADMIN" || user.email === "admin@berenda.com") {
        setIsAdmin(true);
        fetchData();
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error parsing user:", error);
      router.push("/auth/login");
    }
  }, [activeTab, pagination.page, search, filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "dashboard") {
        const res = await getDashboardStats();
        setStats(res.data);
      }
      // Add other fetch calls for users, properties, bookings here
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (loading && activeTab === "dashboard") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {activeTab === "dashboard" && stats && <StatsCards stats={stats} />}
          
          {activeTab === "users" && (
            <div className="bg-white rounded-lg shadow p-6">
              <UsersTable />
            </div>
          )}

          {activeTab === "properties" && (
            <div className="bg-white rounded-lg shadow p-6">
              <PropertiesTable />
            </div>
          )}

          {activeTab === "bookings" && (
            <div className="bg-white rounded-lg shadow p-6">
              <BookingsTable />
            </div>
          )}

          {activeTab === "actions" && (
            <div className="bg-white rounded-lg shadow p-6">
              <ActionsTable />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}