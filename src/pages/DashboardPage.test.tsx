import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';

// jsdom has no layout, so Recharts cannot size itself; chart rendering is not under test here.
vi.mock('@/components/PriceLineChart', () => ({
  PriceLineChart: ({ range }: { range: string }) => <div data-testid={`line-chart-${range}`} />,
}));
vi.mock('@/components/ReturnBarChart', () => ({
  ReturnBarChart: () => <div data-testid="return-chart" />,
}));

describe('DashboardPage', () => {
  it('opens on the current-day summary with a card per company', async () => {
    render(<DashboardPage />);

    expect(await screen.findByRole('region', { name: 'Market summary' })).toBeInTheDocument();
    for (const name of ['IBM', 'Microsoft', 'Oracle', 'SAP', 'Salesforce']) {
      expect(await screen.findByRole('article', { name })).toBeInTheDocument();
    }
    expect(screen.getByRole('note')).toHaveTextContent(/IBM is .* today, .* peer average/);
    expect(await screen.findByTestId('line-chart-today')).toBeInTheDocument();
  });

  it('switches to the 7-day trend comparison', async () => {
    render(<DashboardPage />);
    await userEvent.click(screen.getByRole('tab', { name: 'Last 7 Days' }));

    expect(await screen.findByRole('region', { name: 'Last 7 Days summary' })).toBeInTheDocument();
    expect(await screen.findByTestId('line-chart-week')).toBeInTheDocument();
    expect(await screen.findByTestId('return-chart')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent('over the last 7 days');
    expect(screen.getByRole('tab', { name: 'Last 7 Days' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to the quarter view and ranks every company in the details table', async () => {
    render(<DashboardPage />);
    await userEvent.click(screen.getByRole('tab', { name: 'Last Quarter' }));

    const details = await screen.findByRole('region', { name: 'Details' });
    const table = await within(details).findByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(1 + 5); // header + 5 companies
    expect(screen.getByRole('note')).toHaveTextContent('over the last quarter');
  });

  it('removes a company from every panel when it is deselected', async () => {
    render(<DashboardPage />);
    await screen.findByRole('article', { name: 'Oracle' });

    await userEvent.click(screen.getByRole('button', { name: 'Oracle' }));
    expect(screen.queryByRole('article', { name: 'Oracle' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(4);
  });

  it('keeps IBM pinned in the selector', async () => {
    render(<DashboardPage />);
    await screen.findByRole('article', { name: 'IBM' });
    expect(screen.getByRole('button', { name: 'IBM' })).toBeDisabled();
  });
});
