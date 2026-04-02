"use client";

import { useEffect, useState, useRef } from "react";
import { getAllUsers, updateUserRole, deleteUserById } from "@/utils/adminApi";
import Toast from "@/components/ui/Toast";

export default function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type?: any } | null>(null);
  const pendingRef = useRef<Record<string, boolean>>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers(page);
      setUsers(res.data || []);
    } catch (err: any) {
      console.error(err);
      setToast({ msg: err?.message || "Failed to load users", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const t = setInterval(fetchUsers, 10000); // poll every 10s
    return () => clearInterval(t);
  }, [page]);

  const handlePromote = async (userId: string) => {
    if (pendingRef.current[userId]) return;
    pendingRef.current[userId] = true;
    try {
      await updateUserRole(userId, "ADMIN");
      setToast({ msg: "User promoted to ADMIN", type: "success" });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setToast({ msg: err?.message || "Failed to update role", type: "error" });
    } finally {
      pendingRef.current[userId] = false;
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user? This action is permanent.")) return;
    if (pendingRef.current[userId]) return;
    pendingRef.current[userId] = true;
    try {
      await deleteUserById(userId);
      setToast({ msg: "User deleted", type: "success" });
      fetchUsers();
    } catch (err: any) {
      console.error(err);
      setToast({ msg: err?.message || "Failed to delete user", type: "error" });
    } finally {
      pendingRef.current[userId] = false;
    }
  };

  if (loading) return <p className="text-gray-500">Loading users...</p>;

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Email</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Role</th>
              <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-3 text-sm">{u.fullName}</td>
                <td className="p-3 text-sm text-gray-700">{u.email}</td>
                <td className="p-3 text-sm">{u.roles?.map((r: any) => r.role?.name).join(", ")}</td>
                <td className="p-3 text-sm">
                  <button
                    disabled={pendingRef.current[u.id]}
                    className="mr-3 px-2 py-1 text-sm bg-blue-600 text-white rounded"
                    onClick={() => handlePromote(u.id)}
                  >
                    Promote
                  </button>
                  <button
                    disabled={pendingRef.current[u.id]}
                    className="px-2 py-1 text-sm bg-red-600 text-white rounded"
                    onClick={() => handleDelete(u.id)}
                  >
                    Delete
                  </button>
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
