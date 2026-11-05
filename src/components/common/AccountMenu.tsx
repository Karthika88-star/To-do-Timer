'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/lib/authContext';
import { useTheme } from '@/lib/themeContext';
import { 
  MoreVertical, 
  User, 
  Settings, 
  Palette, 
  HelpCircle, 
  LogOut, 
  X, 
  Check, 
  Volume2, 
  VolumeX, 
  Coffee, 
  Sun,
  Moon
} from 'lucide-react';

interface ProfileModalProps {
  initialName: string;
  initialEmail: string;
  initials: string;
  completedCount: number;
  focusedMinutes: number;
  onSave: (name: string, email: string) => void;
  onClose: () => void;
}

function ProfileModal({
  initialName,
  initialEmail,
  initials,
  completedCount,
  focusedMinutes,
  onSave,
  onClose,
}: ProfileModalProps) {
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display name cannot be empty.');
      return;
    }
    setError('');
    onSave(name.trim(), email.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in"
      role="dialog"
      aria-labelledby="profile-title"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-2xl border border-[var(--border-color,#243A34)] w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color,#243A34)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black flex items-center justify-center text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div>
              <h3 id="profile-title" className="text-base font-bold">
                Account Details
              </h3>
              <p className="text-xs text-[var(--text-secondary,#A5B5AD)]">Personal productivity profile</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated,#172B27)] text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1">
              Full Display Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2 text-sm bg-[var(--surface-elevated,#172B27)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)]"
              required
            />
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-primary,#F2F6F1)] mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[var(--surface-elevated,#172B27)] border border-[var(--border-color,#243A34)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--primary-accent,#5ACB91)] text-[var(--text-primary,#F2F6F1)]"
              required
            />
          </div>

          {/* Productivity Stats Overview */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)]">
              <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)] font-medium">Completed Mini-Tasks</p>
              <p className="text-lg font-bold text-[var(--primary-accent,#5ACB91)] mt-0.5">
                {completedCount} tasks
              </p>
            </div>
            <div className="p-3 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)]">
              <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)] font-medium">Focused Time</p>
              <p className="text-lg font-bold text-[var(--primary-accent,#5ACB91)] mt-0.5">
                {Math.floor(focusedMinutes / 60)}h {focusedMinutes % 60}m
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border-color,#243A34)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[var(--text-secondary,#A5B5AD)] hover:bg-[var(--surface-elevated,#172B27)] rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white dark:text-black bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved!
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AccountMenuProps {
  placement?: 'top' | 'bottom';
}

