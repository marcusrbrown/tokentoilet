<!-- fro-bot -->
<!-- fro-bot:run-summary -->
Run 45749683595; frozen date 2026-11-26 UTC. Seven of eight default-branch quality gates pass. Full audit: one High, four Moderate, four Low; production audit clean. Plain and coverage suites: 1,504 passed, seven existing skips. Coverage S/B/F/L: 65.56/66.61/59.54/65.99%, above unchanged budgets but lower than yesterday. Reviewed 60 open PRs, file inventories of 45 failing PRs, 55 distinct failed Actions logs, and 529 workflow runs in the seven complete UTC days November 19–25. All seven daily schedules succeeded and produced PR commits. Five portfolio repositories surveyed read-only. No clearly minimal new repair established; existing remediation items retained without duplicate cleanup PRs. Branch/PR delivery supersedes daily-issue rotation; existing report #1743 remains untouched.
<!-- /fro-bot:run-summary -->

## Daily Autohealing Report — 2026-11-26 (UTC)

**Previous report:** #1743

**Delivery:** Report-only branch/commit/PR, per the operator's `branch-pr` contract. No daily issue was created, replaced, or retired; #1743 remains the sole eligible open daily-report issue. Its predecessor is #1740. The previous-report reference above denotes the evidence predecessor, not an issue closed by this run.

