'use client';

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address"),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const result = emailSchema.safeParse({ email });
    if (!result.success) {
      setEmailError(result.error.flatten().fieldErrors.email?.[0] ?? "");
      return;
    }
    setEmailError("");

    setLoading(true);
    setServerError("");

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always show success regardless of response — never reveal email existence
      setSubmitted(true);
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If that email exists, a reset link has been sent.
          </CardDescription>
        </CardHeader>

        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-300">
          We sent a password reset link to <strong>{email}</strong>. The link
          expires in 1 hour.
        </div>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Didn&apos;t receive it?{" "}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Try again
          </button>
        </p>

        <p className="mt-3 text-center text-sm text-zinc-500">
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

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Forgot your password?</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a reset link.
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
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={emailError}
          disabled={loading}
          required
        />

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="mt-2 w-full"
        >
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </Card>
  );
}