export function AccountMenu({ placement = 'top' }: AccountMenuProps) {
  const { user, signOut, updateProfile, updatePreferences } = useAuth();
  const { theme, toggleTheme, setTheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'profile' | 'preferences' | 'help' | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Esc
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setActiveModal(null);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : 'TT';

  return (
    <div className="relative" ref={menuRef}>
      {/* Account trigger button card */}
      <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] hover:border-[var(--primary-accent,#5ACB91)]/40 transition-all text-[var(--text-primary,#F2F6F1)]">
        <button
          onClick={() => setActiveModal('profile')}
          className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)] rounded-lg p-0.5 flex-1 min-w-0"
          aria-label="View user profile"
        >
          <div className="w-9 h-9 rounded-full bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] text-white dark:text-black font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
            {initials}
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-[var(--text-primary,#F2F6F1)] truncate leading-tight">
              {user?.name || 'Alex Morgan'}
            </p>
            <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)] truncate leading-tight">
              {user?.email || 'alex.morgan@company.com'}
            </p>
          </div>
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] hover:bg-[var(--surface-elevated,#172B27)] rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-accent,#5ACB91)]"
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="Account actions menu"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Dropdown Menu - properly positioned with high z-index and contained boundaries */}
      {isOpen && (
        <div 
          className={`absolute ${
            placement === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
          } left-0 right-0 bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-2xl shadow-2xl border border-[var(--border-color,#243A34)] p-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-md`}
          role="menu"
        >
          {/* Profile Details */}
          <button
            onClick={() => {
              setActiveModal('profile');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-elevated,#172B27)] rounded-xl transition-colors text-left"
            role="menuitem"
          >
            <User className="w-4 h-4 text-[var(--primary-accent,#5ACB91)] shrink-0" />
            <span className="truncate">Profile Details</span>
          </button>

          {/* Preferences */}
          <button
            onClick={() => {
              setActiveModal('preferences');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-elevated,#172B27)] rounded-xl transition-colors text-left"
            role="menuitem"
          >
            <Settings className="w-4 h-4 text-[var(--primary-accent,#5ACB91)] shrink-0" />
            <span className="truncate">Timer & Preferences</span>
          </button>

          {/* Functional Theme Switcher Item */}
          <button
            onClick={() => {
              toggleTheme();
              updatePreferences({ themePreference: theme === 'dark' ? 'Warm Ivory' : 'Dark Focus Studio' });
            }}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-elevated,#172B27)] rounded-xl transition-colors text-left"
            role="menuitem"
          >
            <span className="flex items-center gap-2.5 min-w-0">
              {isDark ? (
                <Moon className="w-4 h-4 text-[var(--primary-accent,#5ACB91)] shrink-0" />
              ) : (
                <Sun className="w-4 h-4 text-amber-500 shrink-0" />
              )}
              <span className="truncate">Theme</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--soft-mint,#172B27)] text-[var(--primary-accent,#5ACB91)] font-bold border border-[var(--border-color,#243A34)] shrink-0">
              {isDark ? 'Dark Studio' : 'Warm Light'}
            </span>
          </button>

          {/* Help & Guide */}
          <button
            onClick={() => {
              setActiveModal('help');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold hover:bg-[var(--surface-elevated,#172B27)] rounded-xl transition-colors text-left"
            role="menuitem"
          >
            <HelpCircle className="w-4 h-4 text-[var(--primary-accent,#5ACB91)] shrink-0" />
            <span className="truncate">Help & Shortcuts</span>
          </button>

          <div className="h-px bg-[var(--border-color,#243A34)] my-1" />

          {/* Safe Sign Out (preserves tasks & preferences in localStorage) */}
          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-xl transition-colors text-left"
            role="menuitem"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="truncate">Sign Out</span>
          </button>
        </div>
      )}

      {/* Modal: Profile Details */}
      {activeModal === 'profile' && user && (
        <ProfileModal
          initialName={user.name}
          initialEmail={user.email}
          initials={initials}
          completedCount={user.completedMiniTasksCount || 0}
          focusedMinutes={user.totalFocusedMinutes || 0}
          onSave={(name, email) => updateProfile({ name, email })}
          onClose={() => setActiveModal(null)}
        />
      )}

      {/* Modal: Preferences */}
      {activeModal === 'preferences' && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in"
          role="dialog"
          aria-labelledby="pref-title"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div 
            className="bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-2xl border border-[var(--border-color,#243A34)] w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color,#243A34)]">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[var(--primary-accent,#5ACB91)]" />
                <h3 id="pref-title" className="text-base font-bold">
                  Focus & Timer Preferences
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-[var(--surface-elevated,#172B27)] text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Theme Preference */}
              <div className="p-3.5 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-4 h-4 text-[var(--primary-accent,#5ACB91)]" />
                    <div>
                      <p className="text-xs font-bold text-[var(--text-primary,#F2F6F1)]">Interface Theme</p>
                      <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)]">Dark Focus Studio or Warm Light</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTheme('dark');
                      updatePreferences({ themePreference: 'Dark Focus Studio' });
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      isDark
                        ? 'bg-[var(--primary-accent,#5ACB91)] text-black border-transparent shadow-xs'
                        : 'bg-[var(--surface-elevated,#172B27)] border-[var(--border-color,#243A34)] text-[var(--text-primary,#F2F6F1)]'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>Dark Studio</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTheme('light');
                      updatePreferences({ themePreference: 'Warm Ivory' });
                    }}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      !isDark
                        ? 'bg-[#163D32] text-white border-transparent shadow-xs'
                        : 'bg-[var(--surface-elevated,#172B27)] border-[var(--border-color,#243A34)] text-[var(--text-primary,#F2F6F1)]'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>Warm Light</span>
                  </button>
                </div>
              </div>

              {/* Sound toggle */}
              <label className="flex items-center justify-between p-3.5 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)] cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--surface-card,#11211F)] text-[var(--primary-accent,#5ACB91)]">
                    {user?.preferences.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary,#F2F6F1)]">Audio Chime</p>
                    <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)]">Gentle audio cue when interval reaches 00:00</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={user?.preferences.soundEnabled ?? true}
                  onChange={(e) => updatePreferences({ soundEnabled: e.target.checked })}
                  className="w-4 h-4 accent-[var(--primary-accent,#5ACB91)] rounded cursor-pointer"
                />
              </label>

              {/* Auto start breaks */}
              <label className="flex items-center justify-between p-3.5 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)] cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-[var(--surface-card,#11211F)] text-[var(--secondary-accent,#8EE5AD)]">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary,#F2F6F1)]">Auto-Start Breaks</p>
                    <p className="text-[11px] text-[var(--text-secondary,#A5B5AD)]">Begin recharge break upon completing work block</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={user?.preferences.autoStartBreak ?? true}
                  onChange={(e) => updatePreferences({ autoStartBreak: e.target.checked })}
                  className="w-4 h-4 accent-[var(--primary-accent,#5ACB91)] rounded cursor-pointer"
                />
              </label>

              {/* Default Durations */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)]">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#A5B5AD)] mb-1">
                    Default Work (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={user?.preferences.defaultWorkDurationMinutes ?? 25}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val > 0) updatePreferences({ defaultWorkDurationMinutes: val });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] rounded-lg text-[var(--text-primary,#F2F6F1)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--text-secondary,#A5B5AD)] mb-1">
                    Default Rest (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={user?.preferences.defaultBreakDurationMinutes ?? 5}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (val > 0) updatePreferences({ defaultBreakDurationMinutes: val });
                    }}
                    className="w-full px-3 py-1.5 text-xs bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] rounded-lg text-[var(--text-primary,#F2F6F1)]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border-color,#243A34)] mt-5">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 text-xs font-bold text-white dark:text-black bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 rounded-xl transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Help & Keyboard Shortcuts */}
      {activeModal === 'help' && (
        <div 
          className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in"
          role="dialog"
          aria-labelledby="help-title"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setActiveModal(null);
          }}
        >
          <div 
            className="bg-[var(--surface-card,#11211F)] text-[var(--text-primary,#F2F6F1)] rounded-2xl border border-[var(--border-color,#243A34)] w-full max-w-md shadow-2xl p-6 relative overflow-hidden"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color,#243A34)]">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[var(--primary-accent,#5ACB91)]" />
                <h3 id="help-title" className="text-base font-bold">
                  To-do Timer Guide
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-[var(--surface-elevated,#172B27)] text-[var(--text-secondary,#A5B5AD)] hover:text-[var(--text-primary,#F2F6F1)] transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-[var(--text-secondary,#A5B5AD)]">
              <div className="p-3 bg-[var(--surface-elevated,#172B27)] rounded-xl border border-[var(--border-color,#243A34)] leading-relaxed">
                <p className="font-bold text-[var(--text-primary,#F2F6F1)] mb-1">Sequencing Architecture</p>
                <p>
                  Break down large projects into mini-tasks. In the focus workspace, each mini-task counts down without distractions. At 00:00, the decision dialog lets you add extra time (+5, 10, 15, 30m or custom) or advance smoothly to restorative breaks.
                </p>
              </div>

              <div>
                <p className="font-bold text-[var(--text-primary,#F2F6F1)] mb-2">Keyboard Shortcuts</p>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 bg-[var(--surface-elevated,#172B27)] rounded-lg border border-[var(--border-color,#243A34)]">
                    <span className="font-sans text-xs text-[var(--text-primary,#F2F6F1)]">Pause / Resume</span>
                    <kbd className="px-2 py-0.5 bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] rounded text-[var(--primary-accent,#5ACB91)] font-bold">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[var(--surface-elevated,#172B27)] rounded-lg border border-[var(--border-color,#243A34)]">
                    <span className="font-sans text-xs text-[var(--text-primary,#F2F6F1)]">Complete Work Block</span>
                    <kbd className="px-2 py-0.5 bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] rounded text-[var(--primary-accent,#5ACB91)] font-bold">Shift + C</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[var(--surface-elevated,#172B27)] rounded-lg border border-[var(--border-color,#243A34)]">
                    <span className="font-sans text-xs text-[var(--text-primary,#F2F6F1)]">Close Modals</span>
                    <kbd className="px-2 py-0.5 bg-[var(--surface-card,#11211F)] border border-[var(--border-color,#243A34)] rounded text-[var(--primary-accent,#5ACB91)] font-bold">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[var(--border-color,#243A34)] mt-5">
              <button
                onClick={() => setActiveModal(null)}
                className="px-5 py-2 text-xs font-bold text-white dark:text-black bg-[var(--primary-forest,#163D32)] dark:bg-[var(--primary-accent,#5ACB91)] hover:opacity-90 rounded-xl transition-colors shadow-sm"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
