import { compareToPeers, describeComparison } from './compare';

describe('compareToPeers', () => {
  const values = { IBM: 2, MSFT: 4, ORCL: -1, SAP: 0, CRM: 1 };

  it('computes average, rank and beaten peers', () => {
    expect(compareToPeers(values, 'IBM')).toEqual({ primary: 2, peerAverage: 1, beaten: 3, peers: 4, rank: 2 });
  });

  it('ranks first when ahead of everyone, last when behind everyone', () => {
    expect(compareToPeers({ IBM: 9, A: 1, B: 2 }, 'IBM')?.rank).toBe(1);
    expect(compareToPeers({ IBM: -9, A: 1, B: 2 }, 'IBM')).toMatchObject({ rank: 3, beaten: 0 });
  });

  it('does not count ties as beaten or ahead', () => {
    expect(compareToPeers({ IBM: 1, A: 1, B: 0 }, 'IBM')).toMatchObject({ rank: 1, beaten: 1 });
  });

  it('returns null when the primary is missing or has no peers', () => {
    expect(compareToPeers({ MSFT: 1 }, 'IBM')).toBeNull();
    expect(compareToPeers({ IBM: 1 }, 'IBM')).toBeNull();
  });
});

describe('describeComparison', () => {
  it('describes outperformance', () => {
    const text = describeComparison(
      { primary: 2, peerAverage: 1, beaten: 3, peers: 4, rank: 2 },
      'IBM',
      'over the last quarter',
    );
    expect(text).toBe(
      'IBM is +2.00% over the last quarter, 1.00 pts above the peer average (+1.00%) and ahead of 3 of 4 peers.',
    );
  });

  it('describes underperformance', () => {
    const text = describeComparison({ primary: -1.5, peerAverage: 0.5, beaten: 0, peers: 4, rank: 5 }, 'IBM', 'today');
    expect(text).toContain('2.00 pts below the peer average (+0.50%)');
    expect(text).toContain('ahead of 0 of 4 peers');
  });
});
