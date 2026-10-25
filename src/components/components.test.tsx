import { render, screen } from '@testing-library/react';
import { QuoteCard } from './QuoteCard';
import { StatCard } from './StatCard';
import { TrendTable } from './TrendTable';
import type { Quote } from '@/types/finance';
import type { TrendRow } from '@/utils/chartData';

const quote: Quote = {
  symbol: 'IBM',
  name: 'IBM',
  currency: 'USD',
  marketState: 'REGULAR',
  price: 253.56,
  previousClose: 252.11,
  change: -1.45,
  changePercent: -0.58,
  dayHigh: 254.71,
  dayLow: 247.03,
  volume: 5_845_665,
  updatedAt: '2026-10-23T20:00:03.000Z',
};

describe('StatCard', () => {
  it('shows direction with an arrow and sign, not just colour', () => {
    const { rerender } = render(<StatCard label="Return" value="X" deltaPercent={1.5} />);
    expect(screen.getByText(/▲ \+1\.50%/)).toHaveClass('positive');

    rerender(<StatCard label="Return" value="X" deltaPercent={-2} />);
    expect(screen.getByText(/▼ -2\.00%/)).toHaveClass('negative');
  });

  it('omits the delta when not provided', () => {
    render(<StatCard label="Companies" value="5" />);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});

describe('QuoteCard', () => {
  it('renders price, absolute and percent change, range and volume', () => {
    render(<QuoteCard quote={quote} primary />);
    const card = screen.getByRole('article', { name: 'IBM' });
    expect(card).toHaveClass('quote--primary');
    expect(card).toHaveTextContent('$253.56');
    expect(card).toHaveTextContent('▼ $1.45 (-0.58%)');
    expect(card).toHaveTextContent('$247.03 – $254.71');
    expect(card).toHaveTextContent('5.8M');
  });

  it('shows a "Featured" badge on the primary card', () => {
    render(<QuoteCard quote={quote} primary />);
    expect(screen.getByText('Featured')).toBeInTheDocument();
  });

  it('does not show a "Featured" badge on non-primary cards', () => {
    const peer = { ...quote, symbol: 'MSFT', name: 'Microsoft' };
    render(<QuoteCard quote={peer} />);
    expect(screen.queryByText('Featured')).not.toBeInTheDocument();
  });
});

describe('TrendTable', () => {
  const row = (symbol: string, name: string, returnPercent: number): TrendRow => ({
    symbol,
    name,
    summary: { start: 100, end: 100 + returnPercent, returnPercent, high: 120, low: 90, averageVolume: 1000 },
  });

  it('numbers rows in the given order and highlights IBM', () => {
    render(<TrendTable rows={[row('MSFT', 'Microsoft', 5), row('IBM', 'IBM', -2)]} />);
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent(/1\s*Microsoft MSFT/);
    expect(rows[2]).toHaveTextContent(/2\s*IBM IBM/);
    expect(rows[2]).toHaveClass('table__row--highlight');
    expect(rows[2]).toHaveTextContent('▼ -2.00%');
  });
});
