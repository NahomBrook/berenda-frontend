import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { isGmailAddress, getErrorMessage } from '../utils';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim()) errs.fullName = t('common.required');
    if (!email) {
      errs.email = t('common.required');
    } else if (!isGmailAddress(email)) {
      errs.email = t('auth.gmailOnly');
    }
    if (!password) {
      errs.password = t('common.required');
    } else if (password.length < 6) {
      errs.password = t('auth.passwordMin');
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = t('auth.passwordMismatch');
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await register(email, password, fullName);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.registerTitle')}</h1>
          <p className="text-gray-500">{t('auth.registerSubtitle')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* Google Signup */}
          <div className="mb-6">
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Google sign up failed')}
                text="signup_with"
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
              label={t('auth.fullName')}
              type="text"
              placeholder={t('auth.fullNamePlaceholder')}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors((p) => ({ ...p, fullName: '' }));
              }}
              error={errors.fullName}
              required
              autoComplete="name"
              leftIcon={<span>👤</span>}
            />

            <Input
              label={t('auth.email')}
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: '' }));
              }}
              error={errors.email}
              required
              autoComplete="email"
              leftIcon={<span>📧</span>}
              hint={t('auth.gmailOnly')}
            />

            <Input
              label={t('auth.password')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: '' }));
              }}
              error={errors.password}
              required
              autoComplete="new-password"
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

            <Input
              label={t('auth.confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((p) => ({ ...p, confirmPassword: '' }));
              }}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
              leftIcon={<span>🔒</span>}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              {t('auth.registerButton')}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-gray-400">{t('auth.termsNotice')}</p>

          {/* Footer */}
          <p className="mt-4 text-center text-sm text-gray-500">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:underline">
              {t('auth.signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
