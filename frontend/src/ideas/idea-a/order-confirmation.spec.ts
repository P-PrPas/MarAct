import { expect, test } from '@playwright/test';

test('validates quantities and preserves edits after a failed confirmation', async ({ page }) => {
  const submitted: unknown[] = [];
  await page.route('**/component-fixtures/plans/plan-1/confirm', async (route) => {
    submitted.push(route.request().postDataJSON());
    if (submitted.length === 1) {
      await route.fulfill({ status: 500 });
      return;
    }
    await route.fulfill({
      json: {
        id: 'draft-1',
        confirmed_at: '2026-11-21T09:30:00+07:00',
        items: [
          { fruit_id: 'mango', quantity_kg: 4 },
          { fruit_id: 'banana', quantity_kg: 0 },
        ],
        message: '2026-11-22\nMango: 4 kg\n',
      },
    });
  });
  await page.goto('/tests/fixtures/order-confirmation.html');
  const mango = page.getByRole('textbox', { name: 'Mango order quantity (kg)' });
  const banana = page.getByRole('textbox', { name: 'Banana order quantity (kg)' });
  const confirm = page.getByRole('button', { name: 'Confirm order' });
  await expect(mango).toHaveValue('6');
  await expect(banana).toHaveValue('2');

  for (const invalid of ['', '-1', '2.5', 'abc', '9007199254740992']) {
    await mango.fill(invalid);
    await confirm.click();
    await expect(page.getByRole('alert')).toContainText('whole number');
  }
  expect(submitted).toHaveLength(0);

  await mango.fill('5');
  await banana.fill('0');
  await confirm.click();
  await expect(page.getByRole('alert')).toContainText('Could not confirm');
  await expect(mango).toHaveValue('5');
  await expect(banana).toHaveValue('0');
  await confirm.click();
  await expect(mango).toHaveValue('4');
  await expect(banana).toHaveValue('0');
  await expect(confirm).toHaveCount(0);
  await expect(page.getByRole('textbox', { name: 'Supplier message' }))
    .toHaveValue('2026-11-22\nMango: 4 kg\n');
  const expected = { items: [
    { fruit_id: 'mango', quantity_kg: 5 },
    { fruit_id: 'banana', quantity_kg: 0 },
  ] };
  expect(submitted).toEqual([expected, expected]);
});

test('restores the persisted draft and copies the exact message or selects it on failure', async ({ page }) => {
  await page.addInitScript(() => {
    let attempts = 0;
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        async writeText(value: string) {
          document.documentElement.dataset.copied = value;
          attempts += 1;
          if (attempts > 1) throw new Error('Clipboard denied');
        },
      },
    });
  });
  await page.goto('/tests/fixtures/order-confirmation.html?saved=1');
  await page.reload();

  await expect(page.getByRole('textbox', { name: 'Mango order quantity (kg)' })).toHaveValue('4');
  await expect(page.getByRole('textbox', { name: 'Banana order quantity (kg)' })).toHaveValue('0');
  const message = '2026-11-22\nMango: 4 kg\n';
  const field = page.getByRole('textbox', { name: 'Supplier message' });
  const copy = page.getByRole('button', { name: 'Copy supplier message' });
  await expect(field).toHaveValue(message);
  await copy.click();
  await expect(page.getByRole('status')).toHaveText('Message copied.');
  await expect(page.locator('html')).toHaveAttribute('data-copied', message);
  await copy.click();
  await expect(page.getByRole('status')).toContainText('Copy the selected message manually.');
  await expect(field).toBeFocused();
  expect(await field.evaluate((element: HTMLTextAreaElement) => (
    element.value.slice(element.selectionStart, element.selectionEnd)
  ))).toBe(message);
});
