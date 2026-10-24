import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockProvider } from '@/services/mockProvider';
import { MarketDataError } from '@/services/types';
import { DashboardPage } from './DashboardPage';

// jsdom has no layout, so Recharts cannot size itself; expose which series each chart receives instead.
vi.mock('@/components/PriceLineChart', () => ({
  PriceLineChart: ({ histories, range }: { histories: Record<string, unknown>; range: string }) => (
    <div data-testid={`line-chart-${range}`}>{Object.keys(histories).join(',')}</div>
  ),
}));
vi.mock('@/components/ReturnBarChart', () => ({
  ReturnBarChart: () => <div data-testid="return-chart" />,
}));

afterEach(() => vi.restoreAllMocks());

async function show(symbol: string) {
  await userEvent.type(screen.getByLabelText('Chart another company'), symbol);
  await userEvent.click(screen.getByRole('button', { name: 'Show graph' }));
}

describe('custom company graph', () => {
  it('adds a card for a user-entered company and keeps the existing dashboard', async () => {
    render(<DashboardPage />);
    await screen.findByRole('article', { name: 'IBM' });

    await show(' aapl ');

    const card = await screen.findByRole('region', { name: 'Custom company: AAPL' });
    expect(card).toHaveTextContent('AAPL return');
    expect(await screen.findByRole('region', { name: 'Market summary' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByRole('button', { name: 'IBM' })).toBeDisabled();
    expect(screen.getByRole('note')).toHaveTextContent(/IBM is .* today/);
  });

  it('shows a loading state while data is retrieved', async () => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    const real = mockProvider.getHistory;
    vi.spyOn(mockProvider, 'getHistory').mockImplementation(async (symbol, range) => {
      if (symbol === 'AAPL') await gate;
      return real(symbol, range);
    });

    render(<DashboardPage />);
    await show('AAPL');

    const card = await screen.findByRole('region', { name: 'Custom company: AAPL' });
    expect(card).toHaveTextContent('Loading…');
    release();
    expect(await screen.findByText('AAPL return')).toBeInTheDocument();
  });

  it('rejects malformed input without charting anything', async () => {
    render(<DashboardPage />);
    await show('12!');

    expect(screen.getByRole('alert')).toHaveTextContent(/1-5 letters/);
    expect(screen.queryByRole('region', { name: /Custom company/ })).not.toBeInTheDocument();
  });

  it('rejects a company that is already tracked', async () => {
    render(<DashboardPage />);
    await show('msft');

    expect(screen.getByRole('alert')).toHaveTextContent('MSFT is already shown');
    expect(screen.queryByRole('region', { name: /Custom company/ })).not.toBeInTheDocument();
  });

  it('shows a not-found error in the card while the main dashboard keeps working', async () => {
    render(<DashboardPage />);
    await show('ZZZZ');

    const card = await screen.findByRole('region', { name: 'Custom company: ZZZZ' });
    expect(await within(card).findByRole('alert')).toHaveTextContent('No market data found for ZZZZ');
    expect(await screen.findByRole('region', { name: 'Market summary' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(5);
  });

  it('distinguishes a provider outage from an unknown symbol', async () => {
    const real = mockProvider.getHistory;
    vi.spyOn(mockProvider, 'getHistory').mockImplementation(async (symbol, range) => {
      if (symbol === 'AAPL') throw new MarketDataError('Request failed: 502', 502);
      return real(symbol, range);
    });

    render(<DashboardPage />);
    await show('AAPL');

    const card = await screen.findByRole('region', { name: 'Custom company: AAPL' });
    expect(await within(card).findByRole('alert')).toHaveTextContent(/unavailable right now/);
    expect(await screen.findByRole('region', { name: 'Market summary' })).toBeInTheDocument();
  });

  it('follows the active tab and charts only the custom symbol', async () => {
    render(<DashboardPage />);
    await show('AAPL');
    const today = await screen.findByRole('region', { name: 'Custom company: AAPL' });
    expect(await within(today).findByTestId('line-chart-today')).toHaveTextContent(/^AAPL$/);

    await userEvent.click(screen.getByRole('tab', { name: 'Last Quarter' }));

    const quarter = await screen.findByRole('region', { name: 'Custom company: AAPL' });
    expect(await within(quarter).findByTestId('line-chart-quarter')).toHaveTextContent(/^AAPL$/);
    expect(await screen.findByRole('region', { name: 'Last Quarter summary' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('removes the card with Clear', async () => {
    render(<DashboardPage />);
    await show('AAPL');
    await screen.findByRole('region', { name: 'Custom company: AAPL' });

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByRole('region', { name: /Custom company/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Market summary' })).toBeInTheDocument();
  });

  it('replaces the card when a different symbol is submitted', async () => {
    render(<DashboardPage />);
    await show('AAPL');
    await screen.findByRole('region', { name: 'Custom company: AAPL' });

    await userEvent.clear(screen.getByLabelText('Chart another company'));
    await show('nvda');

    expect(await screen.findByRole('region', { name: 'Custom company: NVDA' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Custom company: AAPL' })).not.toBeInTheDocument();
  });
});
