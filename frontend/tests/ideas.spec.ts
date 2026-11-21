import { expect, test } from '@playwright/test';
import { defaultIdeaId, demoIdeas, ideaPath } from '../src/ideas/registry';

test('root opens the configured default demo', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(ideaPath(defaultIdeaId));
  await expect(page.getByRole('combobox', { name: 'Idea' })).toHaveValue(defaultIdeaId);
  await expect(page.getByRole('option')).toHaveText(demoIdeas.map(({ label }) => label));
});

test('restocking saves and reloads a confirmed order without affecting Idea B', async ({ page, request }) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const ideaBRecords = '/api/ideas/idea-b/records';
  const beforeB = await request.get(ideaBRecords);
  expect(beforeB.ok()).toBeTruthy();
  const records = await beforeB.json();

  await page.goto('/ideas/idea-a');
  const stock = page.getByLabel('Mango stock on hand (kg)');
  await expect(stock).toHaveValue('8');
  await stock.fill('8.25');
  const saved = page.waitForResponse((response) =>
    response.request().method() === 'PUT' && response.url().endsWith('/idea-a/stock'),
  );
  await page.getByRole('button', { name: 'Save stock' }).click();
  expect((await saved).ok()).toBeTruthy();

  await page.getByRole('button', { name: 'Run daily check' }).click();
  const mango = page.getByRole('list', { name: 'Fruit recommendations' })
    .getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Mango' }) });
  await expect(mango).toContainText('Suggested order: 6 kg');
  await expect(mango).toContainText(
    'Some stock needs to be used today, and usable stock at delivery is below forecast.',
  );
  const quantity = page.getByLabel('Mango order quantity (kg)');
  await expect(quantity).toHaveValue('6');
  await quantity.fill('5');
  await page.getByRole('button', { name: 'Confirm order' }).click();

  const supplierMessage = page.getByRole('textbox', { name: 'Supplier message', exact: true });
  await expect(supplierMessage).toHaveValue(/Mango.*5 kg/);
  const message = await supplierMessage.inputValue();
  await page.getByRole('button', { name: 'Copy supplier message' }).click();
  await expect(page.getByText('Message copied.')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(message);

  await page.reload();
  await expect(stock).toHaveValue('8.25');
  await expect(quantity).toHaveValue('5');
  await expect(supplierMessage).toHaveValue(message);
  const rerun = page.waitForResponse((response) => response.url().endsWith('/idea-a/plans/run'));
  await page.getByRole('button', { name: 'Run daily check' }).click();
  expect((await rerun).ok()).toBeTruthy();
  await expect(supplierMessage).toHaveValue(message);

  const switcher = page.getByRole('combobox', { name: 'Idea' });
  await switcher.selectOption('idea-b');
  await expect(page).toHaveURL('/ideas/idea-b');
  await expect(page.getByRole('heading', { name: 'Idea B' })).toBeVisible();
  await expect(supplierMessage).toHaveCount(0);
  const afterB = await request.get(ideaBRecords);
  expect(afterB.ok()).toBeTruthy();
  expect(await afterB.json()).toEqual(records);

  await page.goBack();
  await expect(switcher).toHaveValue('idea-a');
  await expect(supplierMessage).toHaveValue(message);
});
