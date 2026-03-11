'use client';

import { useState, forwardRef, InputHTMLAttributes, useId } from "react";

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  hint?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    const describedBy = [error ? errorId : null, hint ? hintId : null]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-zinc-300">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={show ? "text" : "password"}
            aria-describedby={describedBy || undefined}
            aria-invalid={error ? "true" : undefined}
            className={[
              "w-full rounded-lg border bg-zinc-900 px-3 py-2 pr-10 text-sm text-zinc-100",
              "placeholder:text-zinc-500",
              "transition-colors duration-150",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-zinc-700 hover:border-zinc-600",
              "disabled:cursor-not-allowed disabled:opacity-50",
              className,
            ].join(" ")}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {show ? (
              // Eye-off icon
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              // Eye icon
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        </div>
        {hint && !error && (
          <p id={hintId} className="text-xs text-zinc-500">{hint}</p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-red-400" role="alert">{error}</p>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
