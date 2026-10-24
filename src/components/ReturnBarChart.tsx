import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { symbolColor } from '@/utils/chartData';
import type { TrendRow } from '@/utils/chartData';
import { formatPercent } from '@/utils/formatters';

interface ReturnBarChartProps {
  rows: TrendRow[];
}

/** Horizontal ranking of period return per company; colours match the line chart. */
export function ReturnBarChart({ rows }: ReturnBarChartProps) {
  const data = rows.map((row) => ({
    symbol: row.symbol,
    name: row.name,
    value: Number(row.summary.returnPercent.toFixed(2)),
  }));

  return (
    <div
      className="chart chart--short"
      role="img"
      aria-label={`Period return ranking: ${data.map((d) => `${d.name} ${formatPercent(d.value)}`).join(', ')}`}
    >
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" horizontal={false} />
          <XAxis type="number" tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 12 }} />
          <YAxis type="category" dataKey="name" width={84} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: number) => formatPercent(value)} cursor={{ fill: '#f4f4f4' }} />
          <Bar dataKey="value" name="Return" isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.symbol} fill={symbolColor(d.symbol)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