**Baseline:** `main` at `375ff2b1ea4443b908568c33d83eba6ba0f36280`. [Actions run](https://github.com/marcusrbrown/tokentoilet/actions/runs/45749683595). All local measurements below were taken before documentation changes.

### Run Summary

| Category | Status | Notes |
| --- | --- | --- |
| Errored PRs | ⚠️ | Recurring browser assertion, historical audits, lock-maintenance dependency review, and external deployment quota. No safe branch repair established. |
| Security | ⚠️ | High Storybook middleware advisory remains #1553; contradictory patch evidence and a cross-major compatibility boundary. Production audit clean. |
| Code Quality & Repo Hygiene | ⚠️ | Builds and validators pass; coverage decreases within budgets; existing convention, instruction, and browser-CI debt retained. |
| Developer Experience | ⚠️ | Lint has zero errors and two known warnings. Existing cleanup PRs already cover related debt; no duplicate patch or speculative fix. |
| Quality Gates | ❌ | Seven of eight gates pass; full moderate-level security audit fails. |
| Cross-Project Intelligence | ✅ | All five focus repositories surveyed read-only; actionable observations below. |

### Errored PRs

| PR | Failure | Fix | Status |
| --- | --- | --- | --- |
| #1742 | Browser test awaits a transient disposing heading at `e2e/burn-gates.spec.ts:108`, including retry; run 45541915942 | Diagnosis retained below. Import-only PR does not establish the browser failure's cause; no speculative assertion or timeout change. | ⚠️ Needs review |
| #1749, #1711 | Same browser assertion on dependency/workflow update heads | Category 1 excludes dependency updates; workflow/manifest/lockfile heads were not executed. | ⏭️ Skipped |
| #1736 | Dependency review rejects `minimatch@9.0.9`, Moderate GHSA-g3hv-75wg-m249 | Lock maintenance remains Renovate-owned; no unrelated version changes or policy bypass. | ⏭️ Skipped |
| Existing cleanup PRs with failed Security Audit | Historical dependency advisory failures | Inspected logs; current main audit does not authorize unrelated updates to each old cleanup branch. | ⚠️ Needs review |
| #1651, #1657 | Historical audits on workflow-changing branches | No protected-branch commands or workflow edits. | ⏭️ Skipped |
| #1637, #1635, #1631, #1628, #1593 | Historical security-update audits; #1637/#1635/#1628 conflict | Category 2 only; do not restore superseded dependency snapshots. | ⚠️ Needs review |
| #1632 | External Vercel status links `upgradeToPro=build-rate-limit` | Operational quota, not a demonstrated source defect. | ⏭️ Skipped |

Read all **60** open PR status inventories, file lists for the **45** PRs with failed Actions checks, and **55 distinct failed Actions run logs** covering those checks and the workflow-health window. Open heads are same-repository, authored by the owner, Fro Bot, or the Renovate application; the reporting token has repository push access. No PR branch was checked out, executed, or mutated. No branch-repair authorization is inferred from historical failures.

### Security

| Advisory / PR | Severity | Action Taken |
| --- | --- | --- |
| GHSA-g84c-rxfj-3j2c / alert 150 / #1553 | High | Existing issue retained. Installed `webpack-dev-middleware` is 6.1.3; no matching open security-update PR or proven compatible minimal patch. |
| GHSA-477h-4r7f-fvrx / #1594 | Medium | `pbkdf2` remains in the registry audit; Moderate-only remediation remains Renovate-owned. |
| GHSA-w74x-v6f9-j3xg, GHSA-wjr9-j795-jxcr | Medium | Two `fast-uri` advisories confirmed; no unrelated dependency batching. |
| GHSA-6pq8-jhm2-2vcw | Medium | `qs` advisory confirmed; retain dependency ownership. |
| GHSA-g3hv-75wg-m249 / #1736 | Medium | Proposed lock maintenance fails dependency review; not a finding in today's default-branch audit. |
| #1637, #1635, #1631, #1628, #1593, #1590 | Historical security updates | Original Next/Storybook/Vite/follow-redirects/sharp/source-map-js targets are absent from today's main audit. No obsolete-lockfile repair, merge, or closure. |

Dependabot data is accessible: **eight open alerts**, one High, three Medium, four Low; no Critical. Registry audit reports **one High, four Moderate, four Low**; registry-only `pbkdf2` explains the Moderate-count difference. `pnpm audit --prod --audit-level moderate --json` reports **zero vulnerabilities**.

Fresh coordinated [middleware advisory](https://github.com/advisories/GHSA-g84c-rxfj-3j2c) prose says **8.3.0 with no 5.x/6.x/7.x backport**, while Dependabot structured metadata says **7.4.6** and the registry audit says **>=7.4.5**. These disagree and cross the installed major. Static Storybook success does not validate dev-server traversal safety. Reuse #1553; no speculative override or broad builder migration. Keep the affected development server away from untrusted traffic.

Tracked-file scans found no literal private-key/mnemonic assignments or embedded credential-bearing Alchemy/Infura RPC URLs. `.env.example` is the only tracked environment template: placeholders, empty optional credentials, and a local application URL; no wallet secret found. No direct `eval()` or `new Function()` usage found in `app/`, `components/`, `hooks/`, or `lib/`. These scoped static scans are not a guarantee against obfuscated secrets or a full-history secret audit. No credential values are reproduced here.

### Code Quality & Repo Hygiene

| Check | Result | Action |
| --- | --- | --- |
| Next.js build | ✅ Pass | Next.js 16.4.6 production build; independent TypeScript gate also passes. Remote AppKit configuration returns 403 and falls back; build still succeeds. |
| Test coverage | ✅ Meets thresholds | S/B/F/L 65.56/66.61/59.54/65.99%; measured decrease versus #1743, tracked under #1241/#1608. |
| Storybook build | ✅ Pass | Static build succeeds; webpack asset/entrypoint-size warnings remain, main entrypoint 4.08 MiB. |
| Design system | ✅ Valid | All four validation checks pass; 15 component triplets and six token files present. |
| Web3 patterns | ✅ Valid | All seven validator checks pass; manual convention findings below are outside this validator's completeness checks. |
| Stale TODOs | 1 found | Existing #1507; archive monitoring example is 159 days old. |
| Convention drift | ⚠️ Issues | Existing #1523/#1554/#1559/#1560/#1561 and cleanup PRs; no duplicate import-only PR. |
| AGENTS.md accuracy | ⚠️ Drifted | Reuse #1555: filtering example and linked primary documentation lag actual scripts, versions, and E2E layout. |

**Coverage:** plain and coverage runs each pass **71 files, 1,504 tests**, with **seven existing skips**. All unchanged S/B/F/L budgets **59/60/55/59.5%** pass.

| Metric | Current | Previous #1743 | Delta (percentage points) |
| --- | --- | --- | --- |
| Statements | 65.56% (2904/4429) | 65.72% | -0.16 |
| Branches | 66.61% (2552/3831) | 66.71% | -0.10 |
| Functions | 59.54% (652/1095) | 60.36% | -0.82 |
| Lines | 65.99% (2744/4158) | 66.11% | -0.12 |

Largest uncovered statement counts: `lib/web3/transaction-queue.ts` **176**, `hooks/use-token-filtering.ts` **135**, `hooks/use-token-balance.ts` **90**, `lib/web3/token-metadata.ts` and `hooks/use-transaction-queue.ts` **83 each**. These identify gaps, not proven causes of daily variation. Dependencies changed since yesterday; this is a measured decline, not an isolated source-code regression. Reuse #1241/#1608 rather than opening another coverage issue or lowering budgets.

**Workflow health:** paginated the complete runs listing from November 19 through this invocation. The **seven complete UTC days November 19–25** contain **529 runs**:

| Workflow | Success | Failure | Cancelled | Skipped | Interpretation |
| --- | --- | --- | --- | --- | --- |
| CI/CD Pipeline | 59 | 13 | 7 | 0 | 13/72 completed non-cancelled runs failed (18.1%); below the >50% alert threshold but recurring failures need attention. |
| Fro Bot | 7 | 0 | 0 | 189 | All seven expected daily schedules succeeded; exclusions are not failures. Seven bot PRs with commits created (#1713/#1719/#1724/#1728/#1733/#1739/#1742), so no zero-output outage. |
| Renovate | 128 | 0 | 0 | 97 | No failed completed runs; event exclusions are separate. |
| Update Repo Settings | 29 | 0 | 0 | 0 | Scheduled/settings work is not expected to produce repository commits. |

Copilot Setup Steps is path/manual-triggered, not scheduled; no runs in this window are not evidence of an outage. GitHub-managed Copilot workflows likewise have no runs in the returned window. All 13 failed weekly logs were inspected: nine dependency-review failures on lock maintenance and four browser-heading failures. Main runs **44432196255** and **45327069484**, cleanup run **45541915942**, and dependency run **45548611868** share the browser assertion. The latest additional main failure **45731144453**, on November 26, also hits `e2e/burn-gates.spec.ts:108`. No local browser rerun is claimed.

**Conventions:** static source scan finds **163 unsafe-cast/suppression matching lines across 13 test files** (#1523), none in production app/component/hook/lib code. A broad import scan finds **216 relative import lines**; this includes type imports and test/loader contexts and is not a count of proven violations. Existing alias PRs already cover many of these paths. Direct `useAppKitTheme` remains in `components/theme-sync.tsx:3`; literal consumer colors remain there, `lib/web3/config.ts:58`, `components/ui/badge-variants.ts`, and `components/ui/toast.tsx` (#1554). Token declarations and fixtures are not automatically violations. Web3 production TSX files contain client directives, including files with leading header comments. No direct production `process.env`, Tailwind JavaScript config, or CSS `@apply` found. No new effect-state regression established. Wallet connect/disconnect rejection contracts still conflict with the non-throwing convention (#1561); installed Wagmi declarations mark account/switch-account aliases deprecated (#1560).

**Freshness:** chain configuration blame is **2026-04-17**; Alchemy host entries **2026-06-20**; address-table entries in `lib/web3/token-filtering.ts:287+` and `lib/web3/token-validation.ts:158+` date to **2025-09** or **2026-06-20**. A fresh read of `ethereum-lists/chains/_data/chains/eip155-11155111.json` confirms **11155111/ETH** and the Sepolia Alchemy host. Edit age is not verification age; full address-registry verification provenance remains unestablished. No configuration values or enabled chains changed.

**Instruction drift:** `AGENTS.md:12` uses the extra-`--` single-test example; its linked primary reference still says Wagmi v2/pnpm 11.27.0/Storybook v9 versus installed declarations/package metadata **Wagmi ^3.0.0/pnpm 11.29.0/Storybook 10.6.8**. The reference's `validate` description includes a production build that the script does not run, and its E2E location lags `e2e/`. `llms.txt:13` links missing `legacy.md`. Reuse #1555; no instruction or first-person/user-facing content was edited.

### Developer Experience

- None: lint has **zero errors**; two known NetworkSwitcher Fast Refresh warnings already have PR #1559. Related import and typed-mock cleanup already has open PRs. No clearly minimal new fix was established, and no duplicate daily cleanup PR was manufactured.
- This delivery changes only the daily oversight report. Dependencies, runtime code, tests, workflows, budgets, and configuration are unchanged.

### Quality Gates

| Gate | Status | Details |
| --- | --- | --- |
| Lint | ✅ | `pnpm lint`: zero errors, two existing NetworkSwitcher warnings. |
| Type check | ✅ | `pnpm exec tsc --noEmit`: clean, run independently before builds. |
| Unit tests | ✅ | `pnpm test`: 71 files, 1,504 passed, seven existing skips. |
| Build | ✅ | `pnpm build`: successful static production build. |
| Storybook | ✅ | `pnpm run build-storybook`: successful static build. |
| Security audit | ❌ | `pnpm audit --audit-level moderate --json`: one High/four Moderate/four Low; production-only audit clean. |
| Design system | ✅ | `pnpm run validate:design-system`: four checks pass. |
| Web3 validation | ✅ | `pnpm run validate:web3`: seven checks pass. |

The initial background validation wrapper was terminated by its one-second tool timeout. It was rerun with a bounded larger wrapper timeout; every result above comes from that completed serial run, with a six-minute per-command limit. No project configuration or gate was weakened.

### Cross-Project Intelligence (Inbound)

| Repo | Finding | Actionable for Token Toilet? | Priority |
| --- | --- | --- | --- |
| marcusrbrown/poly | Explicit immediate vulnerability PRs bypass release age; weekly lock maintenance; `rebaseWhen: behind-base-branch` | Compare Token Toilet's effective inherited security/rebase policy before proposing configuration changes. Do not copy Python-specific dependency machinery. | Med |
| marcusrbrown/renovate-config | Both HEAD and the actually pinned 5.2.17 `default.json` inherit bfra-me 5.3.2; runtime pin matches local 7eb26710/v0.149.0 | No preset drift established by comparing only repository HEAD. Keep routine bumps Renovate-owned and inspect effective transitive-alert behavior. | Med |
| fro-bot/agent | Action exposes `cache-save-result`, `invocation-outcome`, and a distinct server-bootstrap timeout; its own CI uses finite execution budgets | Evaluate bounded execution plus persistence/delivery outcome telemetry in a separately authorized workflow change. No runtime bump or workflow change here. | Med |

All five focus repositories were queried read-only through `gh`; no clones, checkouts, or foreign writes. Yield-farmer **4e394905/v0.144.2** and poly **b3d5cd8d/v0.144.4** are behind local **7eb26710/v0.149.0**; renovate-config matches local. Yield-farmer and `.github` yielded no additional actionable delta. Optional guessed `default.json5` and yield-farmer Renovate-file paths returned 404 and were skipped; the discovered `default.json` was then read at HEAD and the pinned ref. These are configuration observations, not a Sunday release-note scan. `IS_SUNDAY_UTC` is unset; category 7 was skipped entirely.

### Tasks for Agents

- **High middleware #1553:** inspect `.storybook/main.ts`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, authoritative patched bytes, and Storybook builder APIs. Reconcile the 7.4.5/7.4.6 metadata versus 8.3.0/no-backport advisory prose before an isolated High-only remediation. Verify harmless loopback traversal/publicPath fixtures, Storybook, and all gates. Static builds do not prove dev-server safety. No guessed cross-major override, broad builder migration, audit suppression, or unrelated dependency updates.
- **Recurring browser assertion:** reproduce `e2e/burn-gates.spec.ts:98–108` from runs **45541915942/45327069484/45731144453**. Trace `e2e/fixtures/network-stubs.ts`, confirmation helpers, `components/web3/disposal-flow.tsx`, and `hooks/use-token-disposal.ts`. Immediate synthetic receipts racing a transient disposing heading is a hypothesis, not a demonstrated root cause. Establish actual transitions, then make observation deterministic while preserving submission and final-receipt assertions. Verify focused retries, representative contention, and the full synthetic-wallet browser suite. No real wallets, newly enabled chains, deleted assertions, or blind timeout increases.
- **Coverage #1241/#1608:** compare identical-source/dependency per-file hit maps and async loader settlement in `components/web3/dynamic/__tests__/dynamic-components.test.tsx:152–184` and `components/web3/dynamic/token-list.tsx:36–45`. Preserve real-module coverage and pending/resolved/error paths. Verify focused/plain/coverage runs under contention; retain budgets, assertions, includes/excludes, skips, and timeouts.
- **Historical security PRs #1637/#1635/#1631/#1628/#1593/#1590:** compare original advisories with today's main before repair. Recheck author, writable same-repository head, and sensitive-file boundaries; never resurrect obsolete lockfiles or treat a withdrawn finding as a new patch mandate. PR disposition/merging/closure remains unauthorized.
- **Workflow #1599 / lock maintenance #1736:** distinguish PR-body feedback churn, expected exclusions, and Moderate minimatch dependency-review failures. Inspect `.github/workflows/renovate.yaml`, effective inherited preset policy, and `docs/solutions/workflow-issues/skipped-upstream-jobs-can-satisfy-required-checks-2026-09-20.md`. Moderate-only updates remain Renovate-owned; no blind reruns, bypasses, or unauthorized workflow edits.
- **Convention backlog #1523/#1554/#1559:** deduplicate against existing open cleanup PRs before touching aliases, mocks, or NetworkSwitcher exports. Theme/hook/color changes in `components/theme-sync.tsx`, `lib/web3/config.ts`, `components/ui/badge-variants.ts`, and `components/ui/toast.tsx` require SDK/provider tracing, theme tests, and light/dark verification. Do not batch a broad migration into a daily patch.
- **Loader boundary:** keep relative imports in `lib/env/index.ts` and `lib/env/validate-build-env.ts` until Next's actual configuration loader supports aliases; a prior blanket conversion failed despite tsc success. Do not mechanically retry. Evaluate `playwright.config.ts:22` separately and verify the actual loader/build, without weakening validation.
- **SDK/error contracts #1560/#1561:** trace `hooks/use-wallet.ts`, `hooks/use-wallet-switcher.ts`, consumers, and mocks. Obtain the existing rejection-contract decision before changing error behavior; verify connection/rejection/disconnection/recovery/persistence/browser paths. No silent swallowing, chain enablement, or routine version bumps.
- **Instruction drift #1555:** establish instruction-edit authority before reconciling `AGENTS.md:12`, `.github/copilot-instructions.md`, and `llms.txt`. Verify test filtering, versions, script contents, E2E paths, and the missing link. Preserve first-person and user-facing copy.
- **Stale TODO #1507:** decide historical retention versus separately scoped monitoring for `docs/archive/RFCs/RFC-001-Project-Foundation.md:323`, authored 2026-06-20, age 159 days. Recheck blame and scope; no monitoring dependency or archived implementation is authorized.
- **Configuration provenance:** record authoritative verification dates/sources for `lib/web3/chains.ts`, `lib/web3/alchemy-endpoints.ts`, and the token-filtering/token-validation address tables. Sepolia chain/host match today's registry; full address verification is incomplete. Report mismatches without changing addresses, RPCs, or chains.
- **Cadence/runtime telemetry:** investigate unset `IS_SUNDAY_UTC` against `.github/workflows/fro-bot.yaml` and existing #1657. Today is Thursday; omitting category 7 is correct. Evaluate finite execution/bootstrap budgets and persistence/outcome telemetry with fixtures, preserving trust, delivery, session boundaries, and Renovate-owned pins.

Every deferred item retains its original trust, scope, approval, and guardrail requirements. Deferral grants no additional authority.

### Needs Human Attention

- High tooling advisory #1553 needs authoritative patch and compatibility evidence. Do not expose the affected development server to untrusted traffic.
- Current main's hosted browser CI fails despite all requested non-audit local gates passing; the transient-heading hypothesis is not yet a validated repair.
- Superseded security heads and the large unmerged cleanup backlog need owner disposition; no merges or PR/diagnostic-issue closures were attempted.
- Workflow-changing #1651/#1657 and dependency/lockfile heads were execution-excluded. #1736's Moderate blocker does not authorize unrelated remediation. #1632's Vercel quota needs operational attention.
- Wallet rejection-contract choice (#1561), instruction-edit authority (#1555), address-verification provenance, and cadence environment propagation remain unresolved.
- The operator's branch/PR contract overrides daily-issue delivery and rotation for this invocation. The sole eligible report issue #1743 was preserved, not silently replaced or retired. No ambiguity or foreign-authored report was adopted.
