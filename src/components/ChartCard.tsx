import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string;
  children: ReactNode;
}

/** Generic card shell for any chart or metric block; owns loading/error presentation. */
export function ChartCard({ title, subtitle, loading, error, children }: ChartCardProps) {
  return (
    <section className="card" aria-label={title}>
      <header className="card__header">
        <h2 className="card__title">{title}</h2>
        {subtitle && <p className="card__subtitle">{subtitle}</p>}
      </header>
      <div className="card__body">
        {loading ? (
          <p className="card__status" role="status">
            Loading…
          </p>
        ) : error ? (
          <p className="card__status card__status--error" role="alert">
            {error}
          </p>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
