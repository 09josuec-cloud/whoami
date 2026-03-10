'use client';

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { loginSchema } from "@/src/lib/validations";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";

type FieldErrors = Partial<Record<"email" | "password", string>>;

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

  const isVerified = searchParams.get("verified") === "true";
  const isRegistered = searchParams.get("registered") === "true";
  const isReset = searchParams.get("reset") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = useCallback((): boolean => {
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setFieldErrors({
        email: errs.email?.[0],
        password: errs.password?.[0],
      });
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
        setServerError("Invalid email or password. Please try again.");
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your Whoami account</CardDescription>
      </CardHeader>

      {isVerified && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Email verified! You can now sign in.
        </div>
      )}
      {isRegistered && !isVerified && (
        <div className="mb-4 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-300">
          Account created! Check your email to verify your address.
        </div>
      )}
      {isReset && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Password reset successfully. Sign in with your new password.
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={fieldErrors.email}
          disabled={loading}
          required
        />
        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            disabled={loading}
            required
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 hover:text-indigo-400 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="mt-2 w-full"
        >
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Create one
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your Whoami account</CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
