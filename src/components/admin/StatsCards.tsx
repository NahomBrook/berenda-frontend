// frontend/src/components/admin/StatsCards.tsx
"use client";

import { Users, Home, Calendar, DollarSign, Clock } from "lucide-react";

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    totalProperties: number;
    totalBookings: number;
    pendingProperties: number;
    totalRevenue: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  // Add safety check
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    { title: "Total Users", value: stats.totalUsers || 0, icon: Users, color: "bg-blue-500" },
    { title: "Total Properties", value: stats.totalProperties || 0, icon: Home, color: "bg-green-500" },
    { title: "Total Bookings", value: stats.totalBookings || 0, icon: Calendar, color: "bg-purple-500" },
    { title: "Pending Properties", value: stats.pendingProperties || 0, icon: Clock, color: "bg-yellow-500" },
    { title: "Total Revenue", value: `$${(stats.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "bg-red-500" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <p className="text-2xl font-bold mt-1">{card.value}</p>
            </div>
            <div className={`${card.color} p-3 rounded-full`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}