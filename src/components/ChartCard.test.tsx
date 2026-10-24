import { render, screen } from '@testing-library/react';
import { ChartCard } from './ChartCard';

describe('ChartCard', () => {
  it('renders children when ready', () => {
    render(
      <ChartCard title="Test">
        <p>content</p>
      </ChartCard>,
    );
    expect(screen.getByRole('heading', { name: 'Test' })).toBeInTheDocument();
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('shows loading state instead of children', () => {
    render(
      <ChartCard title="Test" loading>
        <p>content</p>
      </ChartCard>,
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('content')).not.toBeInTheDocument();
  });

  it('shows error state', () => {
    render(
      <ChartCard title="Test" error="boom">
        <p>content</p>
      </ChartCard>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('boom');
  });
});
