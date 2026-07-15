# **ADR 002 – Platform Parameter Registration Pattern**

**Status:** Accepted (documented retroactively)
**Date:** 2026-07-15
**Authors:** REDBot maintainers

---

## **Context**

Chat platforms expose many optional send options (silent delivery, paid
broadcast, reply markup, etc.). These options must be:

* configurable per node from the Node-RED editor / Mission Control UI, and
* mapped onto the platform SDK's API fields inside outbound middleware.

Without a shared convention, each option would be wired ad hoc — read from an
arbitrary place, named inconsistently, and invisible to the UI unless someone
hand-edited a node's HTML. We needed one repeatable pattern so that adding a
send option is uniform across every platform in `lib/platforms/`.

This pattern sits on top of the ChatExpress engine described in
[ADR 001 – ChatExpress Middleware Engine for Platform Integrations](ADR%20001%20%E2%80%93%20ChatExpress%20Middleware%20Engine%20for%20Platform%20Integrations.md).

## **Decision**

Each platform (e.g. `telegram.js`, `facebook/facebook.js`) exposes
platform-specific send options as **params**, following one pattern:

1. **Read a param** inside an `out` handler: `const param = params(message);`
   then `param('camelCaseName', defaultValue)`.
2. **Pass to API**: map camelCase param names to snake_case API fields
   (e.g. `allowPaidBroadcast` → `allow_paid_broadcast: param('allowPaidBroadcast', false)`).
3. **Register** at the bottom of the file so the UI (Mission Control) can expose
   it as a node option:

   ```js
   Telegram.registerParam('camelCaseName', 'boolean'|'string'|'select', {
     label: 'Human label',
     default: false,
     description: 'Shown in UI',
     // for 'select': options: [{ value, label }, ...]
     // for 'string': placeholder, suggestions: ['{{token}}', ...]
   });
   ```

   Registered params appear as configurable fields on nodes in the Node-RED
   editor.

Parameter types are `'boolean'`, `'string'`, and `'select'`. For `'select'`
add `options: [{ value, label }, ...]`; for `'string'` add `placeholder`
and/or `suggestions: ['{{token}}', ...]`.

## **Consequences**

### ✅ Positive

* Adding a send option is a single, uniform three-step change per platform.
* Registered params surface automatically as node fields — no hand-editing of
  node HTML to expose a new option.
* The camelCase-in-code / snake_case-at-the-API-boundary split keeps node
  configuration readable while matching each platform SDK's field names.

### ⚠️ Trade-offs / Risks

* The camelCase→snake_case mapping is manual in each `out` handler; a typo maps
  a param to the wrong API field silently.
* Registration lives at the bottom of each platform file by convention — nothing
  enforces that a param read in middleware was also registered for the UI.

## **Alternatives Considered**

| Option | Pros | Cons | Reason Not Chosen |
| --- | --- | --- | --- |
| Read options directly from the raw Node-RED msg | No registration step | Options invisible to the editor UI; no defaults, labels, or validation | Loses the configurable-field benefit |
| Central param registry shared across platforms | Single source of truth | Platforms have genuinely different options; forced sharing leaks platform specifics | Per-platform registration keeps concerns local |
| Auto-derive params from SDK typings | No manual mapping | SDKs lack consistent machine-readable option metadata | Not feasible across heterogeneous SDKs |
