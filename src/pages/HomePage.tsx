import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const HomePage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">
            🏠 {t('common.appName')}
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Find and list properties in Addis Ababa. Connect with landlords and tenants directly.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {isAuthenticated ? (
              <>
                <Link
                  to="/messages"
                  className="px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow"
                >
                  💬 {t('nav.messages')}
                </Link>
                <Link
                  to="/profile"
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400 transition-colors border border-blue-400"
                >
                  👤 {t('nav.profile')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow"
                >
                  {t('auth.registerButton')}
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-400 transition-colors border border-blue-400"
                >
                  {t('auth.loginButton')}
                </Link>
              </>
            )}
          </div>
          {isAuthenticated && (
            <p className="mt-4 text-blue-200 text-sm">
              Welcome back, {user?.fullName}! 👋
            </p>
          )}
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Berenda?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '🤖', title: 'AI Assistant', desc: 'Get instant help from our AI to find the perfect property in Addis Ababa.' },
            { icon: '💬', title: 'Direct Messaging', desc: 'Chat directly with landlords and tenants. No middlemen.' },
            { icon: '🏡', title: 'List Properties', desc: 'Easily list your property and reach thousands of potential renters.' },
          ].map((f) => (
            <div key={f.title} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {!isAuthenticated && (
        <div className="bg-gray-50 py-16 px-4 border-t border-gray-100">
          <div className="max-w-lg mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
            <p className="text-gray-500 mb-6">Only Gmail accounts accepted. Sign up for free today.</p>
            <Link
              to="/register"
              className="inline-block px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow"
            >
              {t('auth.registerButton')} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
