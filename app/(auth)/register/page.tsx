'use client';

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema } from "@/src/lib/validations";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/src/components/ui/card";

type FieldErrors = Partial<
  Record<"name" | "email" | "password" | "confirmPassword", string>
>;

interface PasswordStrength {
  score: number; // 0–4
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

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const validate = useCallback((): boolean => {
    const result = registerSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });
    if (!result.success) {
      const errs = result.error.flatten().fieldErrors;
      setFieldErrors({
        name: errs.name?.[0],
        email: errs.email?.[0],
        password: errs.password?.[0],
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

      // Redirect to login with success indicator
      router.push("/login?registered=true");
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start building your personal OS today
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
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Alex Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={fieldErrors.name}
          disabled={loading}
          required
        />
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

        {/* Password with strength indicator */}
        <div className="flex flex-col gap-1.5">
          <Input
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            hint="Min 12 chars with uppercase, lowercase, number, and special character"
            disabled={loading}
            required
          />
          {password && (
            <div className="mt-1 flex flex-col gap-1">
              <div className="flex gap-1" aria-label={`Password strength: ${strength.label}`}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={[
                      "h-1 flex-1 rounded-full transition-colors duration-300",
                      strength.score >= level
                        ? strength.color
                        : "bg-zinc-700",
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
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
          disabled={loading}
          required
        />

        <Button
          type="submit"
          size="lg"
          loading={loading}
          className="mt-2 w-full"
        >
          {loading ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
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
