"use client";

import { useEffect, useState, useRef } from "react";
import { getAllProperties, approveProperty, rejectProperty, deleteProperty } from "@/utils/adminApi";
import Toast from "@/components/ui/Toast";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

export default function PropertiesTable() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);
  const pendingRef = useRef<Record<string, boolean>>({});

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const res = await getAllProperties(page, statusFilter);
      setProperties(res.data || []);
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to load properties", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
    const t = setInterval(fetchProperties, 15000);
    return () => clearInterval(t);
  }, [page, statusFilter]);

  // Remove a property from local state immediately after an action
  const removeLocally = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const handleApprove = async (id: string) => {
    if (pendingRef.current[id]) return;
    pendingRef.current[id] = true;
    removeLocally(id);
    try {
      await approveProperty(id);
      setToast({ msg: "Property approved — host has been notified.", type: "success" });
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to approve", type: "error" });
      fetchProperties();
    } finally {
      pendingRef.current[id] = false;
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection (optional):");
    if (pendingRef.current[id]) return;
    pendingRef.current[id] = true;
    removeLocally(id);
    try {
      await rejectProperty(id, reason || undefined);
      setToast({ msg: "Property rejected — host has been notified.", type: "success" });
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to reject", type: "error" });
      fetchProperties();
    } finally {
      pendingRef.current[id] = false;
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? The host will be notified.`)) return;
    if (pendingRef.current[id]) return;
    pendingRef.current[id] = true;
    try {
      await deleteProperty(id);
      setToast({ msg: "Property deleted — host has been notified.", type: "success" });
      removeLocally(id);
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to delete", type: "error" });
    } finally {
      pendingRef.current[id] = false;
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {(["pending", "all", "approved", "rejected"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-gray-800 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 py-6 text-center">Loading properties...</p>
      ) : properties.length === 0 ? (
        <p className="text-gray-400 py-6 text-center">No {statusFilter !== "all" ? statusFilter : ""} properties found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Title</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Owner</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Price (ETB)</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium">{p.title}</td>
                  <td className="p-3 text-sm text-gray-600">{p.owner?.fullName || p.owner?.email}</td>
                  <td className="p-3 text-sm text-gray-700">{p.monthlyPrice?.toLocaleString()}</td>
                  <td className="p-3 text-sm">{statusBadge(p.approvalStatus)}</td>
                  <td className="p-3 text-sm flex flex-wrap gap-1">
                    {p.approvalStatus === "pending" && (
                      <>
                        <button
                          disabled={!!pendingRef.current[p.id]}
                          onClick={() => handleApprove(p.id)}
                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={!!pendingRef.current[p.id]}
                          onClick={() => handleReject(p.id)}
                          className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      disabled={!!pendingRef.current[p.id]}
                      onClick={() => handleDelete(p.id, p.title)}
                      className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Prev</button>
        <span className="px-3 py-1 text-sm text-gray-600">Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)} className="px-3 py-1 bg-gray-200 rounded">Next</button>
      </div>
    </div>
  );
}
