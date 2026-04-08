import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, bookingAPI, favoritesAPI, propertyAPI } from '../services/api';
import { getErrorMessage, formatRelativeTime } from '../utils';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import type { Booking, FavoriteProperty, Property } from '../types';

type Tab = 'info' | 'bookings' | 'wishlist' | 'hosting' | 'settings';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  confirmed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
  pending_payment: 'bg-orange-100 text-orange-800',
};

const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshProfile, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form state
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');

  // Data state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [wishlist, setWishlist] = useState<FavoriteProperty[]>([]);
  const [hosted, setHosted] = useState<Property[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({
    language: i18n.language,
    emailNotifications: { newMessages: true, bookingConfirmations: true, promotionalOffers: false },
    privacy: { profilePublic: true, showEmail: false },
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  // Load settings on mount
  useEffect(() => {
    userAPI.getSettings().then((res) => {
      const s = res.data.data;
      if (s) setSettings((prev) => ({ ...prev, ...s }));
    }).catch(() => {});
  }, []);

  // Lazy-load tab data
  const loadTabData = useCallback(async (t: Tab) => {
    if (t === 'info' || t === 'settings') return;
    setLoadingData(true);
    try {
      if (t === 'bookings') {
        const res = await bookingAPI.getMyBookings();
        setBookings(res.data.data || []);
      } else if (t === 'wishlist') {
        const res = await favoritesAPI.list();
        setWishlist(res.data.data || []);
      } else if (t === 'hosting') {
        const res = await propertyAPI.getMyProperties();
        setHosted(res.data.data || []);
      }
    } catch {
      // silent — show empty state
    } finally {
      setLoadingData(false);
    }
  }, []);

  const switchTab = (next: Tab) => {
    setTab(next);
    loadTabData(next);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPreviewImage(null);
    setSelectedFile(null);
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) { toast.error(t('common.required')); return; }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      if (phone.trim()) formData.append('phone', phone.trim());
      if (selectedFile) formData.append('avatar', selectedFile);

      const res = await userAPI.updateProfile(formData);
      updateUser(res.data.data);
      await refreshProfile();
      setIsEditing(false);
      setPreviewImage(null);
      setSelectedFile(null);
      toast.success(t('profile.updateSuccess'));
    } catch (err) {
      toast.error(getErrorMessage(err) || t('profile.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      if (settings.language !== i18n.language) {
        await i18n.changeLanguage(settings.language);
      }
      await userAPI.updateSettings(settings);
      toast.success(t('profile.settingsUpdated'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRemoveFavorite = async (propertyId: string, favoriteId: string) => {
    try {
      await favoritesAPI.remove(propertyId);
      setWishlist((prev) => prev.filter((f) => f.favoriteId !== favoriteId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const avatarSrc = previewImage || user.profileImageUrl;
  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'info', label: t('profile.personalInfo'), icon: '👤' },
    { key: 'bookings', label: 'Bookings', icon: '📅' },
    { key: 'wishlist', label: 'Wishlist', icon: '❤️' },
    { key: 'hosting', label: 'My Listings', icon: '🏠' },
    { key: 'settings', label: t('profile.settings'), icon: '⚙️' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600" />
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="relative group">
              <Avatar src={avatarSrc} name={user.fullName} size="xl" className="ring-4 ring-white" />
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <span className="text-white text-xs font-medium">📷</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            </div>
            {tab === 'info' && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                ✏️ {t('profile.editProfile')}
              </Button>
            )}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
          <p className="text-sm text-gray-500">@{user.username}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {user.isVerified && (
              <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-medium">✅ {t('profile.verified')}</span>
            )}
            {user.roles?.[0] && (
              <span className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full font-medium">🏷️ {user.roles[0].name}</span>
            )}
            <span className="text-xs text-gray-400">📅 {t('profile.joinedDate')} {formatRelativeTime(user.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Tab bar — scrollable on mobile */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 overflow-x-auto scrollbar-hide">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* ── Personal Info ───────────────────────────────────────────────────── */}
      {tab === 'info' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-4">
            <Input label={t('profile.fullName')} value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={!isEditing} required leftIcon={<span>👤</span>} />
            <Input label={t('profile.email')} value={user.email} disabled leftIcon={<span>📧</span>} hint="Email cannot be changed" />
            <Input label={t('profile.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!isEditing} placeholder="+251 9…" leftIcon={<span>📱</span>} />
            <Input label={t('profile.username')} value={user.username} disabled leftIcon={<span>🏷️</span>} />
          </div>
          {isEditing && (
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>📷 {t('profile.changePhoto')}</Button>
              <div className="flex-1" />
              <Button variant="secondary" onClick={handleCancelEdit}>{t('common.cancel')}</Button>
              <Button isLoading={isLoading} onClick={handleSaveProfile}>💾 {t('profile.updateProfile')}</Button>
            </div>
          )}
        </div>
      )}

      {/* ── Bookings ─────────────────────────────────────────────────────────── */}
      {tab === 'bookings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">My Bookings</h2>
          {loadingData ? <Spinner /> : bookings.length === 0 ? (
            <EmptyState icon="📅" title="No bookings yet" desc="Properties you book will appear here." />
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-100 transition-colors">
                  {b.property?.media?.[0]?.mediaUrl && (
                    <img src={b.property.media[0].mediaUrl} alt={b.property.title} className="w-20 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{b.property?.title || 'Property'}</p>
                    <p className="text-xs text-gray-500">{b.property?.location}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(b.startDate).toLocaleDateString()} → {new Date(b.endDate).toLocaleDateString()}
                    </p>
                    {b.totalPrice && (
                      <p className="text-sm font-semibold text-blue-600 mt-1">{b.totalPrice.toLocaleString()} ETB</p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full h-fit ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-600'}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Wishlist ──────────────────────────────────────────────────────────── */}
      {tab === 'wishlist' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Wishlist</h2>
          {loadingData ? <Spinner /> : wishlist.length === 0 ? (
            <EmptyState icon="❤️" title="No saved properties" desc="Properties you heart will appear here." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {wishlist.map((f) => (
                <div key={f.favoriteId} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <img src={f.imageUrl} alt={f.title} className="w-full h-36 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }} />
                  <div className="p-3">
                    <p className="font-medium text-gray-900 truncate">{f.title}</p>
                    <p className="text-xs text-gray-500">{f.location}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-bold text-blue-600">{f.price.toLocaleString()} ETB/mo</p>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-400 text-sm">★</span>
                        <span className="text-xs text-gray-600">{f.rating}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFavorite(f.id, f.favoriteId)}
                      className="mt-2 w-full text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove from wishlist
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── My Listings ───────────────────────────────────────────────────────── */}
      {tab === 'hosting' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">My Listings</h2>
          </div>
          {loadingData ? <Spinner /> : hosted.length === 0 ? (
            <EmptyState icon="🏠" title="No listings yet" desc="Properties you list will appear here." />
          ) : (
            <div className="space-y-3">
              {hosted.map((p) => (
                <div key={p.id} className="flex gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-100 transition-colors">
                  {p.media?.[0]?.mediaUrl && (
                    <img src={p.media[0].mediaUrl} alt={p.title} className="w-20 h-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.title}</p>
                    <p className="text-xs text-gray-500">{p.location}</p>
                    <p className="text-sm font-bold text-blue-600 mt-1">{p.monthlyPrice.toLocaleString()} ETB/mo</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full h-fit ${STATUS_COLORS[p.approvalStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {p.approvalStatus}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Settings ──────────────────────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          {/* Language */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-3">🌐 {t('profile.language')}</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['en', 'am'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setSettings((p) => ({ ...p, language: lang }))}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    settings.language === lang
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {lang === 'en' ? '🇺🇸 English' : '🇪🇹 አማርኛ'}
                  {settings.language === lang && <span className="ml-2 text-xs">✓</span>}
                </button>
              ))}
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-3">🔔 {t('profile.emailNotifications')}</h3>
            <div className="space-y-3">
              <ToggleRow label="New Messages" checked={settings.emailNotifications.newMessages} onChange={(v) => setSettings((p) => ({ ...p, emailNotifications: { ...p.emailNotifications, newMessages: v } }))} />
              <ToggleRow label="Booking Confirmations" checked={settings.emailNotifications.bookingConfirmations} onChange={(v) => setSettings((p) => ({ ...p, emailNotifications: { ...p.emailNotifications, bookingConfirmations: v } }))} />
              <ToggleRow label="Promotional Offers" checked={settings.emailNotifications.promotionalOffers} onChange={(v) => setSettings((p) => ({ ...p, emailNotifications: { ...p.emailNotifications, promotionalOffers: v } }))} />
            </div>
          </section>

          {/* Privacy */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-3">🔒 {t('profile.privacy')}</h3>
            <div className="space-y-3">
              <ToggleRow label={t('profile.profilePublic')} checked={settings.privacy.profilePublic} onChange={(v) => setSettings((p) => ({ ...p, privacy: { ...p.privacy, profilePublic: v } }))} />
              <ToggleRow label={t('profile.showEmail')} checked={settings.privacy.showEmail} onChange={(v) => setSettings((p) => ({ ...p, privacy: { ...p.privacy, showEmail: v } }))} />
            </div>
          </section>

          <div className="pt-4 border-t border-gray-100">
            <Button fullWidth isLoading={isSavingSettings} onClick={handleSaveSettings}>💾 {t('profile.saveSettings')}</Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
  </div>
);

const EmptyState: React.FC<{ icon: string; title: string; desc: string }> = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center justify-center py-14 text-center">
    <span className="text-5xl mb-3">{icon}</span>
    <p className="font-semibold text-gray-700">{title}</p>
    <p className="text-sm text-gray-400 mt-1">{desc}</p>
  </div>
);

const ToggleRow: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
    <span className="text-sm text-gray-700">{label}</span>
    <div onClick={() => onChange(!checked)} className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
    </div>
  </label>
);

export default ProfilePage;
