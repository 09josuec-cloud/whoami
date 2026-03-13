'use client';

interface AccountRow {
  name: string;
  type: string;
  balance: number;
  isLiability?: boolean;
}

interface NetWorthCardProps {
  current: number;
  accounts: AccountRow[];
  savingsTotal: number;
  savingsTarget: number;
  assets?: number;
  liabilities?: number;
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtFull(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

const TYPE_COLORS: Record<string, string> = {
  depository: 'bg-emerald-500/20 text-emerald-400',
  credit: 'bg-rose-500/20 text-rose-400',
  investment: 'bg-indigo-500/20 text-indigo-400',
  loan: 'bg-amber-500/20 text-amber-400',
  other: 'bg-zinc-700 text-zinc-400',
};

export default function NetWorthCard({
  current,
  accounts,
  savingsTotal,
  savingsTarget,
  assets = 0,
  liabilities = 0,
}: NetWorthCardProps) {
  const savingsPct =
    savingsTarget > 0 ? Math.min(Math.round((savingsTotal / savingsTarget) * 100), 100) : 0;

  const assetAccounts = accounts.filter((a) => !a.isLiability);
  const liabilityAccounts = accounts.filter((a) => a.isLiability);

  return (
    <div className="rounded-xl bg-[#111114] border border-white/[0.06] p-5">
      <h2 className="text-sm font-medium text-zinc-500 mb-1">Net Worth</h2>
      <p className={['text-4xl font-semibold tabular-nums tracking-tight mb-2', current >= 0 ? 'text-zinc-100' : 'text-rose-400'].join(' ')}>
        {current < 0 ? '-' : ''}{fmt(Math.abs(current))}
      </p>

      {/* Assets / Liabilities summary */}
      {accounts.length > 0 && liabilities > 0 && (
        <div className="mb-4 flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 shrink-0" />
            Assets <span className="font-medium text-emerald-400">{fmt(assets)}</span>
          </span>
          <span className="text-zinc-700">−</span>
          <span className="flex items-center gap-1 text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500/60 shrink-0" />
            Debt <span className="font-medium text-rose-400">{fmt(liabilities)}</span>
          </span>
        </div>
      )}

      {accounts.length > 0 ? (
        <div className="space-y-3 mb-5">
          {assetAccounts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1.5">Assets</p>
              <div className="space-y-1.5">
                {assetAccounts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={['rounded-md px-1.5 py-0.5 text-xs font-medium capitalize', TYPE_COLORS[a.type] ?? TYPE_COLORS['other']].join(' ')}>{a.type}</span>
                      <span className="text-sm text-zinc-300 truncate max-w-[130px]">{a.name}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-zinc-200">{fmtFull(a.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {liabilityAccounts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-zinc-600 mb-1.5">Liabilities</p>
              <div className="space-y-1.5">
                {liabilityAccounts.map((a, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={['rounded-md px-1.5 py-0.5 text-xs font-medium capitalize', TYPE_COLORS[a.type] ?? TYPE_COLORS['other']].join(' ')}>{a.type}</span>
                      <span className="text-sm text-zinc-300 truncate max-w-[130px]">{a.name}</span>
                    </div>
                    <span className="text-sm font-medium tabular-nums text-rose-400">−{fmtFull(a.balance)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-500 mb-5">No bank accounts connected yet.</p>
      )}

      {savingsTarget > 0 && (
        <div className="border-t border-white/[0.06] pt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-500">
              Savings goals
            </p>
            <span className="text-xs text-zinc-400 tabular-nums">
              {fmtFull(savingsTotal)} / {fmtFull(savingsTarget)}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all"
              style={{ width: `${savingsPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{savingsPct}% of total goal target saved</p>
        </div>
      )}
    </div>
  );
}
