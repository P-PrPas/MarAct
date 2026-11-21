import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

import type { StockItem, StockSnapshot } from './stock-editor';

async function mount(page: Page, onSave: (items: StockItem[]) => Promise<StockSnapshot>) {
  await page.exposeFunction('saveStockFixture', onSave);
  await page.goto('/tests/fixtures/stock-editor.html');
  return {
    onHand: page.getByLabel('Mango stock on hand (kg)'),
    useToday: page.getByLabel('Mango use-today stock (kg)'),
    save: page.getByRole('button', { name: 'Save stock' }),
    updatedAt: page.locator('time'),
  };
}

test('validates stock amounts before calling save', async ({ page }) => {
  const calls: StockItem[][] = [];
  const { onHand, useToday, save } = await mount(page, async (items) => {
    calls.push(items);
    return { items, updated_at: '2026-11-21T12:00:00+07:00' };
  });

  for (const value of ['', 'abc', '-1', '1000001']) {
    await onHand.fill(value);
    await save.click();
    await expect(onHand).toHaveAttribute('aria-invalid', 'true');
  }
  await onHand.fill('1.25');
  await save.click();
  await expect(useToday).toHaveAccessibleDescription('Use-today stock cannot exceed stock on hand.');
  expect(calls).toEqual([]);

  await useToday.fill('0');
  await save.click();
  await expect(page.locator('time')).toHaveAttribute('datetime', '2026-11-21T12:00:00+07:00');
  expect(calls).toEqual([[{ fruit_id: 'mango', stock_kg: 1.25, use_today_kg: 0 }]]);
});

test('keeps edits on failure and uses the successful response on retry', async ({ page }) => {
  let attempts = 0;
  const { onHand, useToday, save, updatedAt } = await mount(page, async () => {
    attempts += 1;
    if (attempts === 1) throw new Error('Stock service unavailable.');
    return {
      updated_at: '2026-11-21T11:00:00+07:00',
      items: [{ fruit_id: 'mango', stock_kg: 3.5, use_today_kg: 0 }],
    };
  });

  await expect(onHand).toHaveValue('8');
  await expect(useToday).toHaveValue('2');
  await expect(updatedAt).toHaveAttribute('datetime', '2026-11-21T10:00:00+07:00');
  await onHand.fill('3.55');
  await useToday.fill('0');
  await save.click();
  await expect(page.getByRole('alert')).toHaveText('Stock service unavailable.');
  await expect(updatedAt).toHaveAttribute('datetime', '2026-11-21T10:00:00+07:00');
  await expect(onHand).toHaveValue('3.55');
  await expect(useToday).toHaveValue('0');

  await save.click();
  await expect(updatedAt).toHaveAttribute('datetime', '2026-11-21T11:00:00+07:00');
  await expect(onHand).toHaveValue('3.5');
  await expect(useToday).toHaveValue('0');
});
