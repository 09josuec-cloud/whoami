'use client';

import { useState } from 'react';
import Link from 'next/link';

const steps = [
  {
    id: 'welcome',
    title: "Welcome to whoami",
    subtitle: "Your personal OS is ready. Let's get you set up in 3 quick steps.",
    cta: "Let's go",
  },
  {
    id: 'journal',
    title: "Start your journal",
    subtitle: "Write your first entry — even just a few words. It starts your streak today.",
    cta: "Next",
    skip: "Skip",
    href: '/journal',
    linkLabel: "Open Journal →",
  },
  {
    id: 'habit',
    title: "Set a habit",
    subtitle: "Pick one thing you want to track daily. Sleep, exercise, water — anything.",
    cta: "Next",
    skip: "Skip",
    href: '/habits',
    linkLabel: "Open Habits →",
  },
  {
    id: 'budget',
    title: "Track your finances",
    subtitle: "Connect your bank account or browse your budget manually. See your full financial picture.",
    cta: "Next",
    skip: "Skip",
    href: '/budget',
    linkLabel: "Open Budget →",
  },
  {
    id: 'done',
    title: "You're all set!",
    subtitle: "Everything is ready. Explore your dashboard and fill it in at your own pace.",
    cta: "Go to dashboard",
  },
];

const stepIcons = [
  <svg key="welcome" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
  </svg>,
  <svg key="journal" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>,
  <svg key="habit" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>,
  <svg key="budget" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 12m18 0v6a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 9m18 0V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v3" />
  </svg>,
  <svg key="done" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>,
];

const iconColors = [
  'text-indigo-400 bg-indigo-500/10',
  'text-violet-400 bg-violet-500/10',
  'text-rose-400 bg-rose-500/10',
  'text-emerald-400 bg-emerald-500/10',
  'text-indigo-400 bg-indigo-500/10',
];

interface OnboardingWizardProps {
  firstName: string;
  onComplete: () => void;
}

export default function OnboardingWizard({ firstName, onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const current = steps[step];

  const advance = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const progressPct = (step / (steps.length - 1)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/[0.08]"
        style={{ background: 'linear-gradient(135deg, rgba(20,18,50,0.97) 0%, #111114 60%, rgba(30,12,60,0.97) 100%)' }}
      >
        {/* Progress bar */}
        <div className="h-0.5 bg-white/[0.05]">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <div className="px-8 py-10">
          {/* Step dots */}
          <div className="mb-8 flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={[
                  'h-1.5 rounded-full transition-all duration-300',
                  i === step ? 'w-6 bg-indigo-400' : i < step ? 'w-3 bg-indigo-600' : 'w-3 bg-white/[0.1]',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl ${iconColors[step]}`}>
            {stepIcons[step]}
          </div>

          {/* Text */}
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-100">
            {step === 0 ? `Hey ${firstName}! 👋` : current.title}
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-zinc-400">
            {current.subtitle}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={advance}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 active:bg-indigo-700 transition-colors"
            >
              {current.cta}
            </button>

            {'linkLabel' in current && current.href && (
              <Link
                href={current.href}
                onClick={onComplete}
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] py-3 text-sm font-medium text-zinc-300 hover:bg-white/[0.07] transition-colors text-center"
              >
                {current.linkLabel}
              </Link>
            )}

            {current.skip && (
              <button
                onClick={advance}
                className="w-full py-2 text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
              >
                {current.skip}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
