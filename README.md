# getpawwer.app

Standalone acquisition landing for PAWWER. This directory is intentionally independent from the CRM repository and its production landing.

## Run locally

```sh
npm run dev
```

Then open `http://localhost:4173`.

## Funnel

- Interactive demo: captures the visitor's attention and shows a lead moving into an organized next step.
- Trial CTA: continues to `https://crm.pawwerapp.com` and preserves UTM values and supported click IDs.
- Meta Pixel: loads only after a visitor accepts advertising cookies. Set `META_PIXEL_ID` in the deployment environment.
- Conversions API: the CRM's verified Dodo webhook is the source of truth for trial and payment events. Store its token only as a server secret in the CRM deployment; never in this static site.

The landing sends browser events for `PageView`, `ViewContent`, and `InitiateCheckout`. The CRM sends server events for a confirmed `StartTrial` and subscription `Purchase`. The page does not put a Conversions API secret in its client code.

## Deployment

Connect this repository as a new, independent Vercel project. Assign `getpawwer.app` there. Do not import the existing Pawwer landing project.

The site is static and runs on Node's built-in HTTP server for local preview. For Vercel, the static files can be served from the project root; `vercel.json` maps the domain's root to `index.html`.
