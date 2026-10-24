import { ChartCard } from '@/components/ChartCard';
import { PriceLineChart } from '@/components/PriceLineChart';
import { StatCard } from '@/components/StatCard';
import { VIEWS } from '@/config/markets';
import { useHistory } from '@/hooks/useMarketData';
import type { ViewRange } from '@/types/finance';
import { summarizeHistory } from '@/utils/metrics';

interface CustomCompanyViewProps {
  symbol: string;
  range: ViewRange;
}

/** One extra card charting a user-entered company for the active range; independent of the main views. */
export function CustomCompanyView({ symbol, range }: CustomCompanyViewProps) {
  const history = useHistory(symbol, range);
  const summary = history.data ? summarizeHistory(history.data) : undefined;

  return (
    <ChartCard
      title={`Custom company: ${symbol}`}
      subtitle={`% change from the start of the period · ${VIEWS[range].label}`}
      loading={history.loading}
      error={history.error}
    >
      {history.data && summary && (
        <>
          <div className="stats">
            <StatCard
              label={`${symbol} return`}
              value={`${summary.start.toFixed(2)} → ${summary.end.toFixed(2)}`}
              deltaPercent={summary.returnPercent}
            />
          </div>
          <PriceLineChart histories={{ [symbol]: history.data }} range={range} highlight={symbol} />
        </>
      )}
    </ChartCard>
  );
}
