# Architecture Decision Records

Architectural decisions for node-red-contrib-chatbot (REDBot) are recorded
here, one file per decision, named `ADR NNN – Title.md` (zero-padded number,
en-dash).

Each ADR follows the same format: a Status/Date/Authors header, then
**Context**, **Decision**, **Consequences** (positive + trade-offs), and an
**Alternatives Considered** table. Decisions written up after the fact are
marked **Accepted (documented retroactively)**.

## Working with ADRs

- **Before** making an architectural change (new dependency, cross-cutting
  pattern, platform-integration approach), check the ADRs — don't drift from a
  recorded convention without flagging it.
- **When** a change introduces such a decision, add a new ADR with the next
  free number, following the format above, and add a row to the index below.

## Index

| ADR | Title | Status |
| --- | --- | --- |
| 001 | [ChatExpress Middleware Engine for Platform Integrations](ADR%20001%20%E2%80%93%20ChatExpress%20Middleware%20Engine%20for%20Platform%20Integrations.md) | Accepted (documented retroactively) |
| 002 | [Platform Parameter Registration Pattern](ADR%20002%20%E2%80%93%20Platform%20Parameter%20Registration%20Pattern.md) | Accepted (documented retroactively) |
