import { Locator, Page } from '@playwright/test';

// A link to a single GitHub repository: https://github.com/<owner>/<repo>
export const REPO_LINK = /^https?:\/\/(www\.)?github\.com\/[^/?#]+\/[^/?#]+\/?$/;

/** Count of #repos links whose href is a single-repo URL. */
export async function countRepoCards(page: Page): Promise<number> {
  const hrefs = await page
    .locator('#repos a[href]')
    .evaluateAll((els) => els.map((a) => (a as HTMLAnchorElement).href));
  return hrefs.filter((h) => REPO_LINK.test(h)).length;
}

/** Visible text in #repos, not counting headings. */
export async function reposTextWithoutHeadings(page: Page): Promise<string> {
  return page.locator('#repos').evaluate((el) => {
    const copy = el.cloneNode(true) as HTMLElement;
    copy.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => h.remove());
    return (copy.textContent ?? '').replace(/\s+/g, ' ').trim();
  });
}

/** The dark-mode toggle: the only button in the nav, or the one whose name mentions dark/theme/mode. */
export async function darkModeToggle(page: Page): Promise<Locator> {
  const buttons = page.getByRole('navigation').getByRole('button');
  if ((await buttons.count()) === 1) return buttons;
  return buttons.filter({ hasText: /dark|light|theme|mode/i }).or(
    page.getByRole('navigation').getByRole('button', { name: /dark|light|theme|mode/i }),
  ).first();
}
