import { COMPANIES, MAX_TICKERS } from '@/config/markets';

interface CompanySelectorProps {
  selected: string[];
  onToggle: (symbol: string) => void;
  /** Symbol that cannot be deselected. */
  pinned?: string;
}

export function CompanySelector({ selected, onToggle, pinned = 'IBM' }: CompanySelectorProps) {
  const atLimit = selected.length >= MAX_TICKERS;
  return (
    <div className="chips" role="group" aria-label="Companies">
      {COMPANIES.map(({ symbol, name }) => {
        const active = selected.includes(symbol);
        return (
          <button
            key={symbol}
            className={active ? 'chip chip--active' : 'chip'}
            aria-pressed={active}
            disabled={symbol === pinned || (!active && atLimit)}
            onClick={() => onToggle(symbol)}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}
