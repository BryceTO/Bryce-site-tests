import { test, expect } from '@playwright/test';
import { darkModeToggle } from './helpers';

// Matches the class "dark" exactly, not e.g. "dark-mode".
const DARK = /(^|\s)dark(\s|$)/;

// SPEC.md line 10: A button in the nav toggles a 'dark' class on <body>.
// Assumptions: "the nav" is the element with role navigation (e.g. <nav>). The toggle is the only
// button there or, if there are several, the one whose name mentions dark/light/theme/mode.
// "Toggles" means each click flips the class, so two clicks return to the starting state.
test('nav button toggles dark class on body (SPEC.md:10)', async ({ page }) => {
  await page.goto('/');
  const toggle = await darkModeToggle(page);
  const body = page.locator('body');
  const startsDark = await body.evaluate((b) => b.classList.contains('dark'));

  await toggle.click();
  if (startsDark) await expect(body).not.toHaveClass(DARK);
  else await expect(body).toHaveClass(DARK);

  await toggle.click();
  if (startsDark) await expect(body).toHaveClass(DARK);
  else await expect(body).not.toHaveClass(DARK);
});

// SPEC.md line 11: The choice is kept for the session.
// Assumption: "the session" means the same browser tab, so the choice must survive a page reload.
// Starting state is light (the test browser reports a light colour scheme).
test('dark mode choice survives a reload (SPEC.md:11)', async ({ page }) => {
  await page.goto('/');
  const body = page.locator('body');
  await expect(body).not.toHaveClass(DARK);

  await (await darkModeToggle(page)).click();
  await expect(body).toHaveClass(DARK);

  await page.reload();
  await expect(body).toHaveClass(DARK);
});
