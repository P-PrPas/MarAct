import { useId, useRef, useState } from 'react';

import './plan-review.css';

type Fruit = {
  fruit_id: string;
  name: string;
};

type PlanItem = {
  fruit_id: string;
  forecast_kg: number;
  usable_stock_kg: number;
  suggested_kg: number;
  shortage: boolean;
  surplus: boolean;
  explanation: string;
};

export type Plan = {
  id: string;
  delivery_date: string;
  delivery_at: string;
  cutoff_at: string;
  generated_at: string;
  items: readonly PlanItem[];
};

type MissingInput = 'stock' | 'usage_history';
export type PlanRunResult = { plan: Plan | null } | { missingInputs: readonly MissingInput[] };

type PlanReviewProps = {
  fruits: readonly Fruit[];
  plan: Plan | null;
  loading?: boolean;
  onRun: () => Promise<PlanRunResult>;
};

const deliveryDateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'long',
  timeZone: 'UTC',
});
const cutoffFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Bangkok',
});
const missingInputGuidance: Record<MissingInput, string> = {
  stock: 'Save a current stock snapshot.',
  usage_history: 'Add seven consecutive days of usage for each fruit.',
};

export function PlanReview({ fruits, plan, loading = false, onRun }: PlanReviewProps) {
  const headingId = useId();
  const running = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [result, setResult] = useState<{ previousPlan: Plan | null; run: PlanRunResult }>();
  const currentRun = result?.previousPlan === plan ? result.run : undefined;
  const currentPlan = currentRun && 'plan' in currentRun ? currentRun.plan : plan;
  const missingInputs = currentRun && 'missingInputs' in currentRun ? currentRun.missingInputs : [];
  const fruitById = new Map(fruits.map(({ fruit_id, name }, index) => [fruit_id, { name, index }]));
  const items = [...(currentPlan?.items ?? [])].sort((left, right) =>
    Number(right.shortage || right.surplus) - Number(left.shortage || left.surplus)
    || (fruitById.get(left.fruit_id)?.index ?? fruits.length)
      - (fruitById.get(right.fruit_id)?.index ?? fruits.length),
  );

  async function runCheck() {
    if (loading || running.current) return;
    running.current = true;
    setPending(true);
    setError(false);
    try {
      setResult({ previousPlan: plan, run: await onRun() });
    } catch {
      setError(true);
    } finally {
      running.current = false;
      setPending(false);
    }
  }

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Plan review</h2>
      <button type="button" disabled={loading || pending} onClick={runCheck}>Run daily check</button>
      {loading && <p role="status">Loading the plan…</p>}
      {pending && <p role="status">Running the daily check…</p>}
      {error && <p role="alert">The daily check failed. Try again.</p>}
      {!pending && !error && missingInputs.length > 0 && (
        <div role="alert">
          <p>The daily check needs more information.</p>
          <ul>
            {missingInputs.map((input) => <li key={input}>{missingInputGuidance[input]}</li>)}
          </ul>
        </div>
      )}
      {currentPlan ? (
        <>
          <p role="status" className="plan-review-banner">Plan ready</p>
          <dl>
            <dt>Delivery date</dt>
            <dd>
              <time dateTime={currentPlan.delivery_date}>
                {deliveryDateFormat.format(new Date(currentPlan.delivery_date))}
              </time>
            </dd>
            <dt>Order cutoff</dt>
            <dd>
              <time dateTime={currentPlan.cutoff_at}>
                {cutoffFormat.format(new Date(currentPlan.cutoff_at))} Bangkok time
              </time>
            </dd>
          </dl>
          <ul aria-label="Fruit recommendations">
            {items.map((item) => (
              <li key={item.fruit_id}>
                <h3>{fruitById.get(item.fruit_id)?.name ?? item.fruit_id}</h3>
                {item.shortage && <p>Shortage risk</p>}
                {item.surplus && <p>Surplus risk</p>}
                <p>Suggested order: {item.suggested_kg} kg</p>
                <p>{item.explanation}</p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        !loading && !pending && !error && missingInputs.length === 0 && <p>No plan yet.</p>
      )}
    </section>
  );
}
