"use client";

import { useEffect, useState, useRef } from "react";
import { getAllUsers, updateUserRole, deleteUserById, banUser, unbanUser } from "@/utils/adminApi";
import Toast from "@/components/ui/Toast";

export default function UsersTable() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ msg: string; type?: "success" | "error" } | null>(null);
  const pendingRef = useRef<Record<string, boolean>>({});

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers(page);
      setUsers(res.data || []);
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to load users", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const t = setInterval(fetchUsers, 15000);
    return () => clearInterval(t);
  }, [page]);

  const isBanned = (user: any): boolean =>
    !!(user.settings as any)?.isBanned;

  const handlePromote = async (userId: string) => {
    if (pendingRef.current[userId]) return;
    pendingRef.current[userId] = true;
    try {
      await updateUserRole(userId, "ADMIN");
      setToast({ msg: "User promoted to Admin.", type: "success" });
      fetchUsers();
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to update role", type: "error" });
    } finally {
      pendingRef.current[userId] = false;
    }
  };

  const handleBan = async (userId: string, name: string) => {
    const reason = prompt(`Reason for banning ${name}:`);
    if (!reason) return; // cancelled
    if (pendingRef.current[userId]) return;
    pendingRef.current[userId] = true;
    try {
      await banUser(userId, reason);
      setToast({ msg: `${name} has been banned. A notification was sent.`, type: "success" });
      fetchUsers();
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to ban user", type: "error" });
    } finally {
      pendingRef.current[userId] = false;
    }
  };

  const handleUnban = async (userId: string, name: string) => {
    if (!confirm(`Lift the ban on ${name}?`)) return;
    if (pendingRef.current[userId]) return;
    pendingRef.current[userId] = true;
    try {
      await unbanUser(userId);
      setToast({ msg: `${name} has been unbanned.`, type: "success" });
      fetchUsers();
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to unban user", type: "error" });
    } finally {
      pendingRef.current[userId] = false;
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    if (pendingRef.current[userId]) return;
    pendingRef.current[userId] = true;
    try {
      await deleteUserById(userId);
      setToast({ msg: "User deleted.", type: "success" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      setToast({ msg: err?.message || "Failed to delete user", type: "error" });
    } finally {
      pendingRef.current[userId] = false;
    }
  };

  return (
    <div>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {loading ? (
        <p className="text-gray-500 py-6 text-center">Loading users...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded shadow-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Email</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Role</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const banned = isBanned(u);
                const banReason = (u.settings as any)?.banReason;
                return (
                  <tr key={u.id} className={`border-t hover:bg-gray-50 ${banned ? "bg-red-50" : ""}`}>
                    <td className="p-3 text-sm font-medium">{u.fullName}</td>
                    <td className="p-3 text-sm text-gray-600">{u.email}</td>
                    <td className="p-3 text-sm">{u.roles?.map((r: any) => r.role?.name).join(", ")}</td>
                    <td className="p-3 text-sm">
                      {banned ? (
                        <span title={banReason || ""} className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 cursor-help">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-sm flex flex-wrap gap-1">
                      <button
                        disabled={!!pendingRef.current[u.id]}
                        onClick={() => handlePromote(u.id)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                      >
                        Promote
                      </button>
                      {banned ? (
                        <button
                          disabled={!!pendingRef.current[u.id]}
                          onClick={() => handleUnban(u.id, u.fullName)}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Unban
                        </button>
                      ) : (
                        <button
                          disabled={!!pendingRef.current[u.id]}
                          onClick={() => handleBan(u.id, u.fullName)}
                          className="px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                        >
                          Ban
                        </button>
                      )}
                      <button
                        disabled={!!pendingRef.current[u.id]}
                        onClick={() => handleDelete(u.id)}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
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
