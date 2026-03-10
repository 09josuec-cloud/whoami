'use client';

import { forwardRef, InputHTMLAttributes, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = "", id, ...props }, ref) => {
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
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-zinc-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? "true" : undefined}
          className={[
            "w-full rounded-lg border bg-zinc-900 px-3 py-2 text-sm text-zinc-100",
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
        {hint && !error && (
          <p id={hintId} className="text-xs text-zinc-500">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-xs text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
