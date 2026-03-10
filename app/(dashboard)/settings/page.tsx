'use client';

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";

interface SetupData {
  secret: string;
  qrCode: string;
  uri: string;
}

interface BackupCodesModalProps {
  codes: string[];
  onClose: () => void;
}

function BackupCodesModal({ codes, onClose }: BackupCodesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
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
              const text = codes.join("\n");
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

export default function SettingsPage() {
  const [email, setEmail] = useState<string>("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // 2FA enable flow
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [enableCode, setEnableCode] = useState("");
  const [enableLoading, setEnableLoading] = useState(false);
  const [enableError, setEnableError] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  // 2FA disable flow
  const [disableCode, setDisableCode] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState("");
  const [showDisable, setShowDisable] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session");
      if (response.ok) {
        const data = (await response.json()) as {
          user?: { email?: string; twoFactorEnabled?: boolean };
        };
        setEmail(data.user?.email ?? "");
      }
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  // Fetch current user status from next-auth session API
  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const handleSetup2FA = async () => {
    setSetupLoading(true);
    setEnableError("");
    try {
      const response = await fetch("/api/auth/2fa/setup");
      if (response.ok) {
        const data = (await response.json()) as SetupData;
        setSetupData(data);
      } else {
        setEnableError("Failed to generate QR code. Please try again.");
      }
    } catch {
      setEnableError("Something went wrong. Please try again.");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleEnable2FA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!setupData || !enableCode) return;

    setEnableLoading(true);
    setEnableError("");

    try {
      const response = await fetch("/api/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: setupData.secret, code: enableCode }),
      });

      const data = (await response.json()) as {
        error?: string;
        backupCodes?: string[];
      };

      if (!response.ok) {
        setEnableError(data.error ?? "Failed to enable 2FA. Please try again.");
        return;
      }

      setTwoFactorEnabled(true);
      setSetupData(null);
      setEnableCode("");
      if (data.backupCodes) {
        setBackupCodes(data.backupCodes);
      }
    } catch {
      setEnableError("Something went wrong. Please try again.");
    } finally {
      setEnableLoading(false);
    }
  };

  const handleDisable2FA = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!disableCode) return;

    setDisableLoading(true);
    setDisableError("");

    try {
      const response = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setDisableError(
          data.error ?? "Failed to disable 2FA. Please try again."
        );
        return;
      }

      setTwoFactorEnabled(false);
      setShowDisable(false);
      setDisableCode("");
    } catch {
      setDisableError("Something went wrong. Please try again.");
    } finally {
      setDisableLoading(false);
    }
  };

  if (loadingStatus) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-100">Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage your account security and preferences.
        </p>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
            {email ? email[0]?.toUpperCase() : "U"}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">{email || "—"}</p>
            <p className="text-xs text-zinc-500">Email address</p>
          </div>
        </div>
      </Card>

      {/* 2FA section */}
      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>
            Add an extra layer of security to your account.
          </CardDescription>
        </CardHeader>

        {twoFactorEnabled ? (
          /* 2FA is enabled */
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
                      setDisableCode(e.target.value.replace(/\D/g, ""))
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
                        setDisableCode("");
                        setDisableError("");
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
          /* 2FA is disabled */
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
                        setEnableCode(e.target.value.replace(/\D/g, ""))
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
                          setEnableCode("");
                          setEnableError("");
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

      {/* Backup codes modal */}
      {backupCodes && (
        <BackupCodesModal
          codes={backupCodes}
          onClose={() => setBackupCodes(null)}
        />
      )}
    </div>
  );
}
