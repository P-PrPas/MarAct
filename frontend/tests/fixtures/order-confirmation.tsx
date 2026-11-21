import { createRoot } from 'react-dom/client';
import { OrderConfirmation, type ConfirmedDraft } from '../../src/ideas/idea-a/order-confirmation';

const fruits = [
  { fruit_id: 'mango', name: 'Mango' },
  { fruit_id: 'banana', name: 'Banana' },
];
const plan = {
  id: 'plan-1',
  items: [
    { fruit_id: 'mango', suggested_kg: 6 },
    { fruit_id: 'banana', suggested_kg: 2 },
  ],
};
const previousDraft: ConfirmedDraft = {
  id: 'draft-1',
  confirmed_at: '2026-11-21T09:30:00+07:00',
  items: [
    { fruit_id: 'mango', quantity_kg: 4 },
    { fruit_id: 'banana', quantity_kg: 0 },
  ],
  message: '2026-11-22\nMango: 4 kg\n',
};

createRoot(document.getElementById('root')!).render(
  <OrderConfirmation
    fruits={fruits}
    plan={plan}
    draft={new URLSearchParams(location.search).has('saved') ? previousDraft : null}
    onConfirm={async (planId, items) => {
      const response = await fetch(`/component-fixtures/plans/${planId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ items }),
      });
      if (!response.ok) throw new Error('Confirmation failure');
      return response.json();
    }}
  />,
);
