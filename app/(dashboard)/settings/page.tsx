'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SetupData {
  secret: string;
  qrCode: string;
  uri: string;
}

type Tab = 'general' | 'security' | 'journal' | 'calendar' | 'connections';

type JournalPinMode = 'idle' | 'set' | 'change' | 'remove';
type CalendarStatus = { connected: boolean; lastSynced?: string | null } | null;
type PlaidAccounts = { accounts: unknown[] } | null;

// ---------------------------------------------------------------------------
// Shared inline style helpers
// ---------------------------------------------------------------------------

const inputCls =
  'w-full rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const btnPrimary =
  'inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const btnSecondary =
  'inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const btnDanger =
  'inline-flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const btnSmPrimary =
  'inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const btnSmSecondary =
  'inline-flex items-center justify-center gap-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const btnSmDanger =
  'inline-flex items-center justify-center gap-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const cardCls = 'rounded-xl bg-[#111114] border border-white/[0.06] p-5';

function Spinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70" />
  );
}

// ---------------------------------------------------------------------------
// Inline label + input combo
// ---------------------------------------------------------------------------

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}
function Field({ label, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      {children}
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BackupCodesModal
// ---------------------------------------------------------------------------

interface BackupCodesModalProps {
  codes: string[];
  onClose: () => void;
}

function BackupCodesModal({ codes, onClose }: BackupCodesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-[#111114] border border-white/[0.06] p-6 shadow-xl shadow-black/40">
        <div className="mb-1 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-indigo-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
          <h3 className="text-base font-semibold text-zinc-100">
            Save your backup codes
          </h3>
        </div>
        <p className="mb-4 text-sm text-zinc-400">
          Store these in a safe place. Each code can only be used once.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {codes.map((code) => (
            <div
              key={code}
              className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-center font-mono text-sm tracking-widest text-zinc-200"
            >
              {code}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className={btnSecondary + ' flex-1'}
            onClick={() => {
              const text = codes.join('\n');
              void navigator.clipboard.writeText(text);
            }}
          >
            Copy all
          </button>
          <button
            type="button"
            className={btnPrimary + ' flex-1'}
            onClick={onClose}
          >
            I&apos;ve saved them
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab icons
// ---------------------------------------------------------------------------

function IconUser() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

const TAB_META: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <IconUser /> },
  { id: 'security', label: 'Security', icon: <IconShield /> },
  { id: 'journal', label: 'Journal', icon: <IconBook /> },
  { id: 'calendar', label: 'Calendar', icon: <IconCalendar /> },
  { id: 'connections', label: 'Connections', icon: <IconLink /> },
];

// ---------------------------------------------------------------------------
// GeneralTab
// ---------------------------------------------------------------------------

interface GeneralTabProps {
  email: string;
  name: string;
  createdAt: string | null;
}

function GeneralTab({ email, name, createdAt }: GeneralTabProps) {
  const initial = email ? email[0]?.toUpperCase() : 'U';
  const connectedSince = createdAt
    ? new Date(createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '—';

  return (
    <div className={cardCls}>
      <div className="mb-4">
        <p className="text-sm font-semibold text-zinc-100">Account</p>
        <p className="text-xs text-zinc-500">Your account information.</p>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl font-semibold text-white shadow-lg shadow-indigo-500/20">
          {initial}
        </div>
        <div className="space-y-3">
          {name && (
            <div>
              <p className="text-base font-medium text-zinc-100">{name}</p>
              <p className="text-xs text-zinc-500">Display name</p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-zinc-200">{email || '—'}</p>
            <p className="text-xs text-zinc-500">Email address</p>
          </div>
          <div>
            <p className="text-sm text-zinc-300">{connectedSince}</p>
            <p className="text-xs text-zinc-500">Member since</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SecurityTab
// ---------------------------------------------------------------------------

function SecurityTab() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Enable flow
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [enableCode, setEnableCode] = useState('');
  const [enableLoading, setEnableLoading] = useState(false);
  const [enableError, setEnableError] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // Disable flow
  const [disableCode, setDisableCode] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState('');
  const [showDisable, setShowDisable] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = (await response.json()) as {
          user?: { twoFactorEnabled?: boolean };
        };
        setTwoFactorEnabled(data.user?.twoFactorEnabled ?? false);
      }
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const handleSetup2FA = async () => {
    setSetupLoading(true);
    setEnableError('');
    try {
      const response = await fetch('/api/auth/2fa/setup');
      if (response.ok) {
        const data = (await response.json()) as SetupData;
        setSetupData(data);
      } else {
        setEnableError('Failed to generate QR code. Please try again.');
      }
    } catch {
      setEnableError('Something went wrong. Please try again.');
    } finally {
      setSetupLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!setupData || !enableCode) return;

    setEnableLoading(true);
    setEnableError('');

    try {
      const response = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: setupData.secret, code: enableCode }),
      });

      const data = (await response.json()) as {
        error?: string;
        backupCodes?: string[];
      };

      if (!response.ok) {
        setEnableError(data.error ?? 'Failed to enable 2FA. Please try again.');
        return;
      }

      setTwoFactorEnabled(true);
      setSetupData(null);
      setEnableCode('');
      if (data.backupCodes) {
        setBackupCodes(data.backupCodes);
      }
    } catch {
      setEnableError('Something went wrong. Please try again.');
    } finally {
      setEnableLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!disableCode) return;

    setDisableLoading(true);
    setDisableError('');

    try {
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setDisableError(
          data.error ?? 'Failed to disable 2FA. Please try again.'
        );
        return;
      }

      setTwoFactorEnabled(false);
      setShowDisable(false);
      setDisableCode('');
    } catch {
      setDisableError('Something went wrong. Please try again.');
    } finally {
      setDisableLoading(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <div className={cardCls}>
        <div className="mb-5">
          <p className="text-sm font-semibold text-zinc-100">Two-Factor Authentication</p>
          <p className="text-xs text-zinc-500">Add an extra layer of security to your account.</p>
        </div>

        {twoFactorEnabled ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-400">
                  2FA Active
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                Your account is protected with an authenticator app.
              </p>
            </div>

            {!showDisable ? (
              <button
                type="button"
                className={btnDanger}
                onClick={() => setShowDisable(true)}
              >
                Disable two-factor authentication
              </button>
            ) : (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
                <p className="mb-4 text-sm text-red-400">
                  Enter your current 6-digit code to disable 2FA.
                </p>
                <form
                  onSubmit={handleDisable2FA}
                  noValidate
                  className="flex flex-col gap-3"
                >
                  <Field label="Verification code" error={disableError}>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      maxLength={6}
                      value={disableCode}
                      onChange={(e) =>
                        setDisableCode(e.target.value.replace(/\D/g, ''))
                      }
                      disabled={disableLoading}
                      className={inputCls}
                    />
                  </Field>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={btnSmSecondary}
                      onClick={() => {
                        setShowDisable(false);
                        setDisableCode('');
                        setDisableError('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={btnSmDanger}
                      disabled={disableLoading || disableCode.length !== 6}
                    >
                      {disableLoading && <Spinner />}
                      Confirm disable
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {!setupData ? (
              <div>
                <p className="mb-4 text-sm text-zinc-400">
                  Use an authenticator app like Google Authenticator, Authy, or
                  1Password to generate time-based codes.
                </p>
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={handleSetup2FA}
                  disabled={setupLoading}
                >
                  {setupLoading && <Spinner />}
                  Enable two-factor authentication
                </button>
                {enableError && !setupData && (
                  <p className="mt-2 text-sm text-red-400">{enableError}</p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Step 1 */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      1
                    </span>
                    <p className="text-sm font-medium text-zinc-200">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>
                  <div className="inline-block rounded-xl border border-white/[0.06] bg-white/[0.04] p-3">
                    <Image
                      src={setupData.qrCode}
                      alt="2FA QR code"
                      width={200}
                      height={200}
                      className="rounded"
                      unoptimized
                    />
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-400">
                      Can&apos;t scan? Show secret key
                    </summary>
                    <p className="mt-1 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 font-mono text-xs tracking-widest text-zinc-300">
                      {setupData.secret}
                    </p>
                  </details>
                </div>

                {/* Step 2 */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      2
                    </span>
                    <p className="text-sm font-medium text-zinc-200">
                      Enter the 6-digit code to confirm
                    </p>
                  </div>
                  <form
                    onSubmit={handleEnable2FA}
                    noValidate
                    className="flex flex-col gap-3"
                  >
                    <Field label="Verification code" error={enableError}>
                      <input
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        maxLength={6}
                        value={enableCode}
                        onChange={(e) =>
                          setEnableCode(e.target.value.replace(/\D/g, ''))
                        }
                        disabled={enableLoading}
                        className={inputCls}
                      />
                    </Field>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className={btnSmSecondary}
                        onClick={() => {
                          setSetupData(null);
                          setEnableCode('');
                          setEnableError('');
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className={btnSmPrimary}
                        disabled={enableLoading || enableCode.length !== 6}
                      >
                        {enableLoading && <Spinner />}
                        Enable 2FA
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {backupCodes && (
        <BackupCodesModal
          codes={backupCodes}
          onClose={() => setBackupCodes(null)}
        />
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// JournalTab
// ---------------------------------------------------------------------------

function JournalTab() {
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<JournalPinMode>('idle');

  // Set PIN form
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [setPinError, setSetPinError] = useState('');
  const [setPinLoading, setSetPinLoading] = useState(false);

  // Change PIN form
  const [currentPinChange, setCurrentPinChange] = useState('');
  const [changedPin, setChangedPin] = useState('');
  const [confirmChangedPin, setConfirmChangedPin] = useState('');
  const [changePinError, setChangePinError] = useState('');
  const [changePinLoading, setChangePinLoading] = useState(false);

  // Remove PIN form
  const [currentPinRemove, setCurrentPinRemove] = useState('');
  const [removePinError, setRemovePinError] = useState('');
  const [removePinLoading, setRemovePinLoading] = useState(false);

  const fetchPinStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/journal/pin');
      if (res.ok) {
        const data = (await res.json()) as { hasPin: boolean };
        setHasPin(data.hasPin);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPinStatus();
  }, [fetchPinStatus]);

  const resetForms = () => {
    setNewPin('');
    setConfirmPin('');
    setSetPinError('');
    setCurrentPinChange('');
    setChangedPin('');
    setConfirmChangedPin('');
    setChangePinError('');
    setCurrentPinRemove('');
    setRemovePinError('');
    setMode('idle');
  };

  const handleSetPin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(newPin)) {
      setSetPinError('PIN must be 4–6 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setSetPinError('PINs do not match.');
      return;
    }
    setSetPinLoading(true);
    setSetPinError('');
    try {
      const res = await fetch('/api/journal/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSetPinError(data.error ?? 'Failed to set PIN.');
        return;
      }
      setHasPin(true);
      resetForms();
    } catch {
      setSetPinError('Something went wrong. Please try again.');
    } finally {
      setSetPinLoading(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!/^\d{4,6}$/.test(changedPin)) {
      setChangePinError('New PIN must be 4–6 digits.');
      return;
    }
    if (changedPin !== confirmChangedPin) {
      setChangePinError('New PINs do not match.');
      return;
    }
    setChangePinLoading(true);
    setChangePinError('');
    try {
      const res = await fetch('/api/journal/pin', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin: currentPinChange, newPin: changedPin }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setChangePinError(data.error ?? 'Failed to change PIN.');
        return;
      }
      resetForms();
    } catch {
      setChangePinError('Something went wrong. Please try again.');
    } finally {
      setChangePinLoading(false);
    }
  };

  const handleRemovePin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRemovePinLoading(true);
    setRemovePinError('');
    try {
      const res = await fetch('/api/journal/pin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin: currentPinRemove }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setRemovePinError(data.error ?? 'Failed to remove PIN.');
        return;
      }
      setHasPin(false);
      resetForms();
    } catch {
      setRemovePinError('Something went wrong. Please try again.');
    } finally {
      setRemovePinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className={cardCls}>
      <div className="mb-5">
        <p className="text-sm font-semibold text-zinc-100">Journal PIN</p>
        <p className="text-xs text-zinc-500">
          Protect your journal entries with a numeric PIN.
        </p>
      </div>

      {!hasPin ? (
        /* No PIN set */
        <div className="space-y-4">
          {mode !== 'set' ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                No PIN set. You can lock journal entries with a PIN.
              </p>
              <button
                type="button"
                className={btnSmPrimary}
                onClick={() => setMode('set')}
              >
                Set PIN
              </button>
            </div>
          ) : (
            <form onSubmit={handleSetPin} noValidate className="space-y-4">
              <Field label="New PIN (4–6 digits)">
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  disabled={setPinLoading}
                  className={inputCls}
                />
              </Field>
              <Field label="Confirm PIN" error={setPinError}>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  disabled={setPinLoading}
                  className={inputCls}
                />
              </Field>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={btnSmSecondary}
                  onClick={resetForms}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={btnSmPrimary}
                  disabled={setPinLoading || newPin.length < 4 || confirmPin.length < 4}
                >
                  {setPinLoading && <Spinner />}
                  Save PIN
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* PIN is set */
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-green-400">
                PIN is set
              </span>
            </div>
            <p className="text-sm text-zinc-400">
              Journal entries can be locked with your PIN.
            </p>
          </div>

          {mode === 'idle' && (
            <div className="flex gap-2">
              <button
                type="button"
                className={btnSmSecondary}
                onClick={() => setMode('change')}
              >
                Change PIN
              </button>
              <button
                type="button"
                className={btnSmDanger}
                onClick={() => setMode('remove')}
              >
                Remove PIN
              </button>
            </div>
          )}

          {mode === 'change' && (
            <form
              onSubmit={handleChangePin}
              noValidate
              className="space-y-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4"
            >
              <p className="text-sm font-semibold text-zinc-100">Change PIN</p>
              <Field label="Current PIN">
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={6}
                  value={currentPinChange}
                  onChange={(e) =>
                    setCurrentPinChange(e.target.value.replace(/\D/g, ''))
                  }
                  disabled={changePinLoading}
                  className={inputCls}
                />
              </Field>
              <Field label="New PIN (4–6 digits)">
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={6}
                  value={changedPin}
                  onChange={(e) =>
                    setChangedPin(e.target.value.replace(/\D/g, ''))
                  }
                  disabled={changePinLoading}
                  className={inputCls}
                />
              </Field>
              <Field label="Confirm new PIN" error={changePinError}>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={6}
                  value={confirmChangedPin}
                  onChange={(e) =>
                    setConfirmChangedPin(e.target.value.replace(/\D/g, ''))
                  }
                  disabled={changePinLoading}
                  className={inputCls}
                />
              </Field>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={btnSmSecondary}
                  onClick={resetForms}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={btnSmPrimary}
                  disabled={
                    changePinLoading ||
                    currentPinChange.length < 4 ||
                    changedPin.length < 4 ||
                    confirmChangedPin.length < 4
                  }
                >
                  {changePinLoading && <Spinner />}
                  Update PIN
                </button>
              </div>
            </form>
          )}

          {mode === 'remove' && (
            <form
              onSubmit={handleRemovePin}
              noValidate
              className="space-y-4 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4"
            >
              <p className="text-sm text-red-400">
                Enter your current PIN to remove it. All locked entries will be
                unlocked.
              </p>
              <Field label="Current PIN" error={removePinError}>
                <input
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  maxLength={6}
                  value={currentPinRemove}
                  onChange={(e) =>
                    setCurrentPinRemove(e.target.value.replace(/\D/g, ''))
                  }
                  disabled={removePinLoading}
                  className={inputCls}
                />
              </Field>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={btnSmSecondary}
                  onClick={resetForms}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={btnSmDanger}
                  disabled={removePinLoading || currentPinRemove.length < 4}
                >
                  {removePinLoading && <Spinner />}
                  Remove PIN
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// CalendarTab
// ---------------------------------------------------------------------------

function CalendarTab() {
  const [status, setStatus] = useState<CalendarStatus>(null);
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [calendarError, setCalendarError] = useState('');
  const [syncSuccess, setSyncSuccess] = useState('');

  // iCal import
  const [icsFile, setIcsFile] = useState<File | null>(null);
  const [icsLoading, setIcsLoading] = useState(false);
  const [icsError, setIcsError] = useState('');
  const [icsSuccess, setIcsSuccess] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/calendar/google/status');
      if (res.ok) {
        const data = (await res.json()) as {
          connected: boolean;
          lastSynced?: string | null;
        };
        setStatus(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const handleConnect = async () => {
    setConnectLoading(true);
    setCalendarError('');
    try {
      const res = await fetch('/api/calendar/google/connect');
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setCalendarError(data.error ?? 'Failed to connect Google Calendar.');
      }
    } catch {
      setCalendarError('Something went wrong. Please try again.');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncLoading(true);
    setSyncSuccess('');
    setCalendarError('');
    try {
      const res = await fetch('/api/calendar/google/sync', { method: 'POST' });
      if (res.ok) {
        setSyncSuccess('Synced successfully!');
        void fetchStatus();
      } else {
        const data = (await res.json()) as { error?: string };
        setCalendarError(data.error ?? 'Sync failed.');
      }
    } catch {
      setCalendarError('Something went wrong. Please try again.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnectLoading(true);
    setCalendarError('');
    try {
      const res = await fetch('/api/calendar/google/disconnect', {
        method: 'DELETE',
      });
      if (res.ok) {
        setStatus({ connected: false });
      } else {
        const data = (await res.json()) as { error?: string };
        setCalendarError(data.error ?? 'Failed to disconnect.');
      }
    } catch {
      setCalendarError('Something went wrong. Please try again.');
    } finally {
      setDisconnectLoading(false);
    }
  };

  const handleIcsImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!icsFile) return;
    setIcsLoading(true);
    setIcsError('');
    setIcsSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', icsFile);
      const res = await fetch('/api/calendar/import', {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as { imported?: number; error?: string };
      if (!res.ok) {
        setIcsError(data.error ?? 'Import failed.');
      } else {
        setIcsSuccess(`Imported ${data.imported ?? 0} event(s) successfully.`);
        setIcsFile(null);
      }
    } catch {
      setIcsError('Something went wrong. Please try again.');
    } finally {
      setIcsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const lastSyncedLabel =
    status?.lastSynced
      ? new Date(status.lastSynced).toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
        })
      : 'Never';

  return (
    <div className="space-y-4">
      {/* Google Calendar */}
      <div className={cardCls}>
        <div className="mb-5">
          <p className="text-sm font-semibold text-zinc-100">Google Calendar</p>
          <p className="text-xs text-zinc-500">
            Sync your Google Calendar events into Whoami.
          </p>
        </div>

        {calendarError && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
            {calendarError}
          </div>
        )}

        {!status?.connected ? (
          <button
            type="button"
            className={btnPrimary}
            onClick={handleConnect}
            disabled={connectLoading}
          >
            {connectLoading && <Spinner />}
            Connect Google Calendar
          </button>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-400">
                  Connected
                </span>
              </div>
              <p className="text-sm text-zinc-400">
                Last synced: {lastSyncedLabel}
              </p>
            </div>
            {syncSuccess && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/[0.08] px-4 py-3 text-sm text-green-400">
                {syncSuccess}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                className={btnSmPrimary}
                onClick={handleSync}
                disabled={syncLoading}
              >
                {syncLoading && <Spinner />}
                Sync Now
              </button>
              <button
                type="button"
                className={btnSmDanger}
                onClick={handleDisconnect}
                disabled={disconnectLoading}
              >
                {disconnectLoading && <Spinner />}
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* iCal Import */}
      <div className={cardCls}>
        <div className="mb-5">
          <p className="text-sm font-semibold text-zinc-100">iCal Import</p>
          <p className="text-xs text-zinc-500">
            Import events from an .ics file exported from any calendar app.
          </p>
        </div>

        <form onSubmit={handleIcsImport} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Select .ics file
            </label>
            <input
              type="file"
              accept=".ics"
              disabled={icsLoading}
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setIcsFile(file);
                setIcsError('');
                setIcsSuccess('');
              }}
              className={[
                'w-full rounded-xl border border-white/[0.08] bg-white/[0.06] px-3 py-2.5 text-sm text-zinc-300 outline-none',
                'file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white',
                'hover:border-white/[0.12] focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-50',
              ].join(' ')}
            />
            {icsError && (
              <p className="text-xs text-red-400" role="alert">
                {icsError}
              </p>
            )}
            {icsSuccess && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/[0.08] px-4 py-3 text-sm text-green-400">
                {icsSuccess}
              </div>
            )}
          </div>
          <button
            type="submit"
            className={btnSmPrimary}
            disabled={icsLoading || !icsFile}
          >
            {icsLoading && <Spinner />}
            Import
          </button>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ConnectionsTab
// ---------------------------------------------------------------------------

function ConnectionsTab() {
  const [calStatus, setCalStatus] = useState<CalendarStatus>(null);
  const [plaidAccounts, setPlaidAccounts] = useState<PlaidAccounts>(null);
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [disconnectLoading, setDisconnectLoading] = useState(false);
  const [connectionsError, setConnectionsError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [calRes, plaidRes] = await Promise.all([
          fetch('/api/calendar/google/status'),
          fetch('/api/plaid/accounts'),
        ]);
        if (calRes.ok) {
          const data = (await calRes.json()) as {
            connected: boolean;
            lastSynced?: string | null;
          };
          setCalStatus(data);
        }
        if (plaidRes.ok) {
          const data = (await plaidRes.json()) as { accounts: unknown[] };
          setPlaidAccounts(data);
        }
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, []);

  const handleCalConnect = async () => {
    setConnectLoading(true);
    setConnectionsError('');
    try {
      const res = await fetch('/api/calendar/google/connect');
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        setConnectionsError(data.error ?? 'Failed to connect Google Calendar.');
      }
    } catch {
      setConnectionsError('Something went wrong. Please try again.');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleCalDisconnect = async () => {
    setDisconnectLoading(true);
    setConnectionsError('');
    try {
      const res = await fetch('/api/calendar/google/disconnect', {
        method: 'DELETE',
      });
      if (res.ok) {
        setCalStatus({ connected: false });
      } else {
        const data = (await res.json()) as { error?: string };
        setConnectionsError(data.error ?? 'Failed to disconnect.');
      }
    } catch {
      setConnectionsError('Something went wrong. Please try again.');
    } finally {
      setDisconnectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const plaidCount = plaidAccounts?.accounts.length ?? 0;

  return (
    <div className={cardCls}>
      <div className="mb-5">
        <p className="text-sm font-semibold text-zinc-100">Connected Services</p>
        <p className="text-xs text-zinc-500">
          Manage the external services connected to your Whoami account.
        </p>
      </div>

      {connectionsError && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400">
          {connectionsError}
        </div>
      )}

      <div className="divide-y divide-white/[0.06]">
        {/* Google Calendar row */}
        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04] text-base font-bold text-white">
              G
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Google Calendar
              </p>
              {calStatus?.connected ? (
                <div className="mt-0.5 flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <span className="text-xs text-green-400">Connected</span>
                  </div>
                  {calStatus.lastSynced && (
                    <span className="text-xs text-zinc-500">
                      Last synced{' '}
                      {new Date(calStatus.lastSynced).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              ) : (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  <span className="text-xs text-zinc-500">Not connected</span>
                </div>
              )}
            </div>
          </div>
          <div>
            {calStatus?.connected ? (
              <button
                type="button"
                className={btnSmDanger}
                onClick={handleCalDisconnect}
                disabled={disconnectLoading}
              >
                {disconnectLoading && <Spinner />}
                Disconnect
              </button>
            ) : (
              <button
                type="button"
                className={btnSmPrimary}
                onClick={handleCalConnect}
                disabled={connectLoading}
              >
                {connectLoading && <Spinner />}
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Plaid / Bank row */}
        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.04]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-zinc-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10.5h18M3 15h18M3 19.5h18M12 3L3 7.5h18L12 3z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-200">
                Plaid · Bank Accounts
              </p>
              {plaidCount > 0 ? (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-xs text-green-400">
                    {plaidCount} account{plaidCount !== 1 ? 's' : ''} linked
                  </span>
                </div>
              ) : (
                <div className="mt-0.5 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-500" />
                  <span className="text-xs text-zinc-500">No accounts linked</span>
                </div>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs text-zinc-500">
              Manage in Budget module
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SettingsPage
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('general');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = (await res.json()) as {
            user?: { email?: string; name?: string; createdAt?: string };
          };
          setEmail(data.user?.email ?? '');
          setName(data.user?.name ?? '');
          setCreatedAt(data.user?.createdAt ?? null);
        }
      } catch {
        // non-critical
      } finally {
        setSessionLoading(false);
      }
    };
    void fetchSession();
  }, []);

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page heading */}
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-8 right-0 h-32 w-64 rounded-full bg-indigo-600/10 blur-3xl" />
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your account, security, and integrations.
        </p>
      </div>

      {/* Tab bar — underline style */}
      <div className="flex gap-0.5 border-b border-white/[0.06]">
        {TAB_META.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]',
              activeTab === tab.id
                ? 'border-b-2 border-indigo-500 text-indigo-400 -mb-px'
                : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'general' && (
          <GeneralTab email={email} name={name} createdAt={createdAt} />
        )}
        {activeTab === 'security' && <SecurityTab />}
        {activeTab === 'journal' && <JournalTab />}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'connections' && <ConnectionsTab />}
      </div>
    </div>
  );
}
