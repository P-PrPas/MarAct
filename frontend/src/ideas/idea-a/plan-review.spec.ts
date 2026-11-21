import { expect, test, type Page } from '@playwright/test';

async function mountReview(page: Page, state = 'empty') {
  await page.goto(`/tests/fixtures/plan-review.html?state=${state}`);
}

test('shows the delivery and cutoff and renders every recommendation in risk and catalog order', async ({ page }) => {
  await mountReview(page, 'ready');

  await expect(page.getByText('Plan ready')).toBeVisible();
  await expect(page.locator('time[datetime="2026-11-22"]')).toHaveText('22 November 2026');
  await expect(page.locator('time[datetime="2026-11-21T16:00:00+07:00"]')).toContainText('16:00 Bangkok time');
  const recommendations = page.getByRole('list', { name: 'Fruit recommendations' });
  await expect(recommendations.getByRole('heading')).toHaveText(['Banana', 'Pineapple', 'Mango']);
  const banana = recommendations.getByRole('listitem').filter({ hasText: 'Banana' });
  await expect(banana.getByText('Shortage risk')).toBeVisible();
  await expect(banana.getByText('Surplus risk')).toBeVisible();
  await expect(banana.getByText('Suggested order: 6 kg')).toBeVisible();
  await expect(banana.getByText('<strong>Use ripe bananas first.</strong>', { exact: true })).toBeVisible();
});

test('prevents duplicate runs and replaces missing-input guidance with the returned plan', async ({ page }) => {
  let finishRun!: () => void;
  const pendingRun = new Promise<void>((resolve) => { finishRun = resolve; });
  let runCount = 0;
  await page.route('**/plan-review-fixture/run', async (route) => {
    runCount += 1;
    if (runCount === 1) await pendingRun;
    await route.fulfill({ json: runCount === 1 ? 'missing' : 'ready' });
  });

  await mountReview(page);
  await expect(page.getByText('No plan yet.')).toBeVisible();
  const run = page.getByRole('button', { name: 'Run daily check' });
  await run.dblclick();
  await expect(run).toBeDisabled();
  await expect(page.getByText('Running the daily check…')).toBeVisible();
  expect(runCount).toBe(1);

  finishRun();
  await expect(page.getByRole('alert')).toContainText('Save a current stock snapshot.');
  await expect(page.getByRole('alert')).toContainText('Add seven consecutive days of usage');
  await run.click();
  await expect(page.getByText('Plan ready')).toBeVisible();
  await expect(page.getByRole('alert')).toHaveCount(0);
  expect(runCount).toBe(2);
});

test('disables the run control while the current plan loads', async ({ page }) => {
  await mountReview(page, 'loading');

  await expect(page.getByRole('status')).toHaveText('Loading the plan…');
  await expect(page.getByRole('button', { name: 'Run daily check' })).toBeDisabled();
  await expect(page.getByText('No plan yet.')).toHaveCount(0);
});
