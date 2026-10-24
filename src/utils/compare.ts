import { formatPercent } from './formatters';

export interface PeerComparison {
  primary: number;
  peerAverage: number;
  /** Peers the primary company outperformed. */
  beaten: number;
  peers: number;
  /** 1 = best of the group. */
  rank: number;
}

/** Compares one company's value (e.g. % return) with the rest of the group. Null if not comparable. */
export function compareToPeers(values: Record<string, number>, primary: string): PeerComparison | null {
  if (!(primary in values)) return null;
  const own = values[primary];
  const peerValues = Object.entries(values)
    .filter(([symbol]) => symbol !== primary)
    .map(([, value]) => value);
  if (peerValues.length === 0) return null;

  return {
    primary: own,
    peerAverage: peerValues.reduce((sum, v) => sum + v, 0) / peerValues.length,
    beaten: peerValues.filter((v) => v < own).length,
    peers: peerValues.length,
    rank: peerValues.filter((v) => v > own).length + 1,
  };
}

/** One-sentence takeaway for the insight banner. `period` is e.g. "today" or "over the last quarter". */
export function describeComparison(comparison: PeerComparison, name: string, period: string): string {
  const gap = comparison.primary - comparison.peerAverage;
  const direction = gap >= 0 ? 'above' : 'below';
  return (
    `${name} is ${formatPercent(comparison.primary)} ${period}, ${Math.abs(gap).toFixed(2)} pts ${direction} ` +
    `the peer average (${formatPercent(comparison.peerAverage)}) and ahead of ${comparison.beaten} of ${comparison.peers} peers.`
  );
}
