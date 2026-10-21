# Compliance corrections and deployment

**Scope:** Execute the corrections requested in the supplied review against this application. Keep GA4, but load it only after optional analytics consent. Do not invent an operator identity, change system DNS, or alter calculation formulas.

1. Add regression tests for consent, URL sanitization, legacy share migration, and withdrawal. Verify the new tests fail before implementation.
2. Add a first-party consent controller and equal accept/reject controls, with a persistent footer settings control. Generate fragment-based share links and retain legacy query-link compatibility. Derive affiliate disclosure status from the same database approval flag used by purchase links.
3. Correct privacy, terms, disclosure, About, CPAP, electrical warnings, and model limitations. Remove unsupported operational promises; document outstanding operator-side verification.
4. Run `npm test`, `npm run audit:copy`, and `npm run build`; verify consent and sharing in a browser if a browser runtime is available. Inspect the patch for unrelated changes.
5. Verify the existing Cloudflare Pages project and production branch, deploy `dist` using Wrangler, and check the production pages and consent asset. Record deployment evidence in operations documentation.

**Acceptance:** No GA request before consent or after a remembered refusal. Analytics page location/referrer omit query and fragment. Legacy query payload moves into the fragment before analytics initialization. New links preserve calculator state without sending it in the HTTP request. Withdrawal disables analytics and clears accessible GA cookies. Existing calculation tests remain green. No claim of universal legal compliance or verified account settings.
