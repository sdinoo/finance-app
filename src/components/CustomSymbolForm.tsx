import { useState, type FormEvent } from 'react';
import { isKnownSymbol, isValidSymbol, normalizeSymbol } from '@/config/markets';

interface CustomSymbolFormProps {
  /** Currently charted custom symbol, if any. */
  active: string | undefined;
  onShow: (symbol: string) => void;
  onClear: () => void;
}

/** Validates a ticker on the client so malformed or already-tracked input never triggers a request. */
export function CustomSymbolForm({ active, onShow, onClear }: CustomSymbolFormProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string>();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const symbol = normalizeSymbol(value);
    if (!isValidSymbol(symbol)) {
      setError('Enter a ticker of 1-5 letters, such as AAPL or BRK.B.');
    } else if (isKnownSymbol(symbol)) {
      setError(`${symbol} is already shown in the dashboard above.`);
    } else {
      setError(undefined);
      setValue(symbol);
      onShow(symbol);
    }
  };

  const clear = () => {
    setValue('');
    setError(undefined);
    onClear();
  };

  return (
    <form className="custom-form" onSubmit={submit} noValidate>
      <label htmlFor="custom-symbol">Chart another company</label>
      <div className="custom-form__row">
        <input
          id="custom-symbol"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ticker, e.g. AAPL"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={error !== undefined}
          aria-describedby={error ? 'custom-symbol-error' : undefined}
        />
        <button type="submit" className="chip chip--active">
          Show graph
        </button>
        {active && (
          <button type="button" className="chip" onClick={clear}>
            Clear
          </button>
        )}
      </div>
      {error && (
        <p id="custom-symbol-error" className="custom-form__error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
