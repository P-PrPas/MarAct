import { useEffect, useState } from 'react';
import { ideaAApi, missingInputs, type Dashboard } from './api';
import { OrderConfirmation, type ConfirmationItem } from './order-confirmation';
import { PlanReview } from './plan-review';
import { StockEditor, type StockItem } from './stock-editor';

export function IdeaA() {
  const [dashboard, setDashboard] = useState<Dashboard>();
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    ideaAApi.current(controller.signal).then((current) => {
      if (!controller.signal.aborted) setDashboard(current);
    }).catch(() => {
      if (!controller.signal.aborted) setLoadError(true);
    });
    return () => controller.abort();
  }, [loadAttempt]);

  async function saveStock(items: StockItem[]) {
    const stock = await ideaAApi.save(items);
    setDashboard((current) => current && { ...current, stock });
    return stock;
  }

  async function runPlan() {
    try {
      const result = await ideaAApi.run();
      setDashboard((current) => current && {
        ...current,
        plan: result.plan,
        draft: current.draft && current.plan?.id === result.plan?.id ? current.draft : result.draft,
      });
      return { plan: result.plan };
    } catch (error) {
      const inputs = missingInputs(error);
      if (inputs) return { missingInputs: inputs };
      throw error;
    }
  }

  async function confirmOrder(id: string, items: ConfirmationItem[]) {
    const { plan, draft } = await ideaAApi.confirm(id, items);
    if (!draft) throw new Error('The saved order is missing.');
    setDashboard((current) => current && { ...current, plan, draft });
    return draft;
  }

  return (
    <div className="idea-a-dashboard">
      <h1>Café restocking</h1>
      {loadError ? (
        <div>
          <p role="alert">The dashboard could not load.</p>
          <button type="button" onClick={() => {
            setLoadError(false);
            setLoadAttempt((attempt) => attempt + 1);
          }}>Retry loading dashboard</button>
        </div>
      ) : dashboard ? (
        <>
          <StockEditor fruits={dashboard.fruits} stock={dashboard.stock} onSave={saveStock} />
          <PlanReview fruits={dashboard.fruits} plan={dashboard.plan} onRun={runPlan} />
          {dashboard.plan && (
            <OrderConfirmation
              fruits={dashboard.fruits}
              plan={dashboard.plan}
              draft={dashboard.draft}
              onConfirm={confirmOrder}
            />
          )}
        </>
      ) : <p role="status">Loading dashboard…</p>}
    </div>
  );
}
