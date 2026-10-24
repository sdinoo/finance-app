import { formatPercent, toneClass } from '@/utils/formatters';

interface StatCardProps {
  label: string;
  value: string;
  /** Optional signed % shown with an arrow; colour is never the only signal. */
  deltaPercent?: number;
  note?: string;
}

/** Small headline-number card for the summary strip. */
export function StatCard({ label, value, deltaPercent, note }: StatCardProps) {
  return (
    <div className="stat">
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {deltaPercent !== undefined && (
        <p className={`stat__delta ${toneClass(deltaPercent)}`}>
          {deltaPercent >= 0 ? '▲' : '▼'} {formatPercent(deltaPercent)}
        </p>
      )}
      {note && <p className="stat__note">{note}</p>}
    </div>
  );
}
