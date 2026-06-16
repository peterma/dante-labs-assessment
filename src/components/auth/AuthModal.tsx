import React, { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import axios from 'axios';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

type Mode = 'login' | 'signup';

interface FormState {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  rememberMe: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

function getPasswordStrength(password: string) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { label: 'Very Weak', color: 'bg-red-500' },
    { label: 'Weak', color: 'bg-orange-500' },
    { label: 'Fair', color: 'bg-yellow-500' },
    { label: 'Strong', color: 'bg-lime-500' },
    { label: 'Very Strong', color: 'bg-green-500' },
  ];
  return { score, ...levels[Math.min(score, 4)] };
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  rememberMe: false,
};

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const strength = getPasswordStrength(form.password);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = field === 'rememberMe' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setApiError('');
  };

  const handleBlur = (field: string) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateFields({ [field]: true });
  };

  const validateFields = (touchOverride?: Record<string, boolean>): FormErrors => {
    const e: FormErrors = {};
    if (mode === 'signup' && !form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!isValidEmail(form.email)) e.email = 'Invalid email address';
    if (!form.password) e.password = 'Password is required';
    else if (mode === 'signup' && form.password.length < 8) e.password = 'At least 8 characters required';
    if (mode === 'signup') {
      if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password';
      else if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    const e = validateFields();
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      if (mode === 'login') {
        const { data } = await axios.post(`${API_BASE}/api/user/login`, {
          email: form.email,
          password: form.password,
        });
        if (form.rememberMe) {
          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
        } else {
          sessionStorage.setItem('auth_token', data.token);
        }
        setApiSuccess('Login successful! Welcome back.');
        setTimeout(() => { onSuccess?.(data.user); handleClose(); }, 1200);
      } else {
        const { data } = await axios.post(`${API_BASE}/api/user/register`, {
          name: form.name,
          email: form.email,
          password: form.password,
          gender: 'other',
          avatar: 'https://www.gravatar.com/avatar/?d=mp&s=150',
        });
        setApiSuccess('Account created! You are now logged in.');
        setTimeout(() => { onSuccess?.(data.user); handleClose(); }, 1200);
      }
    } catch (err: any) {
      setApiError(
        err.response?.data?.message ||
        `${mode === 'login' ? 'Login' : 'Registration'} failed. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setTouched({});
    setApiError('');
    setApiSuccess('');
    setShowPassword(false);
    setShowConfirm(false);
    onClose();
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setTouched({});
    setApiError('');
    setApiSuccess('');
  };

  const fieldClass = (field: keyof FormErrors) =>
    `w-full px-4 py-3 rounded-lg bg-[#1E1E1E] border text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-colors text-sm ${
      errors[field] && touched[field]
        ? 'border-red-500 focus:ring-red-500'
        : 'border-[#333333] focus:border-[#876BD2] focus:ring-[#876BD2]'
    }`;

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed z-30 inset-0 overflow-y-auto" onClose={handleClose}>
        <div className="flex items-center justify-center min-h-screen px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" />
          </Transition.Child>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
            &#8203;
          </span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom p-0.5 rounded-xl bg-gradient-to-br from-[#DB5E7F] via-[#876BD2] to-[#6E93E8] text-left overflow-hidden shadow-2xl transform transition-all sm:align-middle w-full max-w-md">
              <div className="bg-[#151515] rounded-xl px-6 py-7 sm:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title as="h2" className="text-xl font-bold text-white">
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </Dialog.Title>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white transition-colors p-1"
                    aria-label="Close dialog"
                  >
                    <i className="fa fa-times text-lg" aria-hidden="true" />
                  </button>
                </div>

                {/* Mode tabs */}
                <div className="flex border-b border-[#222222] mb-6" role="tablist" aria-label="Authentication mode">
                  {(['login', 'signup'] as Mode[]).map(m => (
                    <button
                      key={m}
                      role="tab"
                      aria-selected={mode === m}
                      onClick={() => switchMode(m)}
                      className={`pb-3 px-1 mr-6 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                        mode === m
                          ? 'border-[#876BD2] text-white'
                          : 'border-transparent text-gray-400 hover:text-gray-200'
                      }`}
                    >
                      {m === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                  ))}
                </div>

                {/* API feedback */}
                {apiError && (
                  <div
                    role="alert"
                    className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-700/60 text-red-300 text-sm flex items-center gap-2"
                  >
                    <i className="fa fa-exclamation-circle flex-shrink-0" aria-hidden="true" />
                    {apiError}
                  </div>
                )}
                {apiSuccess && (
                  <div
                    role="status"
                    className="mb-4 p-3 rounded-lg bg-green-900/30 border border-green-700/60 text-green-300 text-sm flex items-center gap-2"
                  >
                    <i className="fa fa-check-circle flex-shrink-0" aria-hidden="true" />
                    {apiSuccess}
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate aria-label={mode === 'login' ? 'Sign in form' : 'Create account form'}>
                  {/* Name — signup only */}
                  {mode === 'signup' && (
                    <div className="mb-4">
                      <label htmlFor="auth-name" className="block text-sm font-medium text-gray-300 mb-1.5">
                        Full Name
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        autoComplete="name"
                        value={form.name}
                        onChange={handleChange('name')}
                        onBlur={handleBlur('name')}
                        aria-required="true"
                        aria-invalid={!!(errors.name && touched.name)}
                        aria-describedby={errors.name && touched.name ? 'name-error' : undefined}
                        placeholder="John Doe"
                        className={fieldClass('name')}
                      />
                      {errors.name && touched.name && (
                        <p id="name-error" role="alert" className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <i className="fa fa-exclamation-circle" aria-hidden="true" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Email */}
                  <div className="mb-4">
                    <label htmlFor="auth-email" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Email Address
                    </label>
                    <input
                      id="auth-email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange('email')}
                      onBlur={handleBlur('email')}
                      aria-required="true"
                      aria-invalid={!!(errors.email && touched.email)}
                      aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
                      placeholder="you@example.com"
                      className={fieldClass('email')}
                    />
                    {errors.email && touched.email && (
                      <p id="email-error" role="alert" className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <i className="fa fa-exclamation-circle" aria-hidden="true" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <label htmlFor="auth-password" className="block text-sm font-medium text-gray-300 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                        value={form.password}
                        onChange={handleChange('password')}
                        onBlur={handleBlur('password')}
                        aria-required="true"
                        aria-invalid={!!(errors.password && touched.password)}
                        aria-describedby={[
                          errors.password && touched.password ? 'password-error' : '',
                          mode === 'signup' && form.password ? 'password-strength' : '',
                        ]
                          .filter(Boolean)
                          .join(' ') || undefined}
                        placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'}
                        className={`${fieldClass('password')} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={`fa ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`} aria-hidden="true" />
                      </button>
                    </div>
                    {errors.password && touched.password && (
                      <p id="password-error" role="alert" className="mt-1 text-xs text-red-400 flex items-center gap-1">
                        <i className="fa fa-exclamation-circle" aria-hidden="true" />
                        {errors.password}
                      </p>
                    )}
                    {/* Strength meter — signup only */}
                    {mode === 'signup' && form.password && (
                      <div id="password-strength" className="mt-2" aria-live="polite">
                        <div className="flex gap-1 mb-1" aria-hidden="true">
                          {[0, 1, 2, 3, 4].map(i => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                i < strength.score ? strength.color : 'bg-[#2a2a2a]'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">
                          Strength: <span className="text-gray-200">{strength.label}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm password — signup only */}
                  {mode === 'signup' && (
                    <div className="mb-4">
                      <label htmlFor="auth-confirm" className="block text-sm font-medium text-gray-300 mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          id="auth-confirm"
                          type={showConfirm ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={form.confirmPassword}
                          onChange={handleChange('confirmPassword')}
                          onBlur={handleBlur('confirmPassword')}
                          aria-required="true"
                          aria-invalid={!!(errors.confirmPassword && touched.confirmPassword)}
                          aria-describedby={errors.confirmPassword && touched.confirmPassword ? 'confirm-error' : undefined}
                          placeholder="Re-enter your password"
                          className={`${fieldClass('confirmPassword')} pr-11`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(v => !v)}
                          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                          aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          <i className={`fa ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-sm`} aria-hidden="true" />
                        </button>
                      </div>
                      {errors.confirmPassword && touched.confirmPassword && (
                        <p id="confirm-error" role="alert" className="mt-1 text-xs text-red-400 flex items-center gap-1">
                          <i className="fa fa-exclamation-circle" aria-hidden="true" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Remember me — login only */}
                  {mode === 'login' && (
                    <div className="flex items-center justify-between mb-5 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          id="remember-me"
                          checked={form.rememberMe}
                          onChange={handleChange('rememberMe')}
                          className="w-4 h-4 rounded border-gray-600 bg-[#1E1E1E] cursor-pointer accent-[#7BE0D6]"
                        />
                        <span className="text-sm text-gray-300">Remember me</span>
                      </label>
                      <button
                        type="button"
                        className="text-xs text-[#7BE0D6] hover:underline"
                        aria-label="Forgot password — feature coming soon"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    aria-busy={loading}
                    className="w-full py-3 rounded-lg bg-gradient-to-r from-[#DB5E7F] via-[#876BD2] to-[#6E93E8] text-white font-semibold text-sm hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading && (
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    )}
                    {loading
                      ? mode === 'login'
                        ? 'Signing in…'
                        : 'Creating account…'
                      : mode === 'login'
                      ? 'Sign In'
                      : 'Create Account'}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px bg-[#2a2a2a]" aria-hidden="true" />
                  <span className="text-xs text-gray-500">or continue with</span>
                  <div className="flex-1 h-px bg-[#2a2a2a]" aria-hidden="true" />
                </div>

                {/* Social login placeholders */}
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled
                    title="Google login — coming soon"
                    aria-label="Sign in with Google (coming soon)"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#333333] text-gray-300 text-sm font-medium opacity-50 cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Google
                  </button>
                  <button
                    type="button"
                    disabled
                    title="GitHub login — coming soon"
                    aria-label="Sign in with GitHub (coming soon)"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1E1E1E] border border-[#333333] text-gray-300 text-sm font-medium opacity-50 cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                    </svg>
                    GitHub
                  </button>
                </div>

                {/* Toggle mode */}
                <p className="mt-5 text-center text-sm text-gray-400">
                  {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-[#7BE0D6] hover:underline font-medium"
                  >
                    {mode === 'login' ? 'Create one' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
