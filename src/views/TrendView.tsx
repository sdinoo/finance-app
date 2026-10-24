import { useMemo } from 'react';
import { ChartCard } from '@/components/ChartCard';
import { Insight } from '@/components/Insight';
import { PriceLineChart } from '@/components/PriceLineChart';
import { ReturnBarChart } from '@/components/ReturnBarChart';
import { StatCard } from '@/components/StatCard';
import { TrendTable } from '@/components/TrendTable';
import { PRIMARY_SYMBOL, VIEWS, getCompany } from '@/config/markets';
import { useHistories } from '@/hooks/useMarketData';
import type { ViewRange } from '@/types/finance';
import { buildTrendRows } from '@/utils/chartData';
import { compareToPeers, describeComparison } from '@/utils/compare';

interface TrendViewProps {
  symbols: string[];
  /** 'week' or 'quarter'; the layout is identical, only the data window differs. */
  range: Exclude<ViewRange, 'today'>;
}

/** Multi-day comparison: performance chart, return ranking, and a sortable-by-return summary table. */
export function TrendView({ symbols, range }: TrendViewProps) {
  const histories = useHistories(symbols, range);
  const view = VIEWS[range];

  const rows = useMemo(() => (histories.data ? buildTrendRows(histories.data) : []), [histories.data]);
  const comparison = compareToPeers(
    Object.fromEntries(rows.map((r) => [r.symbol, r.summary.returnPercent])),
    PRIMARY_SYMBOL,
  );
  const primary = rows.find((r) => r.symbol === PRIMARY_SYMBOL);
  const best = rows[0];
  const worst = rows[rows.length - 1];

  return (
    <>
      <ChartCard title={`${view.label} summary`} loading={histories.loading} error={histories.error}>
        {primary && (
          <>
            {comparison && (
              <Insight>{describeComparison(comparison, getCompany(PRIMARY_SYMBOL)?.name ?? PRIMARY_SYMBOL, view.period)}</Insight>
            )}
            <div className="stats">
              <StatCard label={`${primary.symbol} return`} value={`${primary.summary.start.toFixed(2)} → ${primary.summary.end.toFixed(2)}`} deltaPercent={primary.summary.returnPercent} />
              {comparison && <StatCard label="Rank" value={`#${comparison.rank} of ${comparison.peers + 1}`} note="by return" />}
              {best && <StatCard label="Best performer" value={best.symbol} deltaPercent={best.summary.returnPercent} />}
              {worst && <StatCard label="Weakest performer" value={worst.symbol} deltaPercent={worst.summary.returnPercent} />}
            </div>
          </>
        )}
      </ChartCard>

      <ChartCard
        title="Performance comparison"
        subtitle="% change from the start of the period"
        loading={histories.loading}
        error={histories.error}
      >
        {histories.data && <PriceLineChart histories={histories.data} range={range} />}
      </ChartCard>

      <div className="split">
        <ChartCard title="Return ranking" loading={histories.loading} error={histories.error}>
          <ReturnBarChart rows={rows} />
        </ChartCard>
        <ChartCard title="Details" loading={histories.loading} error={histories.error}>
          <TrendTable rows={rows} />
        </ChartCard>
      </div>
    </>
  );
}
