---
title: Skipped upstream jobs can satisfy required status checks
date: 2026-09-20
category: workflow-issues
module: branch-protection
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - "adding or removing a `needs:` edge on a job that is a required status check"
  - "adding a new CI job that an existing required job will depend on"
  - "editing required_status_checks.contexts in .github/settings.yml"
  - "a required context reports skipping rather than pass or fail"
  - "a dependency must stay pinned against an automated update bot"
related_components:
  - tooling
tags:
  - branch-protection
  - required-checks
  - skipped-jobs
  - ci-gating
  - renovate
  - merge-gate
  - verification-blind-spot
---

# Skipped upstream jobs can satisfy required status checks

## Context

A Renovate PR merged to `main` and broke the production build. CI had reported a failure. It merged anyway.

The dependency bump was the trigger, not the defect. The defect was in the gate topology.

`Build` is a required status check and would have caught the break — it compiles the app, and the failure was a Turbopack module-resolution error. It never ran. `build.needs` included `e2e`, and `E2E Tests` was not in the required contexts. E2E failed, so GitHub skipped `Build`.

**GitHub treats a skipped required check as neutral, and neutral satisfies branch protection.** Automerge proceeded on a green-looking gate.

The `build → e2e` edge had been added days earlier along with the E2E job itself. Before that, `build.needs` was `[lint, test]` and this class of break failed loudly. The edge looked like it strengthened the gate. It weakened it, by converting a loud failure into a silent absence.

The diagnostic clue was in `gh pr checks`: `Build  skipping` sitting directly beside `E2E Tests  fail`.

## Guidance

Treat required checks as a graph invariant, not a list of job names.

**The invariant:** for every context in `required_status_checks.contexts`, every job it depends on via `needs:` must also be in that list.

1. **Verify the invariant whenever either side changes.** The CI DAG in `.github/workflows/ci.yaml` and the required contexts in `.github/settings.yml` are one mechanism split across two files. Editing either alone can break the gate.
2. **Adding a `needs:` edge is not the same as making the upstream job required.** When they diverge, the edge is actively harmful — it gives a non-required job the power to suppress a required one.
3. **Treat `skipping` on a required context as a broken gate, not a pass.** A skipped check means the guard never ran. GitHub renders that the same as nothing being wrong.
4. **Prefer no `needs:` edges between required checks at all** unless one genuinely consumes another's output. Most such edges are ordering conveniences that trade a small amount of CI time for a silencing hazard.
5. **When adding a CI job intended to gate merges, add it to the required contexts.** Wiring an existing required job behind it does the opposite of what it appears to do.

For pinned dependencies, a comment is documentation for people and constrains nothing. An update bot will rewrite the line directly beneath it. The pin needs a machine-readable rule alongside the human-readable reason.

Do not remove such a pin until the upstream cause is actually fixed and a fresh build proves it.

## Why This Matters

The danger is that the failure mode is silent and reads as success. A failing check is visible; an absent one looks like nothing to report. Branch protection cannot distinguish "this guard ran and passed" from "this guard never ran," so the strongest check in the pipeline can be removed from the gate by a job that has no authority to block anything.

The intuition runs backwards too. A `needs:` edge looks protective — it serializes execution and implies the downstream job only runs once its prerequisites are satisfied. That is true, and it is exactly the problem. The prerequisite failing does not fail the dependent job; it removes it.

This is the same shape as a review blind spot documented separately in `library-changes-need-consumer-verification-2026-06-21.md`: thorough verification of one unit while the actual failure lands at a boundary the verification never looked at. There, a green review missed a consumer-contract regression. Here, a green CI run missed a build break. In both cases the signal was structurally unable to reach the place it was needed.

## When to Apply

- Adding or removing a `needs:` edge on a required job
- Introducing a CI job that other required jobs will depend on
- Changing `required_status_checks.contexts`
- Seeing `skipping` next to a required context in `gh pr checks`
- Pinning a dependency that an update bot will otherwise bump

## Examples

### Remove the silencing edge

`Build` no longer depends on a job that cannot block a merge.

```yaml
# .github/workflows/ci.yaml — before
build:
  needs: [lint, test, e2e]

# after
build:
  needs: [lint, test]
```

### Make the new gate required in its own right

```yaml
# .github/settings.yml — after
required_status_checks:
  contexts:
    - Build
    - Build Storybook
    - E2E Tests
    - Lint
    - Renovate / Renovate
    - Security Audit
    - Test
```

### Check the invariant explicitly

After either change, confirm every required job's dependencies are themselves required:

| Required check | Depends on | All required? |
|---|---|---|
| Build | Lint, Test | yes |
| Build Storybook | Lint | yes |
| E2E Tests | — | yes |
| Lint | — | yes |
| Security Audit | — | yes |
| Test | — | yes |

`Build Storybook → Lint` has the same shape as the defect and is safe only because `Lint` is also required. That is the invariant doing its job, not an exception to it.

### Back a pin with a rule, not a comment

The override already carried an accurate comment explaining why it must not move. Renovate changed the line anyway.

```yaml
# pnpm-workspace.yaml
overrides:
  '@coinbase/cdp-sdk': 1.51.2
```

```json5
// .github/renovate.json5
packageRules: [
  {
    matchPackageNames: ['@coinbase/cdp-sdk'],
    enabled: false,
  },
]
```

The workspace pin prevents the break; the Renovate rule prevents the pin being undone. Neither is sufficient alone.

## References

- Incident: PR #1506 (the bump that merged broken), #1510 (pin restored, Renovate rule added), #1511 (gate repaired)
- PR #1508 introduced the E2E job and the `needs:` edge that created the hazard
- Related: `docs/solutions/workflow-issues/library-changes-need-consumer-verification-2026-06-21.md` — the same verification-blind-spot shape at a different boundary
