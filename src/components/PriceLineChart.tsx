import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PRIMARY_SYMBOL } from '@/config/markets';
import type { PriceHistory, ViewRange } from '@/types/finance';
import { buildComparisonRows, symbolColor } from '@/utils/chartData';
import { formatPercent, formatTick, formatTimestamp } from '@/utils/formatters';

interface PriceLineChartProps {
  histories: Record<string, PriceHistory>;
  range: ViewRange;
  /** Symbol drawn with a thicker line. */
  highlight?: string;
}

/** Multi-series line chart of % change from period start, so different price levels are comparable. */
export function PriceLineChart({ histories, range, highlight = PRIMARY_SYMBOL }: PriceLineChartProps) {
  const rows = buildComparisonRows(histories);
  const symbols = Object.keys(histories);

  return (
    <div className="chart" role="img" aria-label={`Percent change comparison chart for ${symbols.join(', ')}`}>
      <ResponsiveContainer>
        <LineChart data={rows} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="time"
            tickFormatter={(t: string) => formatTick(t, range)}
            minTickGap={48}
            tick={{ fontSize: 12 }}
          />
          <YAxis tickFormatter={(v: number) => `${v}%`} width={52} tick={{ fontSize: 12 }} />
          <Tooltip
            labelFormatter={(t: string) => formatTimestamp(t)}
            formatter={(value: number, name: string) => [formatPercent(value), name]}
          />
          <Legend />
          {symbols.map((symbol) => (
            <Line
              key={symbol}
              type="monotone"
              dataKey={symbol}
              stroke={symbolColor(symbol)}
              strokeWidth={symbol === highlight ? 3 : 1.5}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
