import { useState } from 'react';
import { CompanySelector } from '@/components/CompanySelector';
import { ViewTabs } from '@/components/ViewTabs';
import { COMPANIES, PRIMARY_SYMBOL } from '@/config/markets';
import { DATA_PROVIDER } from '@/config/constants';
import type { ViewRange } from '@/types/finance';
import { TodayView } from '@/views/TodayView';
import { TrendView } from '@/views/TrendView';

export function DashboardPage() {
  const [view, setView] = useState<ViewRange>('today');
  const [selected, setSelected] = useState<string[]>(COMPANIES.map((c) => c.symbol));

  const toggle = (symbol: string) =>
    setSelected((prev) => (prev.includes(symbol) ? prev.filter((s) => s !== symbol) : [...prev, symbol]));

  return (
    <main className="dashboard">
      <header className="dashboard__header">
        <h1>IBM Market Dashboard</h1>
        <ViewTabs value={view} onChange={setView} />
      </header>

      <CompanySelector selected={selected} onToggle={toggle} pinned={PRIMARY_SYMBOL} />

      {view === 'today' ? <TodayView symbols={selected} /> : <TrendView symbols={selected} range={view} />}

      <footer className="disclaimer">
        {DATA_PROVIDER === 'mock' ? 'Sample data for demonstration. ' : 'Source: Yahoo Finance, may be delayed. '}
        Not investment advice.
      </footer>
    </main>
  );
}
