import { test, expect } from '@playwright/test';
import { countRepoCards, reposTextWithoutHeadings } from './helpers';

const SECTION_IDS = ['hero', 'about', 'skills', 'projects', 'repos', 'contact'];

// SPEC.md line 4: Sections with ids: #hero #about #skills #projects #repos #contact. All six must exist.
// Assumption: all six are on the page at BASE_URL (a one-page site).
test('all six sections exist (SPEC.md:4)', async ({ page }) => {
  await page.goto('/');
  for (const id of SECTION_IDS) {
    await expect.soft(page.locator(`#${id}`), `#${id} should exist`).toBeAttached();
  }
});

// SPEC.md line 5: Responsive: no horizontal scroll at a viewport width of 375px.
// Assumption: measured on the page at BASE_URL after it has finished loading, including
// the #repos fetch, as document scrollWidth not exceeding the viewport width.
test('no horizontal scroll at 375px (SPEC.md:5)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
});

// SPEC.md line 6: #repos lists public GitHub repos as cards, or shows a plain message if there
// are none or the fetch fails.
// Assumptions for all three tests below:
// - A "card" is shown as a link to a single repo (https://github.com/<owner>/<repo>) inside #repos.
// - The "plain message" is non-empty text in #repos other than its heading.
// - Repos are fetched in the browser from api.github.com. The "none" and "fails" tests replace
//   that request; if the page makes no such request they are skipped, since neither branch can be forced.
test.describe('#repos (SPEC.md:6)', () => {
  test('shows repo cards or a message', async ({ page }) => {
    await page.goto('/');
    await expect
      .poll(async () => (await countRepoCards(page)) > 0 || (await reposTextWithoutHeadings(page)).length > 0, {
        message: '#repos should show repo cards or a message',
      })
      .toBe(true);
  });

  for (const scenario of ['none', 'fails'] as const) {
    test(`shows a message and no cards when the fetch ${scenario === 'none' ? 'returns no repos' : 'fails'}`, async ({ page }) => {
      let githubApiCalled = false;
      await page.route('**://api.github.com/**', async (route) => {
        githubApiCalled = true;
        if (scenario === 'none') {
          await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        } else {
          await route.abort('failed');
        }
      });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      test.skip(!githubApiCalled, 'Page made no request to api.github.com, so this case cannot be forced.');

      await expect.poll(() => reposTextWithoutHeadings(page), { message: '#repos should show a message' }).not.toBe('');
      expect(await countRepoCards(page)).toBe(0);
    });
  }
});

// SPEC.md line 7: #hero, #contact contain links to email, GitHub and LinkedIn.
// Assumption: email is an <a href="mailto:...">, GitHub is an <a> to github.com, LinkedIn is an <a> to linkedin.com.
for (const id of ['hero', 'contact']) {
  test(`#${id} has email, GitHub and LinkedIn links (SPEC.md:7)`, async ({ page }) => {
    await page.goto('/');
    const section = page.locator(`#${id}`);
    await expect.soft(section.locator('a[href^="mailto:"]'), 'email link').not.toHaveCount(0);
    await expect.soft(section.locator('a[href*="github.com"]'), 'GitHub link').not.toHaveCount(0);
    await expect.soft(section.locator('a[href*="linkedin.com"]'), 'LinkedIn link').not.toHaveCount(0);
  });
}
