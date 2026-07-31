# BeeSplit

A frontend-only expense splitter for groups. No backend, no accounts — all data
is stored in the browser's `localStorage`.

- Add the people in your group
- Log expenses with an amount, who paid, and who it should be split between
  (a different subset of people per expense)
- See each person's running balance and a simplified list of who owes whom

## Development

```sh
npm install
npm run dev
```

## Deploying to GitHub Pages

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the
app and publishes it via GitHub Pages.

One-time setup on GitHub: **Settings → Pages → Source → GitHub Actions**.

The build uses relative asset paths (`base: './'` in `vite.config.ts`), so it
works regardless of the repository name or whether it's served from a project
page (`username.github.io/repo-name/`) or a custom domain.
