import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';
import pg from 'pg';
import { defaultIdeaId, demoIdeas, ideaPath } from '../frontend/src/ideas/registry';

test('root opens the configured default demo', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(ideaPath(defaultIdeaId));
  await expect(page.getByRole('combobox', { name: 'Idea' })).toHaveValue(defaultIdeaId);
  await expect(page.getByRole('option')).toHaveText(demoIdeas.map(({ label }) => label));
});

test('switching ideas keeps newly created records isolated', async ({ page, request }) => {
  const title = `Smoke test ${randomUUID()}`;
  const switcher = page.getByRole('combobox', { name: 'Idea' });
  const record = page.getByText(title, { exact: true });
  try {
    await page.goto('/ideas/idea-a');
    await page.getByLabel('Record title').fill(title);
    await page.getByRole('button', { name: 'Add record' }).click();
    await expect(record).toBeVisible();

    const loadedB = page.waitForResponse((response) =>
      response.url().endsWith('/api/ideas/idea-b/records') && response.ok(),
    );
    await switcher.selectOption('idea-b');
    await loadedB;
    await expect(page).toHaveURL('/ideas/idea-b');
    await expect(page.getByRole('status')).toHaveCount(0);
    await expect(record).toHaveCount(0);
    const records = await (await request.get('/api/ideas/idea-b/records')).json();
    expect(records.map((item: { title: string }) => item.title)).not.toContain(title);

    await page.reload();
    await expect(switcher).toHaveValue('idea-b');
    await page.goBack();
    await expect(page).toHaveURL('/ideas/idea-a');
    await expect(switcher).toHaveValue('idea-a');
    await expect(record).toBeVisible();
  } finally {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    try {
      await pool.query('DELETE FROM idea_a_records WHERE title = $1', [title]);
    } finally {
      await pool.end();
    }
  }
});
