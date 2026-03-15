'use client';

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { loginSchema } from "@/src/lib/validations";

type FieldErrors = Partial<Record<"email" | "password", string>>;

// ── Eye icons ──────────────────────────────────────────────────────────────
function EyeOpen() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
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
  );
}

// ── Main form ──────────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawCallback = searchParams.get("callbackUrl");
  const decoded = rawCallback ? decodeURIComponent(rawCallback) : null;
  // Only allow safe relative paths — reject "//" (open redirect), external URLs, etc.
  const callbackUrl =
    decoded && decoded.startsWith("/") && !decoded.startsWith("//")
      ? decoded
      : "/dashboard";

  const isVerified  = searchParams.get("verified")   === "true";
  const isRegistered = searchParams.get("registered") === "true";
  const isReset     = searchParams.get("reset")       === "true";

  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading]         = useState(false);

  const validate = useCallback((): boolean => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setFieldErrors({ email: errs.email?.[0], password: errs.password?.[0] });
      return false;
    }
    setFieldErrors({});
    return true;
  }, [email, password]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.code === "email_not_verified") {
          setServerError("Please verify your email before signing in. Check your inbox for the verification link.");
        } else {
          setServerError("Invalid email or password. Please try again.");
        }
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-xl bg-white/[0.06] border border-white/[0.08] px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-colors disabled:opacity-50";

  return (
    <div className="w-full">
      {/* Heading */}
      <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-zinc-100">
        Welcome back
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Sign in to continue to Whoami
      </p>

      {/* Status banners */}
      {isVerified && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-green-500/20 bg-green-500/[0.08] px-4 py-3 text-sm text-green-400">
          <span className="mt-px text-green-400">&#10003;</span>
          Email verified! You can now sign in.
        </div>
      )}
      {isRegistered && !isVerified && (
        <div className="mb-5 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.08] px-4 py-3 text-sm text-indigo-300">
          Account created! Check your email to verify your address.
        </div>
      )}
      {isReset && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-green-500/20 bg-green-500/[0.08] px-4 py-3 text-sm text-green-400">
          <span className="mt-px text-green-400">&#10003;</span>
          Password reset successfully. Sign in with your new password.
        </div>
      )}
      {serverError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-400"
        >
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-medium text-zinc-400"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className={inputClass}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium text-zinc-400"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
          )}
          <div className="mt-2 flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Spinner />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}

// ── Page export ────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full">
          <h1 className="mb-1.5 text-2xl font-bold tracking-tight text-zinc-100">
            Welcome back
          </h1>
          <p className="mb-8 text-sm text-zinc-500">Sign in to continue to Whoami</p>
          <div className="flex flex-col gap-5">
            <div className="h-[58px] rounded-xl bg-white/[0.04] animate-pulse" />
            <div className="h-[58px] rounded-xl bg-white/[0.04] animate-pulse" />
            <div className="mt-1 h-[46px] rounded-xl bg-indigo-600/30 animate-pulse" />
          </div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
