"use client";

import { useEffect, useState } from "react";
import { getAdminActions } from "@/utils/adminApi";
import Toast from "@/components/ui/Toast";

export default function ActionsTable() {
  const [actions, setActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type?: any } | null>(null);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await getAdminActions(page);
      setActions(res.data || []);
    } catch (err: any) {
      console.error(err);
      setToast({ msg: err?.message || "Failed to load actions", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
    const t = setInterval(fetchActions, 10000);
    return () => clearInterval(t);
  }, [page]);

  if (loading) return <p className="text-gray-500">Loading activity log...</p>;

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Admin</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Action</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Target</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">When</th>
            </tr>
          </thead>
          <tbody>
            {actions.map((a) => (
              <tr key={a.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm">{a.admin?.fullName || a.admin?.email || 'System'}</td>
                <td className="p-3 text-sm">{a.actionType}</td>
                <td className="p-3 text-sm">{a.targetEntity} {a.targetId ? `(${a.targetId})` : ''}</td>
                <td className="p-3 text-sm">{new Date(a.createdAt).toLocaleString()}</td>
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
