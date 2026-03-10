'use client';

import { useState, useMemo, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
}

function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", color: "" };

  let score = 0;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels: PasswordStrength[] = [
    { score: 0, label: "", color: "" },
    { score: 1, label: "Very weak", color: "bg-red-500" },
    { score: 2, label: "Weak", color: "bg-orange-500" },
    { score: 3, label: "Fair", color: "bg-yellow-500" },
    { score: 4, label: "Strong", color: "bg-green-500" },
    { score: 5, label: "Very strong", color: "bg-emerald-500" },
  ];

  return levels[score] ?? levels[0];
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [linkExpired, setLinkExpired] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = useCallback((): boolean => {
    const newErrors: { password?: string; confirmPassword?: string } = {};

    if (password.length < 12) {
      newErrors.password = "Password must be at least 12 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = "Password must contain at least one uppercase letter";
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = "Password must contain at least one lowercase letter";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one special character";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [password, confirmPassword]);

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>This reset link is missing a token.</CardDescription>
        </CardHeader>
        <p className="mt-2 text-center text-sm text-zinc-500">
          <Link
            href="/forgot-password"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Request a new reset link
          </Link>
        </p>
      </Card>
    );
  }

  if (linkExpired) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Link expired or invalid</CardTitle>
          <CardDescription>
            This password reset link has expired or is invalid.
          </CardDescription>
        </CardHeader>
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          Reset links expire after 1 hour. Please request a new one.
        </div>
        <p className="mt-2 text-center text-sm text-zinc-500">
          <Link
            href="/forgot-password"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Request a new reset link
          </Link>
        </p>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Password reset!</CardTitle>
          <CardDescription>
            Your password has been changed successfully.
          </CardDescription>
        </CardHeader>
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          You can now sign in with your new password.
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link
            href="/login"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Go to sign in
          </Link>
        </p>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        if (response.status === 400) {
          setLinkExpired(true);
        } else {
          setServerError(data.error ?? "Something went wrong. Please try again.");
        }
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login?reset=true"), 2000);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Set new password</CardTitle>
        <CardDescription>
          Choose a strong password for your account.
        </CardDescription>
      </CardHeader>

      {serverError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="Min 12 chars with uppercase, lowercase, number, and special character"
            disabled={loading}
            required
          />
          {password && (
            <div className="mt-1 flex flex-col gap-1">
              <div
                className="flex gap-1"
                aria-label={`Password strength: ${strength.label}`}
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={[
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      strength.score >= level ? strength.color : "bg-zinc-700",
                    ].join(" ")}
                  />
                ))}
              </div>
              {strength.label && (
                <span className="text-xs text-zinc-500">{strength.label}</span>
              )}
            </div>
          )}
        </div>

        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          disabled={loading}
          required
        />

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="mt-2 w-full"
        >
          {loading ? "Resetting…" : "Reset password"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link
          href="/login"
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading…</CardTitle>
          </CardHeader>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
