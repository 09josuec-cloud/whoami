'use client';

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";

export default function VerifyEmailPage() {
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setError("");
    setResent(false);

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
      });

      if (response.ok) {
        setResent(true);
      } else {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Failed to resend. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Check your email</CardTitle>
        <CardDescription>
          We&apos;ve sent a verification link to your email address.
        </CardDescription>
      </CardHeader>

      <div className="flex flex-col gap-4">
        {/* Mail icon */}
        <div className="flex justify-center py-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/10">
            <svg
              className="h-8 w-8 text-indigo-400"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
              />
            </svg>
          </div>
        </div>

        <p className="text-center text-sm text-zinc-400">
          Click the link in the email to verify your account. If you don&apos;t
          see it, check your spam folder.
        </p>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            {error}
          </div>
        )}

        {resent && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
            Verification email resent! Check your inbox.
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          loading={loading}
          onClick={handleResend}
          className="w-full"
        >
          {loading ? "Sending…" : "Resend verification email"}
        </Button>
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already verified?{" "}
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
