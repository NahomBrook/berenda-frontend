import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { getErrorMessage } from '../utils';
import Avatar from '../components/ui/Avatar';
import type { AdminDashboard, User, Property } from '../types';

type Section = 'dashboard' | 'users' | 'properties' | 'bookings';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
};

const AdminPage: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const [section, setSection] = useState<Section>('dashboard');

  if (isLoading) return <Spinner />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <p className="font-bold text-gray-900">🛡️ Admin Panel</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {([
            { key: 'dashboard', icon: '📊', label: 'Dashboard' },
            { key: 'users', icon: '👥', label: 'Users' },
            { key: 'properties', icon: '🏠', label: 'Properties' },
            { key: 'bookings', icon: '📅', label: 'Bookings' },
          ] as { key: Section; icon: string; label: string }[]).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setSection(key)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl text-left transition-colors ${
                section === key ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {icon} {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {section === 'dashboard' && <DashboardSection />}
        {section === 'users' && <UsersSection />}
        {section === 'properties' && <PropertiesSection />}
        {section === 'bookings' && <BookingsSection />}
      </main>
    </div>
  );
};

// ── Dashboard ──────────────────────────────────────────────────────────────────

const DashboardSection: React.FC = () => {
  const [data, setData] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then((r) => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return null;

  const stats = [
    { label: 'Total Users', value: data.totalUsers, icon: '👥', color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Properties', value: data.totalProperties, icon: '🏠', color: 'bg-purple-50 text-purple-700' },
    { label: 'Total Bookings', value: data.totalBookings, icon: '📅', color: 'bg-green-50 text-green-700' },
    { label: 'Pending Review', value: data.pendingProperties, icon: '⏳', color: 'bg-yellow-50 text-yellow-700' },
    { label: 'Total Revenue', value: `${(data.totalRevenue || 0).toLocaleString()} ETB`, icon: '💰', color: 'bg-emerald-50 text-emerald-700' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className={`${s.color} rounded-2xl p-4`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold mb-3">Recent Users</h2>
          <div className="space-y-3">
            {data.recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar name={u.fullName} size="sm" />
                <div>
                  <p className="text-sm font-medium">{u.fullName}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold mb-3">Recent Bookings</h2>
          <div className="space-y-3">
            {data.recentBookings.map((b: any) => (
              <div key={b.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{b.property?.title || 'Property'}</p>
                  <p className="text-xs text-gray-500">{b.renter?.fullName}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Users ──────────────────────────────────────────────────────────────────────

const UsersSection: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getUsers({ page, limit: 20, search: search || undefined });
      setUsers(r.data.data);
      setTotal(r.data.pagination.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const updateRole = async (userId: string, roleName: string) => {
    try {
      await adminAPI.updateUserRole(userId, roleName);
      toast.success('Role updated');
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const deleteUser = async (userId: string, name: string) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteUser(userId);
      toast.success('User deleted');
      load();
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">User Management</h1>
      <div className="mb-4 flex gap-3">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search users…"
          className="flex-1 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['User', 'Email', 'Role', 'Verified', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.fullName} size="xs" />
                      <span className="font-medium">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.roles?.[0]?.name || 'USER'}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">{u.isVerified ? '✅' : '❌'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => deleteUser(u.id, u.fullName)} className="text-xs text-red-500 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            {total} total users
          </div>
        </div>
      )}
    </div>
  );
};

// ── Properties ────────────────────────────────────────────────────────────────

const PropertiesSection: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getProperties({ page: 1, limit: 50, status: statusFilter });
      setProperties(r.data.data);
    } catch { toast.error('Failed to load properties'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const approve = async (id: string) => {
    try { await adminAPI.approveProperty(id); toast.success('Property approved'); load(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const reject = async (id: string) => {
    const reason = window.prompt('Rejection reason (optional):');
    try { await adminAPI.rejectProperty(id, reason || undefined); toast.success('Property rejected'); load(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const del = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try { await adminAPI.deleteProperty(id); toast.success('Property deleted'); load(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Property Management</h1>
      <div className="mb-4 flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : properties.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No properties found</div>
      ) : (
        <div className="space-y-3">
          {properties.map((p) => (
            <div key={p.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex gap-4">
              {p.media?.[0]?.mediaUrl && (
                <img src={p.media[0].mediaUrl} alt={p.title} className="w-20 h-16 rounded-xl object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.location} · {p.monthlyPrice?.toLocaleString()} ETB/mo</p>
                    <p className="text-xs text-gray-400 mt-0.5">Owner: {(p as any).owner?.fullName || 'Unknown'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_BADGE[p.approvalStatus] || ''}`}>{p.approvalStatus}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  {p.approvalStatus !== 'approved' && (
                    <button onClick={() => approve(p.id)} className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">Approve</button>
                  )}
                  {p.approvalStatus !== 'rejected' && (
                    <button onClick={() => reject(p.id)} className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-lg hover:bg-yellow-600">Reject</button>
                  )}
                  <button onClick={() => del(p.id, p.title)} className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Bookings ──────────────────────────────────────────────────────────────────

const BookingsSection: React.FC = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await adminAPI.getBookings({ page: 1, limit: 50 });
      setBookings(r.data.data);
    } catch { toast.error('Failed to load bookings'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try { await adminAPI.updateBookingStatus(id, status); toast.success('Status updated'); load(); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Booking Management</h1>
      {loading ? <Spinner /> : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Property', 'Renter', 'Dates', 'Price', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{b.property?.title}</td>
                  <td className="px-4 py-3 text-gray-500">{b.renter?.fullName}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{b.totalPrice?.toLocaleString()} ETB</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[b.status] || 'bg-gray-100 text-gray-600'}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={b.status}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                    >
                      {['pending', 'approved', 'rejected', 'cancelled', 'completed', 'confirmed'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Spinner = () => (
  <div className="flex items-center justify-center py-16">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
);

export default AdminPage;
