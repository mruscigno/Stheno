# Homepage rendering blockers

Date: 2026-09-29

## Previous blocker

The homepage was wrapped in a client entry gate that temporarily replaced the marketing tree while browser storage and identity state initialized. Crawlers, no-JavaScript clients, and slow devices could therefore receive or observe a loading shell instead of the H1, product explanation, CTA, links, footer, and structured data.

## Current architecture

`src/app/page.tsx` builds the complete marketing homepage as server-renderable content. `HomepageEntryGate` now renders those children during identity initialization. Client logic may navigate a user after an explicit action, but it does not suppress the anonymous public document or redirect a signed-out visitor merely because a saved Blueprint exists.

The public homepage is therefore independent of authenticated app initialization. Its essential copy, CTA destinations, navigation, footer, and JSON-LD are present in initial HTML. The authenticated product remains under `/app`; `/blueprint` is a separate assessment result route and is not the canonical homepage.

## Regression requirements

- A raw request to `/` must contain the current H1 and a link to `/assessment`.
- Raw HTML must not contain only a loading message.
- Signed-out local storage must not cause a server or client redirect away from `/`.
- JavaScript failure must not remove the marketing message or primary links.
- Canonical metadata, structured data, footer links, and major marketing sections must remain in the initial response.
- Authentication and subscription checks must not be introduced into the public root layout or homepage data dependency chain.

These checks belong in production verification after every homepage or entry-gate change.
