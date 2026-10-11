# bryce-site-tests

Functional tests for bryce-site, written with Playwright and TypeScript.

Tests run against a live deployment. Set `BASE_URL` to the site's URL before running:

```sh
npm install
npx playwright install --with-deps chromium
BASE_URL=https://example.com npm test
```

Tests are written from `SPEC.md` and issue text, not from the site's source code. Each test names the `SPEC.md` line it checks.
