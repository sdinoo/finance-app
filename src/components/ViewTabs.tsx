import { VIEWS, VIEW_ORDER } from '@/config/markets';
import type { ViewRange } from '@/types/finance';

interface ViewTabsProps {
  value: ViewRange;
  onChange: (view: ViewRange) => void;
}

export function ViewTabs({ value, onChange }: ViewTabsProps) {
  return (
    <div role="tablist" aria-label="Time range" className="tabs">
      {VIEW_ORDER.map((view) => (
        <button
          key={view}
          role="tab"
          aria-selected={value === view}
          className={value === view ? 'tab tab--active' : 'tab'}
          onClick={() => onChange(view)}
        >
          {VIEWS[view].label}
        </button>
      ))}
    </div>
  );
}
