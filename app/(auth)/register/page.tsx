'use client';

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@/src/lib/validations";

type FieldErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword", string>
>;

// ── Password strength ──────────────────────────────────────────────────────
interface PasswordStrength {
  score: number; // 0–5
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
    { score: 0, label: "",            color: "" },
    { score: 1, label: "Very weak",   color: "bg-red-500" },
    { score: 2, label: "Weak",        color: "bg-orange-500" },
    { score: 3, label: "Fair",        color: "bg-yellow-500" },
    { score: 4, label: "Strong",      color: "bg-green-500" },
    { score: 5, label: "Very strong", color: "bg-emerald-500" },
  ];

  return levels[score] ?? levels[0];
}

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

// ── Page ───────────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();

  const [name, setName]                     = useState("");
  const [email, setEmail]                   = useState("");
  const [password, setPassword]             = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [fieldErrors, setFieldErrors]       = useState<FieldErrors>({});
  const [serverError, setServerError]       = useState("");
  const [loading, setLoading]               = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = useCallback((): boolean => {
    const result = registerSchema.safeParse({ name, email, password, confirmPassword });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setFieldErrors({
        name:            errs.name?.[0],
        email:           errs.email?.[0],
        password:        errs.password?.[0],
        confirmPassword: errs.confirmPassword?.[0],
      });
      return false;
    }
    setFieldErrors({});
    return true;
  }, [name, email, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setServerError(data.error ?? "Registration failed. Please try again.");
        return;
      }

      router.push("/login?registered=true");
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
        Create account
      </h1>
      <p className="mb-8 text-sm text-zinc-500">
        Start building your personal OS today
      </p>

      {/* Server error */}
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
        {/* Full name */}
        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-xs font-medium text-zinc-400"
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Alex Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
            className={inputClass}
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.name}</p>
          )}
        </div>

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
              autoComplete="new-password"
              placeholder="••••••••••••"
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

          {/* Strength meter */}
          {password && (
            <div className="mt-2.5">
              <div
                className="flex gap-1"
                aria-label={`Password strength: ${strength.label}`}
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={[
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      strength.score >= level ? strength.color : "bg-zinc-800",
                    ].join(" ")}
                  />
                ))}
              </div>
              {strength.label && (
                <p className="mt-1 text-xs text-zinc-500">{strength.label}</p>
              )}
            </div>
          )}

          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-400">{fieldErrors.password}</p>
          )}
          {!fieldErrors.password && (
            <p className="mt-1.5 text-[11px] text-zinc-600">
              Min 12 chars with uppercase, lowercase, number &amp; special character
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label
            htmlFor="confirmPassword"
            className="mb-1.5 block text-xs font-medium text-zinc-400"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className={`${inputClass} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff /> : <EyeOpen />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <p className="mt-1 text-xs text-red-400">
              {fieldErrors.confirmPassword}
            </p>
          )}
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
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>
      </form>

      {/* Footer link */}
      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
