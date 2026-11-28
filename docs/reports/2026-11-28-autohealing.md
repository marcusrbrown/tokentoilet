<!-- fro-bot -->
<!-- fro-bot:run-summary -->
Run 46103397898; frozen date 2026-11-28 UTC. Seven of eight default-branch quality gates pass. Full audit: one High, four Moderate, four Low; production audit clean. Unit and coverage suites: 1,504 passed, seven existing skips; S/B/F/L 65.56/66.61/59.54/65.99%, unchanged from #1752 and above unchanged budgets. Inventoried 60 open PRs, read 44 failed PR job logs and all 17 failed weekly run logs, and enumerated 448 workflow runs for November 21–27. All seven daily schedules succeeded and produced commits; two deliveries were report-only. Five portfolio repositories surveyed read-only. Opened #1757 for recurring browser failures; refreshed existing security, coverage, TODO and instruction issues. No minimal safe runtime repair established; delivery is documentation-only.
<!-- /fro-bot:run-summary -->

## Daily Autohealing Report — 2026-11-28 (UTC)

**Previous report:** #1752.

**Baseline:** `main` at `8e252f3acecf6fc157f99d0f83026fc15e42731f`. [Actions run 46103397898](https://github.com/marcusrbrown/tokentoilet/actions/runs/46103397898).

**Delivery:** Branch `docs/daily-autohealing-2026-11-28` adds only this report. No runtime repair, dependency bump, workflow change, or guardrail reduction is claimed. The rotating issue is the reporting index; existing remediation items were deduplicated before writes.

### Run Summary

| Category | Status | Notes |
| --- | --- | --- |
| Errored PRs | ⚠️ | Recurring browser assertion, historical dependency audits and external Vercel quota; no proven minimal repair. |
| Security | ⚠️ | Known High Storybook middleware advisory #1553; full audit fails, production audit clean. |
| Code Quality & Repo Hygiene | ⚠️ | Builds, validators and coverage budgets pass; tracked conventions and documentation drift remain. |
| Developer Experience | ⚠️ | Zero lint errors; two known Fast Refresh warnings already covered by #1559. |
| Quality Gates | ❌ | Seven of eight pass; full moderate-level security audit fails. |
| Cross-Project Intelligence | ✅ | Five focus repositories surveyed read-only; bounded runtime budgets are a concrete candidate. |

### Errored PRs

| PR | Failure | Fix | Status |
| --- | --- | --- | --- |
| #1742 | `e2e/burn-gates.spec.ts:108` cannot observe the disposing heading, including retry | Opened #1757 with cross-branch evidence and constrained reproduction steps; no speculative assertion change. | ⚠️ Needs review |
| #1711 | Same browser assertion on a routine dependency head | Excluded from category 1; manifest/lockfile head not executed. | ⏭️ Skipped |
| #1736 | Dependency review rejects `minimatch@9.0.9`, Moderate GHSA-g3hv-75wg-m249 | Routine lock maintenance remains Renovate-owned; no policy bypass or unrelated upgrade. | ⏭️ Skipped |
| Historical cleanup PRs | Security Audit failures against older dependency snapshots | Read their logs; do not batch unrelated dependency changes into cleanup heads. | ⚠️ Needs review |
| #1651, #1657 | Historical audits on workflow-changing heads | Sensitive-head execution exclusion; no workflow or prompt edits. | ⏭️ Skipped |
| #1637, #1635, #1631, #1628, #1593, #1590 | Historical security updates have conflicting heads | Category 2 only; original targets are already superseded on main. Restoring obsolete lockfiles is not a safe repair. | ⚠️ Needs review |
| #1632 | Vercel status points to `upgradeToPro=build-rate-limit` | External operational quota, not an established source defect. | ⏭️ Skipped |

All **60 open PRs** were inventoried. File lists for all failed/conflicting candidates were inspected, and **44 failed Actions job logs** were read successfully: 42 Security Audit and two E2E Tests. Observed authors are the owner, Fro Bot or the approved Renovate application; heads are same-repository and this identity has repository push permission. No existing PR head was checked out, executed or mutated. Sensitive workflow/manifest/lockfile heads remained execution-excluded. No category 1 fix-summary comment is owed.

### Security

| Advisory / PR | Severity | Action Taken |
| --- | --- | --- |
| GHSA-g84c-rxfj-3j2c / alert 150 / #1553 | High | Refreshed existing issue; no established compatible minimal fix for Storybook middleware 6.1.3. |
| GHSA-w74x-v6f9-j3xg, GHSA-wjr9-j795-jxcr | Medium | Accessible `fast-uri` alerts; Moderate-only changes remain Renovate-owned. |
| GHSA-6pq8-jhm2-2vcw | Medium | Accessible `qs` alert; no unrelated dependency changes. |
| GHSA-477h-4r7f-fvrx / #1594 | Medium | Registry-only `pbkdf2` advisory; reuse existing issue and Renovate ownership. |
| #1637, #1635, #1631, #1628, #1593, #1590 | Historical security updates | Retain owner disposition; no superseded-lockfile restoration, merge or closure. |

Dependabot access succeeds: **eight open alerts**, one High, three Medium, four Low, no Critical. Full audit reports **one High/four Moderate/four Low**; production-only audit reports **zero vulnerabilities**. The registry's additional Moderate finding is `pbkdf2`. No matching open middleware security-update PR was found.

Installed `@storybook/builder-webpack5@10.6.8` requires `webpack-dev-middleware ^6.1.2`; installed middleware is **6.1.3**. Fresh [coordinated advisory](https://github.com/advisories/GHSA-g84c-rxfj-3j2c) prose requires **8.3.0 with no 5.x/6.x/7.x backport**, structured metadata names **7.4.6**, and the registry audit says **>=7.4.5**. Every candidate crosses the installed major. Contradictory metadata is not proof of patched compatible bytes; no speculative override or broad builder migration. Static Storybook success does not establish dev-server traversal protection. Keep the affected development server away from untrusted traffic.

The original Next/Storybook/Vite/follow-redirects/sharp/source-map-js targets of the historical security PRs are absent from today's default-branch audit. Fresh GitHub data confirms picomatch GHSA-fc5q-39xc-vjpf remains withdrawn since November 18; its historical failed check is not an active patch mandate.

Tracked-file scans found no confirmed literal private key, mnemonic, wallet secret, credential-bearing Alchemy/Infura RPC literal, or direct runtime `eval()`/`Function()` invocation. `.env.example` is the only tracked environment file: credential placeholders, empty optional fields and a localhost application URL. RPC credentials are composed from validated `env`. These are scoped scans, not an exhaustive secret-history audit; no credential values are reproduced.

### Code Quality & Repo Hygiene

| Check | Result | Action |
| --- | --- | --- |
| Next.js build | ✅ Pass | Production build succeeds; independent types pass. |
| Test coverage | ✅ Meets thresholds | S/B/F/L **65.56/66.61/59.54/65.99%**, unchanged from #1752. |
| Storybook build | ✅ Pass | Static build succeeds; asset/entrypoint warnings, main entrypoint 4.08 MiB. |
| Design system | ✅ Valid | All four completeness checks pass. |
| Web3 patterns | ✅ Valid | All seven checks pass; manual convention exceptions remain below. |
| Stale TODOs | 1 found | Refreshed #1507: archived monitoring example, 161 days old. |
| Convention drift | ⚠️ Issues | Existing #1523/#1554/#1559/#1560/#1561 and cleanup PRs. |
| AGENTS.md accuracy | ⚠️ Drifted | Refreshed #1555; root commands/directories match, primary reference lags. |

Plain and coverage runs each pass **71 files, 1,504 tests**, with **seven existing skips**. Coverage counts: statements **2904/4429**, branches **2552/3831**, functions **652/1095**, lines **2744/4158**. Unchanged budgets **59/60/55/59.5%** pass. No daily regression; #1241 was refreshed without opening a duplicate. Largest uncovered statement counts: `lib/web3/transaction-queue.ts` **176**, `hooks/use-token-filtering.ts` **135**, `hooks/use-token-balance.ts` **90**, `lib/web3/token-metadata.ts` and `hooks/use-transaction-queue.ts` **83 each**. These gaps do not establish the cause of historical variation.

**Workflow health:** fully paginated each complete UTC day **November 21–27**, checking returned counts against `total_count`: **448 runs**.

| Workflow | Success | Failure | Cancelled | Skipped |
| --- | --- | --- | --- | --- |
| CI/CD Pipeline | 44 | 17 | 5 | 0 |
| Fro Bot | 7 | 0 | 0 | 161 |
| Renovate | 106 | 0 | 0 | 83 |
| Update Repo Settings | 25 | 0 | 0 | 0 |

No workflow exceeds 50% failures; CI fails **17/61 non-cancelled runs (27.9%)**. All seven expected Fro Bot and settings schedules succeed. Commit timestamps verify output every day: #1724/#1728/#1733/#1739/#1742/#1750/#1751. The first five are code cleanups; November 26–27 are report-only, not healing. Settings automation is not expected to commit code. Registered Copilot workflows have no observed scheduled-run expectation.

All **17 failed weekly run logs** were read: **12** lock-maintenance dependency-review failures for Moderate minimatch and **five** browser failures at the disposing-heading assertion. Browser failures include main run **45327069484**, cleanup run **45541915942**, dependency run **45548611868**, runtime-update run **45731144453** and dependency run **45940133986**. The last two are **not main**. #1757 captures the unresolved root cause; immediate receipt timing remains a hypothesis. No local browser reproduction is claimed.

**Conventions:** source-root scans find **163 unsafe-cast/suppression matching lines across 13 test files**, none in production app/component/hook/lib code, and **216 relative-import matching lines across 130 files**. Import matches include test/type/loader contexts and many paths already covered by open PRs; they are not 216 independently established defects. Direct `useAppKitTheme` remains in `components/theme-sync.tsx:3`. Literal consumer colors remain there, `lib/web3/config.ts:58`, `components/ui/badge-variants.ts` and `components/ui/toast.tsx` (#1554). Token definitions, addresses, fixture values and issue-number comments are not color violations.

Production Web3 TSX client directives are present. No direct production source-root `process.env`, Tailwind JS config or CSS `@apply` found. `env.ts` is the intentional environment boundary; `playwright.config.ts:22` needs loader-aware evaluation. No new effect-state regression established. Installed Wagmi declarations deprecate account/switch-account aliases (#1560). `hooks/use-wallet.ts:168` still throws an enhanced connection error contrary to guidance; tests intentionally assert rejection (#1561). These are contract decisions, not safe deletion-only cleanups.

**Configuration freshness:** chain configuration blame is **2026-04-17**, Alchemy hosts **2026-06-20**, token tables in `lib/web3/token-filtering.ts:287+` and `lib/web3/token-validation.ts:158+` **2025-09/2026-06**. Fresh upstream `ethereum-lists/chains/_data/chains/eip155-11155111.json` confirms **11155111/ETH** and the Sepolia Alchemy host. Edit age is not verification age; complete address verification provenance remains unknown. No addresses, RPCs or enabled chains changed.

**Instructions and TODOs:** `.github/copilot-instructions.md` still names Wagmi v2/pnpm 11.27.0/Storybook v9 versus package declarations **^3.0.0/11.29.0/10.6.8**. Its `validate` description incorrectly includes Next build, and browser tests live in `e2e/`, not the legacy component test it names. `AGENTS.md:12` retains the previously verified extra-`--` filtering pitfall; `llms.txt:13` links absent `legacy.md`. No instruction or user-facing copy edited. The one actual stale annotation is `docs/archive/RFCs/RFC-001-Project-Foundation.md:323`, authored **2026-06-20**, **161 days** old calculated from the frozen date; prior report age arithmetic was not carried forward. Automation TODO-scan prose is not an actionable annotation.

### Developer Experience

None. Lint reports zero errors and two known NetworkSwitcher Fast Refresh warnings already covered by #1559. Existing alias/typed-mock PRs cover related debt. No duplicate cleanup patch or speculative fix was manufactured. This branch adds only the report; no behavior-bearing tests require changes.

### Quality Gates

| Gate | Status | Details |
| --- | --- | --- |
| Lint | ✅ | `pnpm lint`: zero errors, two known warnings. |
| Type check | ✅ | Independent `pnpm exec tsc --noEmit`: clean. |
| Unit tests | ✅ | `pnpm test`: 71 files, 1,504 passed, seven existing skips. |
| Build | ✅ | `pnpm build`: succeeds. Build skips type validation; independent tsc passes. |
| Storybook | ✅ | `pnpm run build-storybook`: succeeds. |
| Security audit | ❌ | `pnpm audit --audit-level moderate --json`: one High/four Moderate/four Low; production-only audit clean. |
| Design system | ✅ | `pnpm run validate:design-system`: four checks pass. |
| Web3 validation | ✅ | `pnpm run validate:web3`: seven checks pass. |

Commands ran serially against unchanged default-branch application/configuration bytes, bounded to four minutes each. The initial background wrapper was terminated by its one-second tool timeout; the complete command sequence was rerun with an adequate bounded wrapper. No validation configuration was changed. Coverage totals come from command output; per-file gaps from `coverage/coverage-final.json`, since this configuration does not emit `coverage-summary.json`.

### Cross-Project Intelligence (Inbound)

| Repo | Finding | Actionable for Token Toilet? | Priority |
| --- | --- | --- | --- |
| marcusrbrown/poly | Immediate vulnerability PR policy, no release-age delay, behind-base rebasing | Compare effective inherited security/rebase policy before proposing changes; preserve Renovate ownership and required gates. | Med |
| marcusrbrown/renovate-config | HEAD and pinned 5.2.17 `default.json` both inherit bfra-me 5.3.2; Fro Bot pin matches local 96b57cf9/v0.151.0 | No effective preset drift established; do not infer a required bump from HEAD alone. | Low |
| fro-bot/agent | Its workflow computes finite execution budget from the job cap, reserving delivery/cleanup time; the pinned action exposes separate bootstrap budgets and persistence/invocation outcomes | Evaluate finite execution/bootstrap budgets and explicit outcome telemetry for `.github/workflows/fro-bot.yaml`, currently `timeout: 0`, in separately authorized work. | Med |

All five focus repositories were surveyed through read-only `gh` queries, without cloning, checkout or foreign writes. Yield-farmer and poly pin **61388f23/v0.150.0**, behind this checkout's **96b57cf9/v0.151.0**; renovate-config matches this checkout. Yield-farmer and `.github` yielded no additional actionable delta. Optional absent file paths returned 404; actual workflow/config paths were found, including `default.json` rather than `default.json5`. No repository-level access failure. These are current configuration observations, not a release-note review.

`IS_SUNDAY_UTC` is unset, not `true`; category 7 was skipped entirely and its report section omitted. Today is Saturday UTC.

### Tasks for Agents

- **High middleware #1553:** inspect `.storybook/main.ts`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, authoritative patched bytes and builder API contracts. Reconcile 7.4.6 metadata with 8.3.0/no-backport prose before an isolated High-only remediation. Verify harmless loopback publicPath/traversal fixtures, Storybook and all gates. No guessed cross-major override, broad builder migration, audit suppression or unrelated updates; static builds do not prove dev-server safety.
- **Browser submission #1757:** reproduce `e2e/burn-gates.spec.ts:98–108` using the cited runs and synthetic wallet only. Trace confirmation helpers in `e2e/fixtures/`, `e2e/fixtures/network-stubs.ts:230–236`, `components/web3/disposal-flow.tsx` and `hooks/use-token-disposal.ts`. Establish actual submit/receipt transitions before changing observations. Preserve meaningful submit/final-receipt assertions; verify focused retries, representative load and the complete browser suite. No real wallets, chain enablement, deleted assertions or blind timeout increases.
- **Coverage #1241/#1608:** compare identical-source/dependency hit maps and controlled pending/resolved/error loader settlement in `components/web3/dynamic/__tests__/dynamic-components.test.tsx:152–184` and `components/web3/dynamic/token-list.tsx:36–45`. Preserve real-module coverage, budgets, assertions, includes/excludes, skips and timeouts; verify focused/plain/coverage runs under contention.
- **Historical security heads #1637/#1635/#1631/#1628/#1593/#1590:** compare original advisory/diff with current main before repair. Recheck trusted author, same-repository writable head and sensitive-file boundaries. Never restore obsolete lockfiles, batch unrelated dependencies or treat withdrawn findings as patch mandates. PR disposition, merging and closure remain unauthorized.
- **Workflow #1599 / #1736:** inspect `.github/workflows/renovate.yaml`, effective inherited policy and `docs/solutions/workflow-issues/skipped-upstream-jobs-can-satisfy-required-checks-2026-09-20.md`. Separate feedback churn, expected exclusions and Moderate minimatch dependency-review failures. Routine/Moderate updates remain Renovate-owned; no blind reruns, bypass or guardrail reduction.
- **Conventions #1523/#1554/#1559:** deduplicate against open PR file inventories before typed-mock/alias/export work. Theme/hook/color changes in `components/theme-sync.tsx`, `lib/web3/config.ts`, `components/ui/badge-variants.ts` and `components/ui/toast.tsx` need SDK/provider tracing, theme tests and light/dark verification. No broad migration in a daily patch.
- **Loader boundaries:** retain relative imports in `lib/env/index.ts` and `lib/env/validate-build-env.ts` until the actual Next loader resolves aliases. Prior blanket conversion failed despite tsc success; do not mechanically retry. Evaluate `playwright.config.ts:22` separately and verify real loader/build execution without weakening validation.
- **SDK/error contracts #1560/#1561:** trace `hooks/use-wallet.ts`, `hooks/use-wallet-switcher.ts`, consumers and mocks. Establish the rejection-contract decision before changing errors; verify success/rejection/disconnect/recovery/persistence/browser paths. No silent swallowing, chain enablement or routine version bump.
- **Instructions #1555:** establish original instruction-edit authority before reconciling `AGENTS.md:12`, `.github/copilot-instructions.md` and `llms.txt`. Verify filtering, versions, actual scripts, E2E paths and link existence; preserve first-person/user-facing copy.
- **Stale TODO #1507:** decide archival retention versus separately scoped monitoring at `docs/archive/RFCs/RFC-001-Project-Foundation.md:323`, authored June 20, 161 days old. Recheck blame/scope; no monitoring dependency or archived implementation mandate.
- **Configuration provenance:** record authoritative verification dates/sources for `lib/web3/chains.ts`, `lib/web3/alchemy-endpoints.ts` and token-filtering/token-validation address tables. Today's chain/host check is partial; report mismatches without changing addresses, RPCs or chains.
- **Cadence/runtime telemetry:** investigate unset `IS_SUNDAY_UTC` versus `.github/workflows/fro-bot.yaml:622–648` and existing #1657. Omission today is correct. Evaluate finite execution/bootstrap budgets and persistence/outcome telemetry with fixtures; preserve trust, delivery, session boundaries and Renovate-owned pins.

Deferral grants no additional trust, scope, approval or guardrail authority.

### Needs Human Attention

- High tooling advisory #1553 requires authoritative patch/compatibility evidence; keep the affected dev server away from untrusted traffic.
- Recurring hosted browser failures #1757 remain unresolved; passing requested local gates does not establish browser health.
- Owner disposition is needed for superseded security heads and the unmerged cleanup backlog; no merging or PR/diagnostic-issue closure is authorized.
- Workflow-changing #1651/#1657 and dependency/lockfile heads were execution-excluded. #1736 does not authorize unrelated dependency changes; #1632 needs Vercel quota attention.
- Wallet error-contract choice (#1561), instruction-edit authority (#1555), complete address-verification provenance and missing cadence environment propagation remain unresolved.
