import { ChartCard } from '@/components/ChartCard';
import { Insight } from '@/components/Insight';
import { PriceLineChart } from '@/components/PriceLineChart';
import { QuoteCard } from '@/components/QuoteCard';
import { StatCard } from '@/components/StatCard';
import { PRIMARY_SYMBOL, VIEWS, getCompany } from '@/config/markets';
import { useHistories, useQuotes } from '@/hooks/useMarketData';
import { compareToPeers, describeComparison } from '@/utils/compare';
import { formatCurrency, formatMarketState, formatTimestamp } from '@/utils/formatters';

interface TodayViewProps {
  symbols: string[];
}

/** Current-day market summary: headline cards, one quote card per company, intraday comparison. */
export function TodayView({ symbols }: TodayViewProps) {
  const quotes = useQuotes(symbols);
  const histories = useHistories(symbols, 'today');

  const list = quotes.data ?? [];
  const primary = list.find((q) => q.symbol === PRIMARY_SYMBOL);
  const comparison = compareToPeers(
    Object.fromEntries(list.map((q) => [q.symbol, q.changePercent])),
    PRIMARY_SYMBOL,
  );
  const leader = [...list].sort((a, b) => b.changePercent - a.changePercent)[0];

  return (
    <>
      <ChartCard
        title="Market summary"
        subtitle={primary ? `${formatMarketState(primary.marketState)} · updated ${formatTimestamp(primary.updatedAt)}` : undefined}
        loading={quotes.loading}
        error={quotes.error}
      >
        {primary && (
          <>
            {comparison && (
              <Insight>{describeComparison(comparison, getCompany(PRIMARY_SYMBOL)?.name ?? PRIMARY_SYMBOL, VIEWS.today.period)}</Insight>
            )}
            <div className="stats">
              <StatCard label={`${primary.symbol} price`} value={formatCurrency(primary.price)} deltaPercent={primary.changePercent} />
              {comparison && (
                <StatCard label="Rank today" value={`#${comparison.rank} of ${comparison.peers + 1}`} note="by % change" />
              )}
              {leader && (
                <StatCard label="Top mover" value={leader.symbol} deltaPercent={leader.changePercent} />
              )}
              <StatCard label="Companies tracked" value={String(list.length)} />
            </div>
            <div className="quotes">
              {list.map((quote) => (
                <QuoteCard key={quote.symbol} quote={quote} primary={quote.symbol === PRIMARY_SYMBOL} />
              ))}
            </div>
          </>
        )}
      </ChartCard>

      <ChartCard
        title="Intraday performance"
        subtitle="% change since the first bar of the session"
        loading={histories.loading}
        error={histories.error}
      >
        {histories.data && <PriceLineChart histories={histories.data} range="today" />}
      </ChartCard>
    </>
  );
}
