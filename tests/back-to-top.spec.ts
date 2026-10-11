import { test, expect, Locator, Page } from '@playwright/test';

// Assumptions shared by all tests in this file (SPEC.md lines 14-15):
// - The back-to-top control is a button or link whose accessible name mentions "top"
//   (e.g. "Back to top", or an arrow with aria-label="Back to top"), and is not inside the nav.
// - "Hidden" means not shown to the user: absent, display:none, visibility:hidden, opacity 0,
//   or positioned outside the viewport. "Appears" means the opposite of all of these.
// - "Scrolled past #hero" means the bottom of #hero is above the top of the viewport.
// - "The top of the page" means window.scrollY is 0.

function backToTop(page: Page): Locator {
  const notInNav = page.locator(':not(nav *)');
  return page
    .getByRole('button', { name: /top/i, includeHidden: true })
    .or(page.getByRole('link', { name: /top/i, includeHidden: true }))
    .and(notInNav)
    .first();
}

async function isShownToUser(control: Locator): Promise<boolean> {
  if ((await control.count()) === 0 || !(await control.isVisible())) return false;
  return control.evaluate((el) => {
    for (let e: Element | null = el; e; e = e.parentElement) {
      if (Number(getComputedStyle(e).opacity) === 0) return false;
    }
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.right > 0 && r.top < window.innerHeight && r.left < window.innerWidth;
  });
}

async function scrollPastHero(page: Page) {
  await page.locator('#hero').evaluate((hero) => {
    const bottom = hero.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: bottom + 1, behavior: 'instant' });
  });
  await expect
    .poll(() => page.locator('#hero').evaluate((hero) => hero.getBoundingClientRect().bottom), {
      message: 'page should be scrolled so #hero is above the viewport',
    })
    .toBeLessThanOrEqual(0);
}

// SPEC.md line 15: "the button is hidden at the top of the page".
// Note: this passes if the button does not exist at all; the next test catches that.
test('back-to-top button is hidden at the top of the page (SPEC.md:15)', async ({ page }) => {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  expect(await isShownToUser(backToTop(page))).toBe(false);
});

// SPEC.md line 14: "A back-to-top button appears once the user has scrolled past the hero section."
// SPEC.md line 15: "appears after scrolling past #hero" (same requirement, tested once).
test('back-to-top button appears after scrolling past #hero (SPEC.md:14, SPEC.md:15)', async ({ page }) => {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await scrollPastHero(page);
  await expect.poll(() => isShownToUser(backToTop(page)), { message: 'back-to-top button should be shown' }).toBe(true);
});

// SPEC.md line 15: "clicking it returns the user to the top of the page".
// Assumption: smooth scrolling is allowed, so the test waits for scrollY to reach 0.
test('clicking back-to-top returns to the top of the page (SPEC.md:15)', async ({ page }) => {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await scrollPastHero(page);
  const control = backToTop(page);
  await expect.poll(() => isShownToUser(control), { message: 'back-to-top button should be shown' }).toBe(true);

  await control.click();
  await expect.poll(() => page.evaluate(() => window.scrollY), { message: 'page should be at the top' }).toBe(0);
});
