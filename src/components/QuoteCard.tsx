import type { Quote } from '@/types/finance';
import { formatCompact, formatCurrency, formatPercent, toneClass } from '@/utils/formatters';

interface QuoteCardProps {
  quote: Quote;
  primary?: boolean;
}

/** Per-company snapshot used in the current-day view. */
export function QuoteCard({ quote, primary }: QuoteCardProps) {
  const tone = toneClass(quote.change);
  return (
    <article className={primary ? 'quote quote--primary' : 'quote'} aria-label={quote.name}>
      <header className="quote__header">
        <h3 className="quote__symbol">{quote.symbol}</h3>
        <span className="quote__name">{quote.name}</span>
      </header>
      <p className="quote__price">{formatCurrency(quote.price)}</p>
      <p className={`quote__change ${tone}`}>
        {quote.change >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(quote.change))} ({formatPercent(quote.changePercent)})
      </p>
      <dl className="quote__details">
        <div>
          <dt>Day range</dt>
          <dd>
            {formatCurrency(quote.dayLow)} – {formatCurrency(quote.dayHigh)}
          </dd>
        </div>
        <div>
          <dt>Volume</dt>
          <dd>{formatCompact(quote.volume)}</dd>
        </div>
      </dl>
    </article>
  );
}
