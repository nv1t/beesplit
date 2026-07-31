# 🐝 BeeSplit

A frontend-only expense splitter for groups. No backend, no accounts, no
tracking — everything runs in your browser and data is saved to
`localStorage` on your device only.

**Live app:** https://nv1t.github.io/beesplit/

## Features

- Add and manage the people in your group
- Log expenses with an amount, currency, date, and who paid
- Pick a different subset of people to split each expense between — not
  every expense has to involve everyone
- Automatically computed running balance per person
- A simplified "who pays whom" settlement list that minimizes the number
  of payments needed to settle up
- Works offline once loaded; nothing is sent to a server

## Tech stack

- [Vue 3](https://vuejs.org/) + TypeScript, built with [Vite](https://vite.dev/)
- State is a small reactive composable ([`src/composables/useGroupData.ts`](src/composables/useGroupData.ts))
  synced to `localStorage` — no external state library
- No backend, no database, no accounts

## Project structure

```
src/
  components/       UI panels: People, Add/Edit expense, Expense list, Balances
  composables/       useGroupData.ts — state, persistence, balance calculations
  utils/settle.ts     Debt-simplification algorithm for settlements
  types.ts            Member / Expense / Settlement types
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

All group and expense data lives only in your browser's `localStorage`
(key `beesplit.data.v1`). Clearing your browser data or switching devices/
browsers will lose or not show that data — there is no sync between devices.
