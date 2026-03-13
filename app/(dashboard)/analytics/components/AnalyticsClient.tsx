'use client';

import { useState, useEffect } from 'react';
import OverviewCards from './OverviewCards';
import SpendingChart from './SpendingChart';
import MoodChart from './MoodChart';
import JournalFrequencyChart from './JournalFrequencyChart';
import BudgetChart from './BudgetChart';
import SavingsChart from './SavingsChart';
import NetWorthCard from './NetWorthCard';
import InsightsPanel from './InsightsPanel';
import CashFlowChart from './CashFlowChart';
import type { Insight } from './InsightsPanel';
import type { CashFlowMonth } from './CashFlowChart';

// ---- Types ----

interface OverviewData {
  totalSpentThisMonth: number;
  avgMoodThisMonth: number | null;
  journalEntriesThisMonth: number;
  netWorth: number;
  journalStreak: number;
  upcomingReminders: number;
}

interface MonthRow {
  month: string;
  [category: string]: string | number;
}

interface SpendingData {
  data: MonthRow[];
  categories: string[];
}

interface AccountRow {
  name: string;
  type: string;
  balance: number;
}

interface NetWorthData {
  current: number;
  accounts: AccountRow[];
  savingsTotal: number;
  savingsTarget: number;
}

interface MoodDataPoint {
  date: string;
  mood: number;
}

interface MoodData {
  data: MoodDataPoint[];
  avgMood: number | null;
  bestDay: string | null;
  worstDay: string | null;
}

interface WeekDataPoint {
  week: string;
  count: number;
}

interface JournalData {
  data: WeekDataPoint[];
  totalEntries: number;
  avgPerWeek: number;
  longestStreak: number;
}

interface BudgetRow {
  category: string;
  budget: number;
  actual: number;
  over: boolean;
}

interface BudgetData {
  data: BudgetRow[];
  month: number;
  year: number;
}

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

interface SavingsData {
  data: SavingsGoalRow[];
}

interface AllData {
  overview: OverviewData;
  spending: SpendingData;
  netWorth: NetWorthData;
  mood: MoodData;
  journal: JournalData;
  budget: BudgetData;
  savings: SavingsData;
  insights: Insight[];
  cashflow: CashFlowMonth[];
}

// ---- Skeleton ----

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/[0.04] ${className ?? ''}`} />;
}

function LoadingSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">
      <div>
        <Skeleton className="h-7 w-36" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <Skeleton className="h-36" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

// ---- Main Component ----

export default function AnalyticsClient() {
  const [allData, setAllData] = useState<AllData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const [
          overviewRes,
          spendingRes,
          netWorthRes,
          moodRes,
          journalRes,
          budgetRes,
          savingsRes,
          insightsRes,
          cashflowRes,
        ] = await Promise.all([
          fetch('/api/analytics/overview'),
          fetch('/api/analytics/spending'),
          fetch('/api/analytics/net-worth'),
          fetch('/api/analytics/mood'),
          fetch('/api/analytics/journal'),
          fetch('/api/analytics/budget'),
          fetch('/api/analytics/savings'),
          fetch('/api/analytics/insights'),
          fetch('/api/analytics/cashflow'),
        ]);

        const now = new Date();
        const nowMonth = now.getMonth() + 1;
        const nowYear = now.getFullYear();

        const overview = overviewRes.ok
          ? ((await overviewRes.json()) as OverviewData)
          : ({ totalSpentThisMonth: 0, avgMoodThisMonth: null, journalEntriesThisMonth: 0, netWorth: 0, journalStreak: 0, upcomingReminders: 0 } satisfies OverviewData);

        const spending = spendingRes.ok
          ? ((await spendingRes.json()) as SpendingData)
          : ({ data: [], categories: [] } satisfies SpendingData);

        const netWorth = netWorthRes.ok
          ? ((await netWorthRes.json()) as NetWorthData)
          : ({ current: 0, accounts: [], savingsTotal: 0, savingsTarget: 0 } satisfies NetWorthData);

        const mood = moodRes.ok
          ? ((await moodRes.json()) as MoodData)
          : ({ data: [], avgMood: null, bestDay: null, worstDay: null } satisfies MoodData);

        const journal = journalRes.ok
          ? ((await journalRes.json()) as JournalData)
          : ({ data: [], totalEntries: 0, avgPerWeek: 0, longestStreak: 0 } satisfies JournalData);

        const budget = budgetRes.ok
          ? ((await budgetRes.json()) as BudgetData)
          : ({ data: [], month: nowMonth, year: nowYear } satisfies BudgetData);

        const savings = savingsRes.ok
          ? ((await savingsRes.json()) as SavingsData)
          : ({ data: [] } satisfies SavingsData);

        const insightsData = insightsRes.ok
          ? ((await insightsRes.json()) as { insights: Insight[] })
          : { insights: [] };

        const cashflowData = cashflowRes.ok
          ? ((await cashflowRes.json()) as { data: CashFlowMonth[] })
          : { data: [] };

        setAllData({
          overview,
          spending,
          netWorth,
          mood,
          journal,
          budget,
          savings,
          insights: insightsData.insights,
          cashflow: cashflowData.data,
        });
      } catch (err) {
        console.error('[Analytics] fetch error:', err);
        setError('Failed to load analytics data. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    void fetchAll();
  }, []);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="rounded-xl border border-rose-800/30 bg-rose-950/10 p-6 text-center">
          <p className="text-rose-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs text-zinc-400 hover:text-zinc-200 underline"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }

  if (!allData) return null;

  const { overview, spending, netWorth, mood, journal, budget, savings, insights, cashflow } = allData;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Your personal life stats — spending, mood, journaling, and savings.
        </p>
      </div>

      {/* Overview stat cards */}
      <OverviewCards data={overview} />

      {/* Insights */}
      <InsightsPanel insights={insights} />

      {/* Cash Flow + Spending */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CashFlowChart data={cashflow} />
        <SpendingChart data={spending.data} categories={spending.categories} />
      </div>

      {/* Mood + Journal */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <MoodChart
          data={mood.data}
          avgMood={mood.avgMood}
          bestDay={mood.bestDay}
          worstDay={mood.worstDay}
        />
        <JournalFrequencyChart
          data={journal.data}
          totalEntries={journal.totalEntries}
          avgPerWeek={journal.avgPerWeek}
          longestStreak={journal.longestStreak}
        />
      </div>

      {/* Budget + Savings + Net Worth */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 grid grid-cols-1 gap-4">
          <BudgetChart data={budget.data} month={budget.month} year={budget.year} />
          <SavingsChart data={savings.data} />
        </div>
        <NetWorthCard
          current={netWorth.current}
          accounts={netWorth.accounts}
          savingsTotal={netWorth.savingsTotal}
          savingsTarget={netWorth.savingsTarget}
        />
      </div>

    </div>
  );
}
