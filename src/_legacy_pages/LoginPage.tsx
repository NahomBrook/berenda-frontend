import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { getErrorMessage } from '../utils';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // Login accepts any valid email (admin accounts may use non-Gmail addresses).
  // Only registration requires Gmail.
  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = t('common.required');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = t('auth.invalidEmail');
    if (!password) errs.password = t('common.required');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await login(email, password);
      // Admin users are redirected to /admin inside AuthContext.login.
      // Non-admin users land on /messages.
      navigate('/messages');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setIsLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/messages');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏠</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.loginTitle')}</h1>
          <p className="text-gray-500">{t('auth.loginSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Google Login */}
          <div className="mb-6">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google login failed')}
                text="signin_with"
                shape="rectangular"
                size="large"
                width="360"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-3 text-gray-500">{t('common.or')}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('auth.email')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: undefined }));
              }}
              error={errors.email}
              required
              autoComplete="email"
              leftIcon={<span>📧</span>}
            />

            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: undefined }));
              }}
              error={errors.password}
              required
              autoComplete="current-password"
              leftIcon={<span>🔒</span>}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              }
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              {t('auth.loginButton')}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              {t('auth.signUp')}
            </Link>
          </p>
        </div>

        {/* Gmail notice */}
        <p className="mt-4 text-center text-xs text-gray-400">
          ✉️ {t('auth.gmailOnly')}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
