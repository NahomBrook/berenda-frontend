"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import Avatar from '../ui/Avatar';

interface UserData {
  fullName?: string;
  email?: string;
  profileImageUrl?: string;
  roles?: { name: string }[];
}

const Navbar: React.FC = () => {
  const { language, toggleLanguage, t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('berenda_token');
    const stored = localStorage.getItem('berenda_user');
    if (token && stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        setUser(null);
      }
    }
  }, [pathname]); // re-check on route change

  const isAuthenticated = !!user;
  const isAdmin = user?.roles?.some(
    (r) => r.name === 'ADMIN' || r.name === 'SUPER_ADMIN' || r.name === 'admin' || r.name === 'super_admin'
  );

  const handleLogout = () => {
    localStorage.removeItem('berenda_token');
    localStorage.removeItem('berenda_user');
    setUser(null);
    setMenuOpen(false);
    router.push('/auth/login');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-red-500">
          <span className="text-2xl">🏠</span>
          <span>Berenda</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {isAuthenticated && (
            <>
              <NavLink href="/chat" active={isActive('/chat')}>
                {t('nav.messages') || 'Messages'}
              </NavLink>
              <NavLink href="/profile" active={isActive('/profile')}>
                {t('nav.profile') || 'Profile'}
              </NavLink>
              {isAdmin && (
                <NavLink href="/admin" active={isActive('/admin')}>
                  🛡️ {t('nav.admin') || 'Admin'}
                </NavLink>
              )}
            </>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {language === 'en' ? '🇪🇹 አማ' : '🇺🇸 EN'}
          </button>

          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <Avatar src={user?.profileImageUrl} name={user?.fullName} size="sm" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      👤 {t('nav.profile') || 'Profile'}
                    </Link>
                    <Link
                      href="/chat"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setMenuOpen(false)}
                    >
                      💬 {t('nav.messages') || 'Messages'}
                    </Link>
                    {isAdmin && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-purple-700 hover:bg-purple-50"
                        onClick={() => setMenuOpen(false)}
                      >
                        🛡️ {t('nav.admin') || 'Admin'}
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      🚪 {t('nav.logout') || 'Logout'}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-500 transition-colors"
              >
                {t('nav.login') || 'Login'}
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                {t('nav.register') || 'Register'}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const NavLink: React.FC<{ href: string; active?: boolean; children: React.ReactNode }> = ({
  href,
  active,
  children,
}) => (
  <Link
    href={href}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      active
        ? 'bg-red-50 text-red-500'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`}
  >
    {children}
  </Link>
);

export default Navbar;
