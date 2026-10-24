import { PRIMARY_SYMBOL } from '@/config/markets';
import type { TrendRow } from '@/utils/chartData';
import { formatCompact, formatCurrency, formatPercent, toneClass } from '@/utils/formatters';

interface TrendTableProps {
  rows: TrendRow[];
  highlight?: string;
}

export function TrendTable({ rows, highlight = PRIMARY_SYMBOL }: TrendTableProps) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>#</th>
          <th>Company</th>
          <th>Start</th>
          <th>End</th>
          <th>Return</th>
          <th>High</th>
          <th>Low</th>
          <th>Avg volume</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ symbol, name, summary }, index) => (
          <tr key={symbol} className={symbol === highlight ? 'table__row--highlight' : undefined}>
            <td>{index + 1}</td>
            <th scope="row">
              {name} <span className="muted">{symbol}</span>
            </th>
            <td>{formatCurrency(summary.start)}</td>
            <td>{formatCurrency(summary.end)}</td>
            <td className={toneClass(summary.returnPercent)}>
              {summary.returnPercent >= 0 ? '▲' : '▼'} {formatPercent(summary.returnPercent)}
            </td>
            <td>{formatCurrency(summary.high)}</td>
            <td>{formatCurrency(summary.low)}</td>
            <td>{formatCompact(summary.averageVolume)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
