'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  User, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    // Form Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please provide a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'signup' && !name.trim()) {
      setError('Display name is required for account creation.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'signin') {
        const res = await signIn(email.trim(), password);
        if (!res.success) {
          setError(res.error || 'Invalid email or password.');
          return;
        }
        router.push('/dashboard');
      } else {
        const res = await signUp(email.trim(), password, name.trim());
        if (!res.success) {
          setError(res.error || 'Failed to create account.');
          return;
        }
        if (res.message) {
          setInfoMessage(res.message);
          return;
        }
        router.push('/dashboard');
      }
    } catch {
      setError('Unable to authenticate. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app,#091311)] text-[var(--text-primary,#F2F6F1)] flex flex-col justify-center items-center p-4 sm:p-6 select-none relative overflow-hidden transition-colors duration-300">
      {/* Background ambient accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[400px] bg-[var(--primary-accent,#5ACB91)]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden bg-white border border-[var(--border-color,#243A34)] shadow-lg mb-3">
            <Image
              src="/images/todo-timer-logo.png"
              alt="To-do Timer Logo"
              width={64}
              height={64}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary,#F2F6F1)] tracking-tight">
            To-do Timer
          </h1>
          <p className="text-xs text-[var(--text-secondary,#A5B5AD)] mt-1.5 font-medium">
            Turn ambitious projects into ordered, focused countdown sequences
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-[var(--surface-card,#11211F)] rounded-3xl border border-[var(--border-color,#243A34)] shadow-2xl p-6 sm:p-8 backdrop-blur-xs">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-[var(--surface-elevated,#172B27)] rounded-2xl border border-[var(--border-color,#243A34)] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError('');
                setInfoMessage('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-[var(--primary-accent,#5ACB91)] text-black shadow-xs'
                  : 'text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError('');
                setInfoMessage('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-[var(--primary-accent,#5ACB91)] text-black shadow-xs'
                  : 'text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)]'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name (Only in SignUp mode) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[var(--text-muted,#68736C)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[var(--surface-main,#0B1715)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)] placeholder:text-[var(--text-muted,#68736C)]"
                    required={mode === 'signup'}
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--text-muted,#68736C)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="alex.morgan@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[var(--surface-main,#0B1715)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)] placeholder:text-[var(--text-muted,#68736C)]"
                  required
                />
              </div>
            </div>

            {/* Password with Visibility Toggle */}
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[var(--text-muted,#68736C)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-[var(--surface-main,#0B1715)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-1 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)] placeholder:text-[var(--text-muted,#68736C)]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted,#68736C)] hover:text-[var(--text-primary,#F2F6F1)] focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation Error Message */}
            {error && (
              <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 font-medium animate-in fade-in">
                {error}
              </div>
            )}

            {/* Informational Success / Confirmation Notice */}
            {infoMessage && (
              <div className="p-2.5 rounded-xl bg-[var(--primary-accent,#5ACB91)]/10 border border-[var(--primary-accent,#5ACB91)]/20 text-xs text-[var(--primary-accent,#5ACB91)] font-medium flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{infoMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[var(--primary-accent,#5ACB91)] hover:bg-[var(--secondary-accent,#8EE5AD)] text-black font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Authenticating...' : mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security & Authenticated Session Notice */}
        <div className="mt-6 p-3.5 rounded-2xl bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] text-[11px] text-[var(--text-secondary,#A5B5AD)] flex items-start gap-2.5 leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-[var(--primary-accent,#5ACB91)] shrink-0 mt-0.5" />
          <p>
            <span className="font-semibold text-[var(--text-primary,#F2F6F1)]">Secure Authentication:</span> Sessions are managed via Supabase with Row Level Security. Data is isolated to your authenticated account.
          </p>
        </div>
      </div>
    </div>
  );
}
