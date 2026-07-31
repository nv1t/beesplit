# 🐝 BeeSplit

A frontend-only expense splitter for groups. No backend, no accounts, and no
local storage — the entire group's data is compressed and encoded directly
into the page's URL. The site uses privacy-friendly, cookie-less analytics
(GoatCounter) for anonymous page-view counts only.

**Live app:** https://nv1t.github.io/beesplit/

## Features

- Add and manage the people in your group
- Log expenses with an amount, currency, date, and who paid
- Pick a different subset of people to split each expense between — not
  every expense has to involve everyone
- Automatically computed running balance per person
- A simplified "who pays whom" settlement list that minimizes the number
  of payments needed to settle up
- Bookmark or copy the URL at any time to save your group, or share it with
  others so they can view or add to it
- Paste someone else's BeeSplit link to merge their people and expenses into
  yours — everyone converges on one shared "truth" instead of overwriting
  each other
- Works offline once loaded; the only network call is an anonymous
  GoatCounter page-view ping, no expense data is ever sent anywhere

## Tech stack

- [Vue 3](https://vuejs.org/) + TypeScript, built with [Vite](https://vite.dev/)
- State is a small reactive composable ([`src/composables/useGroupData.ts`](src/composables/useGroupData.ts))
  compressed with [`lz-string`](https://github.com/pieroxy/lz-string) and kept in
  the URL hash via `history.replaceState` — no external state library, no storage
- No backend, no database, no accounts

## Project structure

```
src/
  components/       UI panels: People, Add/Edit expense, Expense list, Balances
  composables/       useGroupData.ts — state, URL persistence, balance calculations
  utils/settle.ts     Debt-simplification algorithm for settlements
  utils/merge.ts       Combines two shared links into one group
  types.ts            Member / Expense / Settlement / GroupState types
```

## Development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build   # type-checks and builds to dist/
```

## Deploying to GitHub Pages

Pushing to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml),
which builds the app and publishes it via GitHub Pages.

One-time setup on GitHub: **Settings → Pages → Source → GitHub Actions**.

The build uses relative asset paths (`base: './'` in `vite.config.ts`), so it
works regardless of the repository name or whether it's served from a project
page (`username.github.io/repo-name/`) or a custom domain.

## Data & privacy

All group and expense data lives only in the page's URL — nothing is written
to disk and no expense data is ever sent to a server. Closing the tab without
saving (bookmarking, copying, or sharing) the link loses the data. Opening a
different BeeSplit link always starts from exactly what that link encodes;
use the "Merge a link" button to combine it with what you already have open
instead of replacing it.

The page loads [GoatCounter](https://www.goatcounter.com/) for anonymous,
cookie-less page-view counts (`nv1t.goatcounter.com`). It only ever sees the
page URL/referrer, never any group or expense data — that never leaves the
URL hash.
