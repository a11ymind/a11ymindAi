# Contributing to a11ymind

Thanks for taking the time to contribute.

This repository is public for collaboration and transparency, and contributions
are welcome. Before opening a pull request, please read the notes below so your
changes fit the current product direction and repository workflow.

## Before You Start

- Read the top of [README.md](README.md) for product context, setup, and
  licensing.
- Read [SECURITY.md](SECURITY.md) before reporting any security-sensitive
  issue.
- Keep in mind that this repo is licensed under `BUSL-1.1`, not a permissive
  Open Source license at this time.

## Ways to Contribute

- Report bugs through GitHub issues
- Propose UX or product improvements
- Improve documentation
- Submit targeted fixes
- Add tests for real regressions

For large changes, open an issue first so the implementation direction is
aligned before you spend time on a bigger patch.

## Development Setup

```bash
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

Useful commands:

```bash
npm run test
npm run typecheck
npm run build
```

## Pull Request Guidelines

- Keep changes focused and incremental
- Avoid broad refactors unless they are clearly necessary
- Follow the existing code style and file structure
- Preserve strict TypeScript behavior
- Update docs when behavior, setup, or env vars change
- Add or update tests when fixing a regression or changing critical logic

If your change affects any of the following, include a short note in the PR:

- auth flows
- billing / Stripe
- entitlements
- scan pipeline
- scheduled scans
- CI ingestion / alerts

## Product Constraints

This repo powers a live SaaS product. Please be careful with changes to:

- authentication and session behavior
- Stripe checkout, portal, and webhooks
- scan execution and browser runtime logic
- entitlement enforcement
- scheduled jobs and alert delivery

Small, well-scoped changes are preferred over speculative architectural work.

## Commit Style

Conventional-style commit messages are preferred, for example:

- `fix: harden scan error handling`
- `feat: add CI history panel`
- `docs: clarify GitHub OAuth setup`

## Security Reports

Do not open a public GitHub issue for a suspected vulnerability. Follow the
private reporting guidance in [SECURITY.md](SECURITY.md).

## Questions

If something is unclear, open an issue with enough context to explain:

- what you expected
- what happened instead
- how to reproduce it
- why the change would help
