import { useRef, useState, type FormEvent } from 'react';

type Fruit = { fruit_id: string; name: string };

type ConfirmationPlan = {
  id: string;
  items: readonly { fruit_id: string; suggested_kg: number }[];
};

export type ConfirmationItem = { fruit_id: string; quantity_kg: number };

export type ConfirmedDraft = {
  id: string;
  confirmed_at: string;
  items: readonly ConfirmationItem[];
  message: string;
};

type OrderConfirmationProps = {
  fruits: readonly Fruit[];
  plan: ConfirmationPlan;
  draft: ConfirmedDraft | null;
  onConfirm: (planId: string, items: ConfirmationItem[]) => Promise<ConfirmedDraft>;
};

function SupplierMessage({ message }: { message: string }) {
  const messageField = useRef<HTMLTextAreaElement>(null);
  const [copyStatus, setCopyStatus] = useState('');

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message);
      setCopyStatus('Message copied.');
    } catch {
      messageField.current?.focus();
      messageField.current?.select();
      setCopyStatus('Clipboard unavailable. Copy the selected message manually.');
    }
  }

  return (
    <>
      <label>
        Supplier message
        <textarea ref={messageField} readOnly value={message} rows={5} />
      </label>
      <button type="button" onClick={copyMessage}>Copy supplier message</button>
      <p role="status">{copyStatus}</p>
    </>
  );
}

function ConfirmationForm({ fruits, plan, draft, onConfirm }: OrderConfirmationProps) {
  const [savedDraft, setSavedDraft] = useState<ConfirmedDraft | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const confirmed = draft ?? savedDraft;
  const suggestions = new Map(plan.items.map((item) => [item.fruit_id, item.suggested_kg]));

  function quantityFor(fruitId: string) {
    if (confirmed) {
      const item = confirmed.items.find((item) => item.fruit_id === fruitId);
      return item ? String(item.quantity_kg) : '';
    }
    const suggestion = suggestions.get(fruitId);
    return edits[fruitId] ?? (suggestion === undefined ? '' : String(suggestion));
  }

  async function confirmOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || confirmed) return;

    const items: ConfirmationItem[] = [];
    for (const fruit of fruits) {
      const value = quantityFor(fruit.fruit_id).trim();
      const quantity = Number(value);
      if (!/^\d+$/.test(value) || !Number.isSafeInteger(quantity)) {
        setError(`Enter a whole number of kilograms (0 or more) for ${fruit.name}.`);
        return;
      }
      items.push({ fruit_id: fruit.fruit_id, quantity_kg: quantity });
    }

    submitting.current = true;
    setPending(true);
    setError('');
    try {
      setSavedDraft(await onConfirm(plan.id, items));
    } catch {
      setError('Could not confirm the order. Try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <section aria-label="Supplier order">
      <h2>Supplier order</h2>
      <form onSubmit={confirmOrder}>
        {fruits.map((fruit) => (
          <label key={fruit.fruit_id}>
            {fruit.name} order quantity (kg)
            <input
              inputMode="numeric"
              value={quantityFor(fruit.fruit_id)}
              readOnly={Boolean(confirmed)}
              disabled={pending}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setEdits((previous) => ({ ...previous, [fruit.fruit_id]: value }));
                setError('');
              }}
            />
          </label>
        ))}
        {!confirmed && (
          <button className="primary-action" type="submit" disabled={pending}>
            {pending ? 'Confirming…' : 'Confirm order'}
          </button>
        )}
        {error && <p role="alert">{error}</p>}
      </form>
      {confirmed && <SupplierMessage key={confirmed.id} message={confirmed.message} />}
    </section>
  );
}

export function OrderConfirmation(props: OrderConfirmationProps) {
  return <ConfirmationForm key={props.plan.id} {...props} />;
}
