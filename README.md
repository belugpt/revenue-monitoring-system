# Revenue Monitoring System

Multi-business retail finance application. Public visitors can explore illustrative demo figures. Sign in with ChatGPT to create private, user-owned businesses and save figures to Cloudflare D1. No production financial records are embedded in source.

## Features
- Independent records for multiple businesses per signed-in user.
- Monthly entry, configurable years, royalty and advertising rates, and pricing ratio.
- Automatic stock-cost, profit, weighted margins, sales growth, inventory and supplier payable calculations.
- Responsive investor dashboard, charts, top products, conversion, CSV export, JSON backup/import and print report.
- Server-side ownership enforcement, origin checks, finite numeric validation, prepared database statements and optimistic concurrency.

## Development
Node 24 recommended. Run `npm ci`, `npm run db:generate`, `npm test`, `npm run typecheck`, `npm run build`.
Hosting is managed by Sites using `.openai/hosting.json`. It provisions D1 and applies tracked Drizzle migrations. Preserve the Sites Vite integration and dispatch-owned authentication.

Use `npm run dev` for the portable preview. The starter README documents local D1 migration commands and simulated local sign-in. Preview records are separate from production.

## GitHub pipeline
`.github/workflows/quality.yml` tests financial logic, checks types, builds the app and uploads the production artifact for every pull request and push to main. It does not obtain hosting credentials or deploy production automatically.

`.github/workflows/production.yml` is a production release gate: it re-runs verification and produces a versioned build artifact behind the GitHub `production` environment. Configure environment reviewers in GitHub before use. Publication to the current Sites host uses its authenticated save/deploy tools and the exact pushed source commit; there is no supported long-lived Sites publishing credential available to GitHub Actions in this workspace. Do not store expiring Sites source tokens as an automatic deployment secret.

Until that host integration is available, a passing GitHub release is ready for publication, not evidence that production was deployed. Follow `DEPLOYMENT.md` to publish it through Sites. Source and workflows are maintained at https://github.com/belugpt/revenue-monitoring-system.

## Accounting assumptions
Stock cost = (net sales + discounts on retained items) × cost-to-ticket-price ratio. A 50% ratio is a 100% markup on supplier cost. Confirm that all products share this ratio; reconcile periodically against actual stock counts. Franchise fee basis can be overridden independently.

Stock received increases inventory and supplier payable. Stock payments reduce supplier payable, not profit. Cash is an actual reconciled snapshot. Losses reduce stock; include their expense in operating costs. Zero defaults for optional monthly stock movements mean no movement and must be confirmed. Missing required data remains unavailable.

Each new business begins with no actual financial records. Opening stock and opening unpaid invoices must be entered at cost; no unresolved opening balance from the original workbook is assumed.
