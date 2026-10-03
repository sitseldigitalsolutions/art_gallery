import { expect, test } from '@playwright/test';
import { DEMO, uiLogin } from './helpers';

test('customer discovers a digital artwork and checks out with bank transfer', async ({ page }) => {
  await uiLogin(page, DEMO.customer);

  // Discover via the gallery with a URL-synced filter.
  await page.goto('/gallery?format=DIGITAL');
  const firstCard = page.locator('a[href^="/artworks/"]').first();
  await expect(firstCard).toBeVisible();
  await firstCard.click();
  await expect(page).toHaveURL(/\/artworks\//);
  const title = (await page.locator('h1').first().textContent())?.trim();

  await page.getByRole('button', { name: 'Add to cart' }).click();
  await page.goto('/cart');
  await expect(page.getByText(title!).first()).toBeVisible();
  await page.getByRole('link', { name: /checkout/i }).or(page.getByRole('button', { name: /checkout/i })).first().click();

  await expect(page).toHaveURL(/\/checkout/);
  // COD must be unavailable for digital work; choose bank transfer / UPI.
  await page.getByText('Bank Transfer / UPI').click();
  await page.getByRole('button', { name: 'Place order' }).click();

  await expect(page).toHaveURL(/\/account\/orders\//, { timeout: 20_000 });
  await expect(page.getByText(/AG-[A-Z0-9]{8}/).first()).toBeVisible();
  await expect(page.getByText(title!).first()).toBeVisible();
});
