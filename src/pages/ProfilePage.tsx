import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { userAPI } from '../services/api';
import { getErrorMessage, formatRelativeTime } from '../utils';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

type Tab = 'info' | 'settings';

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

  // Settings state
  const [settings, setSettings] = useState({
    language: i18n.language,
    emailNotifications: { newMessages: true, bookingConfirmations: true, promotionalOffers: false },
    privacy: { profilePublic: true, showEmail: false },
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Sync form fields when user changes
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
      setSettings((prev) => ({ ...prev, ...s }));
    }).catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
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
    if (!fullName.trim()) {
      toast.error(t('auth.fullName') + ' ' + t('common.required'));
      return;
    }
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('fullName', fullName.trim());
      if (phone.trim()) formData.append('phone', phone.trim());
      if (selectedFile) formData.append('avatar', selectedFile);

      const res = await userAPI.updateProfile(formData);
      const updatedUser = res.data.data;
      updateUser(updatedUser);
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
      // Apply language change
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const avatarSrc = previewImage || user.profileImageUrl;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        {/* Cover */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-purple-600" />

        {/* Avatar & basic info */}
        <div className="px-6 pb-6">
          <div className="-mt-12 mb-4 flex items-end justify-between">
            <div className="relative group">
              <Avatar
                src={avatarSrc}
                name={user.fullName}
                size="xl"
                className="ring-4 ring-white"
              />
              {isEditing && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <span className="text-white text-xs font-medium">📷</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {!isEditing && tab === 'info' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                ✏️ {t('profile.editProfile')}
              </Button>
            )}
          </div>

          <h1 className="text-xl font-bold text-gray-900">{user.fullName}</h1>
          <p className="text-sm text-gray-500">@{user.username}</p>

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {user.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-medium">
                ✅ {t('profile.verified')}
              </span>
            )}
            {user.roles?.[0] && (
              <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full font-medium">
                🏷️ {user.roles[0].name}
              </span>
            )}
            <span className="text-xs text-gray-400">
              📅 {t('profile.joinedDate')} {formatRelativeTime(user.createdAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        <TabButton active={tab === 'info'} onClick={() => setTab('info')}>
          👤 {t('profile.personalInfo')}
        </TabButton>
        <TabButton active={tab === 'settings'} onClick={() => setTab('settings')}>
          ⚙️ {t('profile.settings')}
        </TabButton>
      </div>

      {/* Tab Content */}
      {tab === 'info' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="space-y-4">
            <Input
              label={t('profile.fullName')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={!isEditing}
              required
              leftIcon={<span>👤</span>}
            />

            <Input
              label={t('profile.email')}
              value={user.email}
              disabled
              leftIcon={<span>📧</span>}
              hint="Email cannot be changed"
            />

            <Input
              label={t('profile.phone')}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!isEditing}
              placeholder="+251 9..."
              leftIcon={<span>📱</span>}
            />

            <Input
              label={t('profile.username')}
              value={user.username}
              disabled
              leftIcon={<span>🏷️</span>}
            />
          </div>

          {isEditing && (
            <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
              {/* Photo change shortcut */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 {t('profile.changePhoto')}
              </Button>
              <div className="flex-1" />
              <Button variant="secondary" size="md" onClick={handleCancelEdit}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="md"
                isLoading={isLoading}
                onClick={handleSaveProfile}
              >
                💾 {t('profile.updateProfile')}
              </Button>
            </div>
          )}
        </div>
      )}

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
                  {settings.language === lang && (
                    <span className="ml-2 text-xs">✓ {t('language.current')}</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* Email Notifications */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-3">🔔 {t('profile.emailNotifications')}</h3>
            <div className="space-y-3">
              <ToggleRow
                label="New Messages"
                checked={settings.emailNotifications.newMessages}
                onChange={(v) =>
                  setSettings((p) => ({
                    ...p,
                    emailNotifications: { ...p.emailNotifications, newMessages: v },
                  }))
                }
              />
              <ToggleRow
                label="Booking Confirmations"
                checked={settings.emailNotifications.bookingConfirmations}
                onChange={(v) =>
                  setSettings((p) => ({
                    ...p,
                    emailNotifications: { ...p.emailNotifications, bookingConfirmations: v },
                  }))
                }
              />
              <ToggleRow
                label="Promotional Offers"
                checked={settings.emailNotifications.promotionalOffers}
                onChange={(v) =>
                  setSettings((p) => ({
                    ...p,
                    emailNotifications: { ...p.emailNotifications, promotionalOffers: v },
                  }))
                }
              />
            </div>
          </section>

          {/* Privacy */}
          <section>
            <h3 className="font-semibold text-gray-900 mb-3">🔒 {t('profile.privacy')}</h3>
            <div className="space-y-3">
              <ToggleRow
                label={t('profile.profilePublic')}
                checked={settings.privacy.profilePublic}
                onChange={(v) =>
                  setSettings((p) => ({
                    ...p,
                    privacy: { ...p.privacy, profilePublic: v },
                  }))
                }
              />
              <ToggleRow
                label={t('profile.showEmail')}
                checked={settings.privacy.showEmail}
                onChange={(v) =>
                  setSettings((p) => ({
                    ...p,
                    privacy: { ...p.privacy, showEmail: v },
                  }))
                }
              />
            </div>
          </section>

          <div className="pt-4 border-t border-gray-100">
            <Button
              fullWidth
              isLoading={isSavingSettings}
              onClick={handleSaveSettings}
            >
              💾 {t('profile.saveSettings')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 px-4 text-sm font-medium rounded-lg transition-all ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    {children}
  </button>
);

const ToggleRow: React.FC<{
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 cursor-pointer">
    <span className="text-sm text-gray-700">{label}</span>
    <div
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
        checked ? 'bg-blue-600' : 'bg-gray-300'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </div>
  </label>
);

export default ProfilePage;
