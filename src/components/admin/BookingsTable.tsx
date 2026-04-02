"use client";

import { useEffect, useState } from "react";
import { getAllBookings } from "@/utils/adminApi";
import Toast from "@/components/ui/Toast";

export default function BookingsTable() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type?: any } | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await getAllBookings(page);
      setBookings(res.data || []);
    } catch (err: any) {
      console.error(err);
      setToast({ msg: err?.message || "Failed to load bookings", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    const t = setInterval(fetchBookings, 10000);
    return () => clearInterval(t);
  }, [page]);

  if (loading) return <p className="text-gray-500">Loading bookings...</p>;

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Property</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Renter</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Dates</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm">{b.property?.title}</td>
                <td className="p-3 text-sm">{b.renter?.fullName || b.renter?.email}</td>
                <td className="p-3 text-sm">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</td>
                <td className="p-3 text-sm">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex gap-2">
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-200 rounded">Prev</button>
        <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-gray-200 rounded">Next</button>
      </div>
    </div>
  );
}
