import { expect, test } from '@playwright/test';

test('the dashboard guides the user when stock and usage are missing', async ({ page }) => {
  await page.route('**/api/ideas/idea-a/plans/current', (route) =>
    route.fulfill({ json: { fruits: [{ fruit_id: 'mango', name: 'Mango' }], stock: null, plan: null, draft: null } }),
  );
  await page.route('**/api/ideas/idea-a/plans/run', (route) =>
    route.fulfill({ status: 409, json: { detail: { code: 'missing_inputs', inputs: ['stock', 'usage_history'] } } }),
  );

  await page.goto('/ideas/idea-a');
  await expect(page.getByRole('heading', { name: 'Café restocking' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Idea' })).toHaveValue('idea-a');
  await page.getByRole('button', { name: 'Run daily check' }).click();
  await expect(page.getByRole('alert')).toContainText('Save a current stock snapshot.');
  await expect(page.getByRole('alert')).toContainText('Add seven consecutive days of usage for each fruit.');
});
