import { expect, test } from '@playwright/test';

test('Idea B displays its own records and selected idea', async ({ page }) => {
  await page.route('**/api/ideas/idea-b/records', (route) =>
    route.fulfill({ json: [{ id: 1, title: 'Idea B fixture' }] }),
  );
  await page.goto('/ideas/idea-b');
  await expect(page.getByRole('heading', { name: 'Idea B' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Idea' })).toHaveValue('idea-b');
  await expect(page.getByText('Idea B fixture', { exact: true })).toBeVisible();
});
