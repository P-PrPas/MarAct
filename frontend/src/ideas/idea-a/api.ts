import { HttpError, requestJson } from '../../shared/http';
import type { ConfirmationItem, ConfirmedDraft } from './order-confirmation';
import type { Plan } from './plan-review';
import type { Fruit, StockItem, StockSnapshot } from './stock-editor';

export type Dashboard = {
  fruits: Fruit[];
  stock: StockSnapshot | null;
  plan: Plan | null;
  draft: ConfirmedDraft | null;
};

const base = '/api/ideas/idea-a';

function jsonBody(method: string, body: object): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const ideaAApi = {
  current: (signal?: AbortSignal) => requestJson<Dashboard>(`${base}/plans/current`, { signal }),
  save: (items: StockItem[]) => requestJson<StockSnapshot>(`${base}/stock`, jsonBody('PUT', { items })),
  run: () => requestJson<Dashboard>(`${base}/plans/run`, { method: 'POST' }),
  confirm: (id: string, items: ConfirmationItem[]) =>
    requestJson<Dashboard>(`${base}/plans/${encodeURIComponent(id)}/confirm`, jsonBody('POST', { items })),
};

export type MissingInput = 'stock' | 'usage_history';

export function missingInputs(error: unknown): MissingInput[] | undefined {
  if (!(error instanceof HttpError) || error.status !== 409) return;
  const detail = error.detail;
  if (typeof detail !== 'object' || detail === null || !('code' in detail) ||
    detail.code !== 'missing_inputs' || !('inputs' in detail) || !Array.isArray(detail.inputs)) return;
  return detail.inputs.filter((input): input is MissingInput => input === 'stock' || input === 'usage_history');
}
