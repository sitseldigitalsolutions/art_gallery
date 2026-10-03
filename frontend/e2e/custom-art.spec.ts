import { expect, test } from '@playwright/test';
import { API, DEMO, apiLogin, samplePhoto, uiLogin } from './helpers';

test('photo-to-art: customer request → artist quote & preview → revision → approval → cart', async ({ page, request }) => {
  await uiLogin(page, DEMO.customer);

  // 1. Upload photo
  await page.goto('/create-your-art');
  await page.locator('input[type="file"]').setInputFiles({ name: 'family.png', mimeType: 'image/png', buffer: samplePhoto() });
  await page.getByRole('button', { name: /continue/i }).click();

  // 2. Style
  await page.locator('button[aria-pressed]').first().click();
  await page.getByRole('button', { name: /continue/i }).click();

  // 3. Artist (the demo artist we can log in as)
  await page.locator('button[aria-pressed]', { hasText: DEMO.artist.name }).first().click();
  await page.getByRole('button', { name: /continue/i }).click();

  // 4. Customize
  await page.getByPlaceholder(/convert this family photo/i).fill('E2E: watercolor family portrait with a temple background, warm colours.');
  await page.getByRole('button', { name: /continue/i }).click();

  // 5. Review & submit
  await page.getByRole('button', { name: 'Submit request' }).click();
  await expect(page.getByText('Your request is on its way!')).toBeVisible({ timeout: 30_000 });
  await page.getByRole('link', { name: 'Track my request' }).click();
  await expect(page).toHaveURL(/\/account\/custom-art\//);
  const requestId = page.url().split('/').pop()!;

  // Source photo is private: never exposed under /media.
  const detail = await request.get(`${API}/custom-art/requests/${requestId}`, { headers: await apiLogin(request, DEMO.customer) });
  const source = (await detail.json()).data.images.find((i: { kind: string }) => i.kind === 'SOURCE');
  expect(source.url).toContain('/api/v1/files/private?');
  expect((await request.get(source.url.replace(/sig=[^&]+/, 'sig=tampered'))).status()).toBe(403);

  // Artist side via API: accept with quote, start, upload preview.
  const artist = await apiLogin(request, DEMO.artist);
  const base = `${API}/custom-art/requests/${requestId}`;
  expect((await request.patch(`${base}/accept`, { headers: artist, data: { quotedPrice: 4500, artistMessage: 'Lovely photo!' } })).ok()).toBeTruthy();
  expect((await request.patch(`${base}/start`, { headers: artist })).ok()).toBeTruthy();
  const preview = () =>
    request.post(`${base}/preview`, {
      headers: artist,
      multipart: { message: 'First pass', images: { name: 'p.png', mimeType: 'image/png', buffer: samplePhoto() } },
    });
  expect((await preview()).ok()).toBeTruthy();

  // Customer asks for a revision in the UI.
  await page.reload();
  await page.locator('textarea').first().fill('Please make the sky a little brighter.');
  await page.getByRole('button', { name: /request revision/i }).click();
  await expect(page.getByText('Please make the sky a little brighter.').first()).toBeVisible();

  // Artist uploads the revised preview; customer approves and adds to cart.
  expect((await preview()).ok()).toBeTruthy();
  await page.reload();
  await page.getByRole('button', { name: /approve preview/i }).click();
  await page.getByRole('button', { name: /add to cart/i }).click();
  await expect(page).toHaveURL(/\/(cart|checkout)/);
  await expect(page.getByText(/4,500/).first()).toBeVisible();
});
