import { createRoot } from 'react-dom/client';

import { PlanReview, type Plan, type PlanRunResult } from '../../src/ideas/idea-a/plan-review';

const fruits = [
  { fruit_id: 'mango', name: 'Mango' },
  { fruit_id: 'banana', name: 'Banana' },
  { fruit_id: 'pineapple', name: 'Pineapple' },
];

const plan: Plan = {
  id: 'plan',
  delivery_date: '2026-11-22',
  delivery_at: '2026-11-22T09:00:00+07:00',
  cutoff_at: '2026-11-21T16:00:00+07:00',
  generated_at: '2026-11-21T15:30:00+07:00',
  items: [
    { fruit_id: 'mango', forecast_kg: 8, usable_stock_kg: 9, suggested_kg: 0, shortage: false, surplus: false, explanation: 'Stock covers demand.' },
    { fruit_id: 'pineapple', forecast_kg: 6, usable_stock_kg: 8, suggested_kg: 0, shortage: false, surplus: true, explanation: 'Use ripe pineapple today.' },
    { fruit_id: 'banana', forecast_kg: 8, usable_stock_kg: 2, suggested_kg: 6, shortage: true, surplus: true, explanation: '<strong>Use ripe bananas first.</strong>' },
  ],
};

const fixtureState = new URLSearchParams(location.search).get('state');
createRoot(document.getElementById('fixture')!).render(
  <PlanReview
    fruits={fruits}
    plan={fixtureState === 'ready' ? plan : null}
    loading={fixtureState === 'loading'}
    onRun={async (): Promise<PlanRunResult> => {
      const response = await fetch('/plan-review-fixture/run', { method: 'POST' });
      if (!response.ok) throw new Error('Fixture run failed');
      const result: 'missing' | 'ready' = await response.json();
      return result === 'missing' ? { missingInputs: ['stock', 'usage_history'] } : { plan };
    }}
  />,
);
