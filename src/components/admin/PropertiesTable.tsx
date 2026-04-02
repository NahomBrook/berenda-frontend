"use client";

import { useEffect, useState, useRef } from "react";
import { getAllProperties, approveProperty, rejectProperty } from "@/utils/adminApi";
import Toast from "@/components/ui/Toast";

export default function PropertiesTable() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type?: any } | null>(null);
  const pendingRef = useRef<Record<string, boolean>>({});

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await getAllProperties(page);
      setProperties(res.data || []);
    } catch (err: any) {
      console.error(err);
      setToast({ msg: err?.message || "Failed to load properties", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    const t = setInterval(fetchProperties, 10000);
    return () => clearInterval(t);
  }, [page]);

  const handleApprove = async (id: string) => {
    if (pendingRef.current[id]) return;
    pendingRef.current[id] = true;
    try {
      await approveProperty(id);
      setToast({ msg: "Property approved", type: "success" });
      fetchProperties();
    } catch (err: any) {
      console.error(err);
      setToast({ msg: err?.message || "Failed to approve", type: "error" });
    } finally {
      pendingRef.current[id] = false;
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection (optional):");
    if (pendingRef.current[id]) return;
    pendingRef.current[id] = true;
    try {
      await rejectProperty(id, reason || undefined);
      setToast({ msg: "Property rejected", type: "success" });
      fetchProperties();
    } catch (err: any) {
      console.error(err);
      setToast({ msg: err?.message || "Failed to reject", type: "error" });
    } finally {
      pendingRef.current[id] = false;
    }
  };

  if (loading) return <p className="text-gray-500">Loading properties...</p>;

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Title</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Owner</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Price</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm">{p.title}</td>
                <td className="p-3 text-sm">{p.owner?.fullName || p.owner?.email}</td>
                <td className="p-3 text-sm text-gray-700">${p.monthlyPrice}</td>
                <td className="p-3 text-sm">{p.approvalStatus}</td>
                <td className="p-3 text-sm">
                  <button disabled={pendingRef.current[p.id]} className="mr-2 px-2 py-1 bg-green-600 text-white rounded" onClick={() => handleApprove(p.id)}>Approve</button>
                  <button disabled={pendingRef.current[p.id]} className="px-2 py-1 bg-red-600 text-white rounded" onClick={() => handleReject(p.id)}>Reject</button>
                </td>
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
