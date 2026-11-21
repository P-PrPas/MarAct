import { useId, useState } from 'react';
import type { FormEvent } from 'react';

export type Fruit = { fruit_id: string; name: string };
export type StockItem = { fruit_id: string; stock_kg: number; use_today_kg: number };
export type StockSnapshot = { updated_at: string; items: StockItem[] };

type StockEditorProps = {
  fruits: readonly Fruit[];
  stock: StockSnapshot | null;
  onSave: (items: StockItem[]) => Promise<StockSnapshot>;
};

type EditableStock = { stock_kg: string; use_today_kg: string };
type EditableField = keyof EditableStock;

const maxStockKg = 1_000_000;
const quantityError = 'Enter an amount from 0 to 1,000,000 kg.';
const fieldLabels = { stock_kg: 'stock on hand', use_today_kg: 'use-today stock' };
const fields = ['stock_kg', 'use_today_kg'] as const;
const stockDateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Bangkok',
});

function editSnapshot(snapshot: StockSnapshot | null): Record<string, EditableStock> {
  return Object.fromEntries((snapshot?.items ?? []).map((item) => [
    item.fruit_id,
    { stock_kg: String(item.stock_kg), use_today_kg: String(item.use_today_kg) },
  ]));
}

function parseQuantity(input: string): number | null {
  const trimmed = input.trim();
  if (!/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(trimmed)) return null;
  const value = Number(trimmed);
  return value <= maxStockKg ? value : null;
}

export function StockEditor(props: StockEditorProps) {
  return <StockForm key={props.stock?.updated_at} {...props} />;
}

function StockForm({ fruits, stock, onSave }: StockEditorProps) {
  const id = useId();
  const [snapshot, setSnapshot] = useState(stock);
  const [edits, setEdits] = useState(() => editSnapshot(stock));
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);

  const rows = fruits.map((fruit) => {
    const values = edits[fruit.fruit_id] ?? { stock_kg: '', use_today_kg: '' };
    const stock_kg = parseQuantity(values.stock_kg);
    const use_today_kg = parseQuantity(values.use_today_kg);
    const errors = {
      stock_kg: stock_kg === null ? quantityError : '',
      use_today_kg: use_today_kg === null ? quantityError : '',
    };
    if (stock_kg !== null && use_today_kg !== null && use_today_kg > stock_kg) {
      errors.use_today_kg = 'Use-today stock cannot exceed stock on hand.';
    }
    return { fruit, values, stock_kg, use_today_kg, errors };
  });

  function change(fruitId: string, field: EditableField, value: string) {
    setEdits((current) => {
      const values = current[fruitId] ?? { stock_kg: '', use_today_kg: '' };
      return { ...current, [fruitId]: { ...values, [field]: value } };
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || rows.length === 0) return;
    setSaveError('');
    const items: StockItem[] = [];
    for (const { fruit, stock_kg, use_today_kg, errors } of rows) {
      if (stock_kg === null || use_today_kg === null || errors.use_today_kg) {
        setShowErrors(true);
        return;
      }
      items.push({ fruit_id: fruit.fruit_id, stock_kg, use_today_kg });
    }
    setSaving(true);
    try {
      const saved = await onSave(items);
      setSnapshot(saved);
      setEdits(editSnapshot(saved));
      setShowErrors(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save stock. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>Update stock</h2>
      <p role="status">
        {snapshot ? (
          <>Last updated <time dateTime={snapshot.updated_at}>{stockDateFormat.format(new Date(snapshot.updated_at))} Bangkok time</time></>
        ) : 'No stock saved yet.'}
      </p>
      <form onSubmit={save} noValidate>
        {rows.map(({ fruit, values, errors }) => (
          <fieldset key={fruit.fruit_id} disabled={saving}>
            <legend>{fruit.name}</legend>
            {fields.map((field) => {
              const inputId = `${id}-${fruit.fruit_id}-${field}`;
              const error = showErrors ? errors[field] : '';
              return (
                <div className="form-row" key={field}>
                  <label htmlFor={inputId}>{fruit.name} {fieldLabels[field]} (kg)</label>
                  <input
                    id={inputId}
                    inputMode="decimal"
                    value={values[field]}
                    required
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    onChange={(event) => change(fruit.fruit_id, field, event.target.value)}
                  />
                  {error && <span id={`${inputId}-error`}>{error}</span>}
                </div>
              );
            })}
          </fieldset>
        ))}
        {showErrors && rows.some(({ errors }) => errors.stock_kg || errors.use_today_kg) && (
          <p role="alert">Check the highlighted stock amounts.</p>
        )}
        {saveError && <p role="alert">{saveError}</p>}
        <button disabled={saving || rows.length === 0}>{saving ? 'Saving stock…' : 'Save stock'}</button>
      </form>
    </section>
  );
}
