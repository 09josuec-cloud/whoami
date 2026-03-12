'use client';

interface SavingsGoalRow {
  id: string;
  name: string;
  emoji: string | null;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  targetDate: string | null;
  color: string;
}

interface SavingsChartProps {
  data: SavingsGoalRow[];
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}

export default function SavingsChart({ data }: SavingsChartProps) {
  return (
    <div className="rounded-2xl bg-[#0f0f12] p-5">
      <h2 className="text-lg font-semibold text-zinc-100 mb-4">Savings Goals</h2>
      {data.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-zinc-500 text-sm">
          No savings goals yet.
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((goal) => (
            <div key={goal.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {goal.emoji && <span className="text-lg leading-none">{goal.emoji}</span>}
                  <span className="text-sm font-medium text-zinc-200">{goal.name}</span>
                  {goal.targetDate && (
                    <span className="text-[10px] text-zinc-500">
                      Due{' '}
                      {new Date(goal.targetDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400">
                  {goal.progress.toFixed(1)}% &middot; {fmt(goal.currentAmount)} / {fmt(goal.targetAmount)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${goal.progress}%`,
                    backgroundColor: goal.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
