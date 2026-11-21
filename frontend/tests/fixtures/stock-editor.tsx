import { createRoot } from 'react-dom/client';

import { StockEditor } from '../../src/ideas/idea-a/stock-editor';
import type { StockItem, StockSnapshot } from '../../src/ideas/idea-a/stock-editor';

const initialStock: StockSnapshot = {
  updated_at: '2026-11-21T10:00:00+07:00',
  items: [{ fruit_id: 'mango', stock_kg: 8, use_today_kg: 2 }],
};

const container = document.getElementById('fixture');
const { saveStockFixture } = window as Window & {
  saveStockFixture?: (items: StockItem[]) => Promise<StockSnapshot>;
};
if (!container || !saveStockFixture) throw new Error('Stock editor fixture is incomplete.');

createRoot(container).render(
  <StockEditor
    fruits={[{ fruit_id: 'mango', name: 'Mango' }]}
    stock={initialStock}
    onSave={saveStockFixture}
  />,
);
