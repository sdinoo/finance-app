interface InsightProps {
  children: string;
}

/** One-line takeaway shown above the numbers, so a demo audience gets the point immediately. */
export function Insight({ children }: InsightProps) {
  return (
    <p className="insight" role="note">
      {children}
    </p>
  );
}
