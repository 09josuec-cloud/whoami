'use client';

export interface Insight {
  id: string;
  type: 'positive' | 'warning' | 'neutral';
  category: 'finance' | 'journal' | 'mood' | 'goals' | 'reminders';
  title: string;
  description: string;
  metric?: string;
}

function TrendUpIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}

const TYPE_STYLES = {
  positive: {
    icon: <CheckIcon />,
    iconBg: 'bg-emerald-500/10 text-emerald-400',
    metric: 'text-emerald-400',
    border: 'border-emerald-500/10',
  },
  warning: {
    icon: <AlertIcon />,
    iconBg: 'bg-amber-500/10 text-amber-400',
    metric: 'text-amber-400',
    border: 'border-amber-500/10',
  },
  neutral: {
    icon: <InfoIcon />,
    iconBg: 'bg-indigo-500/10 text-indigo-400',
    metric: 'text-indigo-400',
    border: 'border-white/[0.06]',
  },
};

function InsightCard({ insight }: { insight: Insight }) {
  const style = TYPE_STYLES[insight.type];

  return (
    <div className={`rounded-xl bg-[#111114] border ${style.border} p-4 flex flex-col gap-3 min-w-0`}>
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${style.iconBg}`}>
          {style.icon}
        </div>
        {insight.metric && (
          <span className={`shrink-0 text-sm font-semibold tabular-nums ${style.metric}`}>
            {insight.metric}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-zinc-100">{insight.title}</p>
        <p className="mt-1 text-xs text-zinc-500 leading-relaxed">{insight.description}</p>
      </div>
    </div>
  );
}

export default function InsightsPanel({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) {
    return (
      <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-6 text-center">
        <p className="text-sm text-zinc-500">No insights yet — add more data across modules to unlock personalized observations.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Insights</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Patterns and observations from your data</p>
        </div>
        <span className="rounded-md bg-white/[0.04] px-2 py-1 text-xs text-zinc-500 tabular-nums">
          {insights.length} insight{insights.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>
    </div>
  );
}
