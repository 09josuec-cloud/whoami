'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/src/components/ui/card';

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
// BackupCodesModal (unchanged from original)
// ---------------------------------------------------------------------------

interface BackupCodesModalProps {
  codes: string[];
  onClose: () => void;
}

function BackupCodesModal({ codes, onClose }: BackupCodesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-[#0f0f12] p-6 shadow-2xl">
        <h3 className="text-lg font-semibold text-zinc-100">
          Save your backup codes
        </h3>
        <p className="mt-1 text-sm text-zinc-400">
          Store these in a safe place. Each code can only be used once.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {codes.map((code) => (
            <div
              key={code}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-center font-mono text-sm tracking-widest text-zinc-200"
            >
              {code}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => {
              const text = codes.join('\n');
              void navigator.clipboard.writeText(text);
            }}
          >
            Copy all
          </Button>
          <Button className="flex-1" onClick={onClose}>
            I&apos;ve saved them
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab bar
// ---------------------------------------------------------------------------

const TABS: { id: Tab; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'security', label: 'Security' },
  { id: 'journal', label: 'Journal' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'connections', label: 'Connections' },
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
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Your account information.</CardDescription>
      </CardHeader>

      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-2xl font-semibold text-white">
          {initial}
        </div>
        <div className="space-y-2">
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
            <p className="text-xs text-zinc-500">Connected since</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// SecurityTab (2FA — identical logic from original settings page)
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
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>

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
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowDisable(true)}
              >
                Disable two-factor authentication
              </Button>
            ) : (
              <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                <p className="mb-3 text-sm text-red-400">
                  Enter your current 6-digit code to disable 2FA.
                </p>
                <form
                  onSubmit={handleDisable2FA}
                  noValidate
                  className="flex flex-col gap-3"
                >
                  <Input
                    label="Verification code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="000000"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) =>
                      setDisableCode(e.target.value.replace(/\D/g, ''))
                    }
                    error={disableError}
                    disabled={disableLoading}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowDisable(false);
                        setDisableCode('');
                        setDisableError('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="danger"
                      size="sm"
                      loading={disableLoading}
                      disabled={disableCode.length !== 6}
                    >
                      Confirm disable
                    </Button>
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
                <Button
                  onClick={handleSetup2FA}
                  loading={setupLoading}
                  disabled={setupLoading}
                >
                  Enable two-factor authentication
                </Button>
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
                  <div className="inline-block rounded-xl border border-zinc-700 bg-zinc-800 p-3">
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
                    <p className="mt-1 rounded border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-xs tracking-widest text-zinc-300">
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
                    <Input
                      label="Verification code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      maxLength={6}
                      value={enableCode}
                      onChange={(e) =>
                        setEnableCode(e.target.value.replace(/\D/g, ''))
                      }
                      error={enableError}
                      disabled={enableLoading}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSetupData(null);
                          setEnableCode('');
                          setEnableError('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        loading={enableLoading}
                        disabled={enableCode.length !== 6}
                      >
                        Enable 2FA
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

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
    <Card>
      <CardHeader>
        <CardTitle>Journal PIN</CardTitle>
        <CardDescription>
          Protect your journal entries with a numeric PIN.
        </CardDescription>
      </CardHeader>

      {!hasPin ? (
        /* No PIN set */
        <div className="space-y-4">
          {mode !== 'set' ? (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                No PIN set. You can lock journal entries with a PIN.
              </p>
              <Button size="sm" onClick={() => setMode('set')}>
                Set PIN
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSetPin} noValidate className="space-y-4">
              <Input
                label="New PIN (4–6 digits)"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                disabled={setPinLoading}
              />
              <Input
                label="Confirm PIN"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                error={setPinError}
                disabled={setPinLoading}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForms}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={setPinLoading}
                  disabled={newPin.length < 4 || confirmPin.length < 4}
                >
                  Save PIN
                </Button>
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
              <Button size="sm" variant="secondary" onClick={() => setMode('change')}>
                Change PIN
              </Button>
              <Button size="sm" variant="danger" onClick={() => setMode('remove')}>
                Remove PIN
              </Button>
            </div>
          )}

          {mode === 'change' && (
            <form
              onSubmit={handleChangePin}
              noValidate
              className="space-y-4 rounded-lg border border-zinc-700/50 bg-zinc-800/30 p-4"
            >
              <p className="text-sm font-medium text-zinc-200">Change PIN</p>
              <Input
                label="Current PIN"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={6}
                value={currentPinChange}
                onChange={(e) =>
                  setCurrentPinChange(e.target.value.replace(/\D/g, ''))
                }
                disabled={changePinLoading}
              />
              <Input
                label="New PIN (4–6 digits)"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={6}
                value={changedPin}
                onChange={(e) =>
                  setChangedPin(e.target.value.replace(/\D/g, ''))
                }
                disabled={changePinLoading}
              />
              <Input
                label="Confirm new PIN"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={6}
                value={confirmChangedPin}
                onChange={(e) =>
                  setConfirmChangedPin(e.target.value.replace(/\D/g, ''))
                }
                error={changePinError}
                disabled={changePinLoading}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForms}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={changePinLoading}
                  disabled={
                    currentPinChange.length < 4 ||
                    changedPin.length < 4 ||
                    confirmChangedPin.length < 4
                  }
                >
                  Update PIN
                </Button>
              </div>
            </form>
          )}

          {mode === 'remove' && (
            <form
              onSubmit={handleRemovePin}
              noValidate
              className="space-y-4 rounded-lg border border-red-500/20 bg-red-500/5 p-4"
            >
              <p className="text-sm text-red-400">
                Enter your current PIN to remove it. All locked entries will be
                unlocked.
              </p>
              <Input
                label="Current PIN"
                type="password"
                inputMode="numeric"
                placeholder="••••"
                maxLength={6}
                value={currentPinRemove}
                onChange={(e) =>
                  setCurrentPinRemove(e.target.value.replace(/\D/g, ''))
                }
                error={removePinError}
                disabled={removePinLoading}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForms}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={removePinLoading}
                  disabled={currentPinRemove.length < 4}
                >
                  Remove PIN
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Card>
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
    <div className="space-y-6">
      {/* Google Calendar */}
      <Card>
        <CardHeader>
          <CardTitle>Google Calendar</CardTitle>
          <CardDescription>
            Sync your Google Calendar events into Whoami.
          </CardDescription>
        </CardHeader>

        {calendarError && (
          <p className="mb-4 text-sm text-red-400">{calendarError}</p>
        )}

        {!status?.connected ? (
          <Button onClick={handleConnect} loading={connectLoading}>
            Connect Google Calendar
          </Button>
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
              <p className="text-sm text-green-400">{syncSuccess}</p>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSync} loading={syncLoading}>
                Sync Now
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleDisconnect}
                loading={disconnectLoading}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* iCal Import */}
      <Card>
        <CardHeader>
          <CardTitle>iCal Import</CardTitle>
          <CardDescription>
            Import events from an .ics file exported from any calendar app.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleIcsImport} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">
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
                'w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300',
                'file:mr-3 file:rounded file:border-0 file:bg-indigo-600 file:px-3 file:py-1 file:text-xs file:font-medium file:text-white',
                'hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500',
                'disabled:cursor-not-allowed disabled:opacity-50',
              ].join(' ')}
            />
            {icsError && (
              <p className="text-xs text-red-400" role="alert">
                {icsError}
              </p>
            )}
            {icsSuccess && (
              <p className="text-xs text-green-400">{icsSuccess}</p>
            )}
          </div>
          <Button
            type="submit"
            size="sm"
            loading={icsLoading}
            disabled={!icsFile}
          >
            Import
          </Button>
        </form>
      </Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Connected Services</CardTitle>
        <CardDescription>
          Manage the external services connected to your Whoami account.
        </CardDescription>
      </CardHeader>

      {connectionsError && (
        <p className="mb-4 text-sm text-red-400">{connectionsError}</p>
      )}

      <div className="divide-y divide-zinc-800">
        {/* Google Calendar row */}
        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div className="flex items-center gap-3">
            {/* Google icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-base font-bold text-white">
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
                    <span className="text-[10px] text-zinc-500">
                      Last synced {new Date(calStatus.lastSynced).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
              <Button
                size="sm"
                variant="danger"
                onClick={handleCalDisconnect}
                loading={disconnectLoading}
              >
                Disconnect
              </Button>
            ) : (
              <Button size="sm" onClick={handleCalConnect} loading={connectLoading}>
                Connect
              </Button>
            )}
          </div>
        </div>

        {/* Plaid / Bank row */}
        <div className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
          <div className="flex items-center gap-3">
            {/* Bank icon */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800">
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
    </Card>
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
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your account, security, and integrations.
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
              activeTab === tab.id
                ? 'border-b-2 border-indigo-500 text-indigo-400'
                : 'border-b-2 border-transparent text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
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
