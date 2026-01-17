# Repository Instructions for Copilot
## Single Source of Truth
- Treat `BACKLOG_PACK.md` as the authoritative plan (scope, story order, acceptance
criteria, verification commands).
- If anything is ambiguous, ask clarifying questions in chat before making large changes.
## Project Constraints (non-negotiable)
- TypeScript + Node.js CLI only (no UI).
- Node version: >= 20.
- CLI commands must match the backlog (solve / validate / generate).
- Robust parsing: accept an 81-char string with digits + placeholders (`0` or `.`) OR accept
file input as alternative.
- Determinism: generator must be deterministic given `--seed`.
## Engineering Standards
- Prefer small, reviewable diffs (one story per PR/commit when possible).
- Tests-first whenever feasible:
- add tests that fail for the new behavior
- implement the behavior
- keep tests deterministic
## What to output in Copilot responses
When implementing a story, always provide:
1) A short plan mapped to that story’s Acceptance Criteria
2) Files you will add/change
3) Verification commands (from the story if present)
4) Any risks or follow-ups