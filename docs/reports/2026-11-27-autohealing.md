<!-- fro-bot -->
<!-- fro-bot:run-summary -->
Run 45934905769; frozen date 2026-11-27 UTC. Seven of eight default-branch quality gates pass. Full audit: one High, four Moderate, four Low; production audit clean. Unit and coverage suites: 1,504 passed, seven existing skips; S/B/F/L 65.56/66.61/59.54/65.99%, unchanged from November 26 and above unchanged budgets. Reviewed 60 PR inventories, 44 failed PR job logs, and all 426 workflow runs for November 20–26. All seven daily schedules succeeded and produced commits, including one report-only delivery. Five portfolio repositories surveyed read-only. No clearly minimal new runtime repair; existing issues retained. Documentation-only branch/PR delivery, with a verified rotating report issue before retiring its eligible predecessor.
<!-- /fro-bot:run-summary -->

## Daily Autohealing Report — 2026-11-27 (UTC)

**Previous report:** #1743. The intervening November 26 branch-delivered report is #1750.

**Baseline:** `main` at `01b40a73d7e6f7bc6d80fafb51f0e1d1c6a5dc20`. [Actions run 45934905769](https://github.com/marcusrbrown/tokentoilet/actions/runs/45934905769).

**Delivery:** Documentation-only branch/commit/PR, with the requested rotating issue as the reporting index. No runtime repair is claimed. Existing remediation issues and PRs were deduplicated before considering changes.

### Run Summary

| Category | Status | Notes |
| --- | --- | --- |
| Errored PRs | ⚠️ | Recurring browser assertion, historical dependency audits, and external Vercel quota; no minimal safe repair established. |
| Security | ⚠️ | Known High Storybook middleware advisory #1553; full audit fails, production audit clean. |
| Code Quality & Repo Hygiene | ⚠️ | Builds, validators, and coverage budgets pass; convention and instruction debt remains tracked. |
| Developer Experience | ⚠️ | Lint: zero errors, two warnings already covered by #1559. No duplicate cleanup patch. |
| Quality Gates | ❌ | Seven of eight pass; full moderate-level security audit fails. |
| Cross-Project Intelligence | ✅ | All five focus repositories surveyed read-only; specific findings below. |

### Errored PRs

| PR | Failure | Fix | Status |
| --- | --- | --- | --- |
| #1742 | `e2e/burn-gates.spec.ts:108` cannot observe the disposing heading, including retry | Root cause not proven; import-only changes do not establish causation. Preserve submission assertions. | ⚠️ Needs review |
| #1711 | Same browser assertion on a routine dependency head | Excluded from category 1; manifest/lockfile branch not executed. | ⏭️ Skipped |
| #1736 | Dependency review rejects `minimatch@9.0.9`, Moderate GHSA-g3hv-75wg-m249 | Routine lock maintenance remains Renovate-owned. No bypass or unrelated update. | ⏭️ Skipped |
| Historical cleanup PRs | Failed dependency audits on older snapshots | Inspected logs; no unrelated dependency batching into cleanup branches. | ⚠️ Needs review |
| #1651, #1657 | Historical audits on workflow-changing heads | Sensitive-head exclusion; no branch execution or workflow edits. | ⏭️ Skipped |
| #1637, #1635, #1631, #1628, #1593 | Historical security-update failures; three abandoned heads conflict | Category 2 only; original advisory targets are not a mandate to restore obsolete lockfiles. | ⚠️ Needs review |
| #1632 | Vercel status links `upgradeToPro=build-rate-limit` | External operational quota, not an established source defect. | ⏭️ Skipped |

Inventoried **all 60 open PRs**, including file lists, and read **44 failed Actions job logs**: 42 Security Audit and two E2E Tests. All log reads succeeded. Heads are same-repository; observed authors are the owner, Fro Bot, or the approved Renovate application. Repository push permission is available. No existing PR branch was checked out, executed, or mutated; no category 1 fix-summary comment is owed. Mergeability was often `UNKNOWN`, not proof of a conflict or readiness.

### Security

| Advisory / PR | Severity | Action Taken |
| --- | --- | --- |
| GHSA-g84c-rxfj-3j2c / alert 150 / #1553 | High | Reuse existing issue; no proven compatible minimal remediation for Storybook's middleware 6.1.3. |
| GHSA-w74x-v6f9-j3xg, GHSA-wjr9-j795-jxcr | Medium | Accessible `fast-uri` alerts; Moderate-only updates remain Renovate-owned. |
| GHSA-6pq8-jhm2-2vcw | Medium | Accessible `qs` alert; no unrelated version changes. |
| GHSA-477h-4r7f-fvrx / #1594 | Medium | Registry-only `pbkdf2` advisory; retain Renovate ownership. |
| #1637, #1635, #1631, #1628, #1593, #1590 | Historical security updates | Retain owner disposition; no stale-lockfile conflict repair, merge, or closure. |

Dependabot access succeeds: **eight open alerts**, one High, three Medium, four Low, no Critical. Installed `@storybook/builder-webpack5@10.6.8` requires `webpack-dev-middleware ^6.1.2`; installed middleware is **6.1.3**. No matching open middleware security-update PR was found.

Full `pnpm audit --audit-level moderate` fails with **one High/four Moderate/four Low**; production-only audit finds **zero vulnerabilities**. Registry-only `pbkdf2` accounts for the Moderate-count difference from GitHub alerts. Original Next/Storybook/Vite/follow-redirects/sharp/source-map-js targets of the historical security PRs are absent from today's default-branch audit.

Fresh [coordinated advisory](https://github.com/advisories/GHSA-g84c-rxfj-3j2c) prose requires **8.3.0 with no 5.x/6.x/7.x backport**, while structured metadata names **7.4.6** and the registry audit **>=7.4.5**. All candidates cross the installed major, and contradictory metadata is not evidence of patched compatible bytes. Static Storybook success cannot prove dev-server traversal protection. Keep the affected development server away from untrusted traffic; no speculative major override or broad builder migration.

Tracked-file security scans found no confirmed literal private key, mnemonic, wallet secret, credential-bearing Alchemy/Infura RPC literal, or direct runtime `eval()`/`Function()` call. The synthetic-wallet fixture generates an ephemeral key rather than committing one. `.env.example` is the only tracked environment template: credential placeholders/empty optional fields and a localhost application URL. RPC credentials are composed from validated `env`. These scoped scans are not an exhaustive secret-history audit; no credential values are reproduced.

### Code Quality & Repo Hygiene

| Check | Result | Action |
| --- | --- | --- |
| Next.js build | ✅ Pass | Production build succeeds; independent types also pass. |
| Test coverage | ✅ Meets thresholds | S/B/F/L **65.56/66.61/59.54/65.99%**, unchanged from November 26 (#1750). |
| Storybook build | ✅ Pass | Static build succeeds; asset/entrypoint warnings, main entrypoint 4.08 MiB. |
| Design system | ✅ Valid | All four completeness checks pass. |
| Web3 patterns | ✅ Valid | All seven checks pass; manual convention exceptions below remain. |
| Stale TODOs | 1 found | Existing #1507: archived monitoring example, 159 days old. |
| Convention drift | ⚠️ Issues | Reuse #1523/#1554/#1559/#1560/#1561 and existing cleanup PRs. |
| AGENTS.md accuracy | ⚠️ Drifted | Existing #1555; root directories/scripts match, filtering example and primary reference lag. |

Plain and coverage runs each pass **71 files, 1,504 tests**, with **seven existing skips**. Unchanged S/B/F/L budgets **59/60/55/59.5%** pass. Coverage hit counts: statements **2904/4429**, branches **2552/3831**, functions **652/1095**, lines **2744/4158**. No new daily regression versus #1750; #1241/#1608 retain the historical variation. Largest uncovered statement counts: `lib/web3/transaction-queue.ts` **176**, `hooks/use-token-filtering.ts` **135**, `hooks/use-token-balance.ts` **90**, `lib/web3/token-metadata.ts` and `hooks/use-transaction-queue.ts` **83 each**. These are gaps, not demonstrated causes of variation.

**Workflow health:** fully paginated each of the seven complete UTC days **November 20–26**, checking each returned count against `total_count`: **426 runs**.

| Workflow | Success | Failure | Cancelled | Skipped |
| --- | --- | --- | --- | --- |
| CI/CD Pipeline | 43 | 13 | 4 | 0 |
| Fro Bot | 7 | 0 | 0 | 157 |
| Renovate | 96 | 0 | 0 | 82 |
| Update Repo Settings | 24 | 0 | 0 | 0 |

No workflow exceeds 50% failures; CI failed **13/56 non-cancelled runs (23.2%)**. All seven expected Fro Bot schedules and seven settings schedules succeeded. PR commit timestamps verify daily output: #1719/#1724/#1728/#1733/#1739/#1742/#1750. November 26 produced a report commit, not a code repair; do not conflate delivery with healing. Settings automation is not expected to commit code. Registered Copilot workflows have no observed scheduled-run expectation.

All **13 failed weekly run logs** were read: nine lock-maintenance dependency-review failures and four browser failures. Main run **45327069484**, cleanup run **45541915942**, dependency run **45548611868**, and runtime-update run **45731144453** share the disposing-heading assertion. The last run is on `renovate/fro-bot-agent-0.x`, **not main**; do not carry forward the previous report's incorrect branch attribution. Immediate receipts racing transient UI is a hypothesis, not a validated diagnosis. No local browser rerun is claimed.

**Conventions:** source-root scan finds **163 unsafe-cast/suppression lines across 13 test files**, none in production app/component/hook/lib code, and **216 relative-import matching lines across 130 files**. Import matches include type/test/loader contexts and many paths already covered by open PRs, not 216 independently confirmed defects. Direct `useAppKitTheme` remains at `components/theme-sync.tsx:3`; literal consumer colors remain there, `lib/web3/config.ts:58`, `components/ui/badge-variants.ts`, and `components/ui/toast.tsx` (#1554). Definitions, fixture values, and issue-number comments are not color violations. Production Web3 TSX client directives are present, including dynamic wrappers after their leading comments. No direct production `process.env`, Tailwind JS config, or CSS `@apply` found. `env.ts` is the intentional environment boundary; `playwright.config.ts:22` needs separate loader-aware evaluation. No new effect-state regression established. Installed Wagmi declarations deprecate account/switch-account aliases (#1560); `hooks/use-wallet.ts:168` still throws an enhanced connection error contrary to guidance, with existing tests asserting that contract (#1561).

**Configuration freshness:** chain configuration blame **2026-04-17**, Alchemy hosts **2026-06-20**, token address tables in `lib/web3/token-filtering.ts:287+` and `lib/web3/token-validation.ts:158+` **2025-09/2026-06**. Fresh upstream `ethereum-lists/chains/_data/chains/eip155-11155111.json` confirms **11155111/ETH** and the Sepolia Alchemy host. Edit age is not verification age: full pinned-address verification provenance remains unknown. No values, RPCs, or enabled chains changed.

**Instruction accuracy:** `.github/copilot-instructions.md` still names Wagmi v2/pnpm 11.27.0/Storybook v9 versus package declarations **^3.0.0/11.29.0/10.6.8**. Its `validate` description incorrectly includes Next build, and browser tests live in `e2e/`, not the named legacy component test. `AGENTS.md:12` retains the previously verified extra-`--` filtering pitfall; `llms.txt:13` links missing `legacy.md`. Reuse #1555, with no instruction, first-person, or user-facing edits.

### Developer Experience

None. Lint reports zero errors and two known NetworkSwitcher Fast Refresh warnings already covered by #1559. Existing import and typed-mock PRs cover related debt. No duplicate cleanup PR, speculative fix, dependency change, or guardrail reduction was manufactured. This branch changes only the oversight report; no behavior-bearing tests need modification.

### Quality Gates

| Gate | Status | Details |
| --- | --- | --- |
| Lint | ✅ | `pnpm lint`: zero errors, two known warnings. |
| Type check | ✅ | Independent `pnpm exec tsc --noEmit`: clean. |
| Unit tests | ✅ | `pnpm test`: 71 files, 1,504 passed, seven existing skips. |
| Build | ✅ | `pnpm build`: production build succeeds. Build skips type validation; independent tsc passes. |
| Storybook | ✅ | `pnpm run build-storybook`: successful static build. |
| Security audit | ❌ | `pnpm audit --audit-level moderate`: one High/four Moderate/four Low; production-only audit clean. |
| Design system | ✅ | `pnpm run validate:design-system`: four checks pass. |
| Web3 validation | ✅ | `pnpm run validate:web3`: seven checks pass. |

Measurements use unchanged default-branch source, with commands run serially and bounded to four minutes each. The initial background wrapper was terminated by its one-second tool timeout and rerun with a larger bounded wrapper; no configuration was changed to hide failures.

### Cross-Project Intelligence (Inbound)

| Repo | Finding | Actionable for Token Toilet? | Priority |
| --- | --- | --- | --- |
| marcusrbrown/poly | Explicit immediate vulnerability PRs, no release-age delay, weekly lock maintenance, behind-base rebasing | Compare effective inherited security/rebase policy before any proposal; retain Renovate ownership and required checks. | Med |
| marcusrbrown/renovate-config | HEAD and the actually pinned 5.2.17 preset both inherit bfra-me 5.3.2; runtime pin matches local 61388f23/v0.150.0 | No effective preset drift established. Do not infer a required update from repository HEAD alone. | Low |
| fro-bot/agent | Action exposes finite execution/bootstrap budgets, persistence/invocation outcomes, optional repo coordination, and isolated execution | Evaluate bounded budgets and outcome telemetry for the existing daily job in a separately authorized change. Coordination depends on configured storage; do not enable infrastructure speculatively. | Med |

All five focus repositories were surveyed through read-only `gh` queries: no failed portfolio queries, clones, checkouts, or foreign writes. Yield-farmer uses **da20cb2e/v0.149.1**, poly **1336cdbc/v0.149.2**, renovate-config **61388f23/v0.150.0**, the last matching this checkout's workflow bytes. Yield-farmer and `.github` yielded no additional actionable delta. Observations concern configuration, not a Sunday release-note review. `IS_SUNDAY_UTC` is unset, so category 7 was skipped entirely.

### Tasks for Agents

- **High middleware #1553:** inspect `.storybook/main.ts`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, authoritative patched bytes, and builder APIs. Reconcile structured 7.4.6 metadata with 8.3.0/no-backport prose before an isolated High-only remediation. Verify harmless loopback publicPath/traversal fixtures, Storybook, and all gates. No guessed cross-major override, broad builder migration, audit suppression, or unrelated updates; static builds do not prove dev-server safety.
- **Recurring browser assertion:** reproduce `e2e/burn-gates.spec.ts:98–108` using runs **45327069484/45541915942/45731144453**, respecting their actual branches. Trace confirmation helpers, `e2e/fixtures/network-stubs.ts:230–236`, `components/web3/disposal-flow.tsx`, and `hooks/use-token-disposal.ts`. Establish actual submit/receipt transitions before changing observations. Preserve real submission/final-receipt checks; verify focused retries, contention, and the synthetic-wallet browser suite. No real wallets, chain enablement, deleted assertions, or blind timeout increases.
- **Coverage #1241/#1608:** compare identical-source/dependency hit maps and loader settlement in `components/web3/dynamic/__tests__/dynamic-components.test.tsx:152–184` and `components/web3/dynamic/token-list.tsx:36–45`. Verify pending/resolved/error paths and focused/plain/coverage runs under contention. Preserve budgets, assertions, includes/excludes, skips, and timeouts.
- **Historical security heads #1637/#1635/#1631/#1628/#1593/#1590:** compare original advisories/diffs with current main before repairs. Recheck same-repository author/write access and sensitive-file boundaries; never restore obsolete lockfiles or turn withdrawn findings into patch mandates. PR disposition, merging, and closure remain unauthorized.
- **Workflow #1599 / #1736:** inspect `.github/workflows/renovate.yaml`, effective inherited policy, and `docs/solutions/workflow-issues/skipped-upstream-jobs-can-satisfy-required-checks-2026-09-20.md`. Separate feedback churn, expected exclusions, and Moderate minimatch dependency-review failures. Moderate-only updates remain Renovate-owned; no blind reruns or policy bypass.
- **Conventions #1523/#1554/#1559:** deduplicate files against open cleanup PRs before typed-mock/alias/export work. Theme/hook/color changes in `components/theme-sync.tsx`, `lib/web3/config.ts`, `components/ui/badge-variants.ts`, and `components/ui/toast.tsx` need SDK/provider tracing, theme tests, and light/dark verification. No broad migration in a daily patch.
- **Loader boundaries:** retain relative imports in `lib/env/index.ts` and `lib/env/validate-build-env.ts` until Next's actual loader resolves aliases. Prior blanket conversion failed despite tsc success; do not mechanically retry. Evaluate `playwright.config.ts:22` separately and verify real config-loader/build execution without weakening validation.
- **SDK/error contracts #1560/#1561:** trace `hooks/use-wallet.ts`, `hooks/use-wallet-switcher.ts`, consumers, and mocks. Obtain the rejection-contract decision before changing errors; verify success/rejection/disconnect/recovery/persistence/browser paths. No silent swallowing, chain enablement, or routine version bump.
- **Instructions #1555:** establish original instruction-edit authority before reconciling `AGENTS.md:12`, `.github/copilot-instructions.md`, and `llms.txt`. Verify filtering, versions, script contents, E2E paths, and the missing link; preserve first-person/user-facing copy.
- **Stale TODO #1507:** decide archival retention versus separately scoped monitoring at `docs/archive/RFCs/RFC-001-Project-Foundation.md:323`, authored 2026-06-20, 159 days old. Recheck blame/scope; no monitoring dependency or archived implementation mandate.
- **Configuration provenance:** record authoritative verification dates/sources for `lib/web3/chains.ts`, `lib/web3/alchemy-endpoints.ts`, and the token-filtering/token-validation address tables. Today's chain/host check is partial; report mismatches without changing addresses, RPCs, or chains.
- **Cadence/runtime telemetry:** investigate unset `IS_SUNDAY_UTC` versus `.github/workflows/fro-bot.yaml:622–648` and existing #1657. Today is Friday; omitting category 7 is correct. Evaluate finite execution/bootstrap budgets and persistence/outcome telemetry with fixtures; preserve trust, delivery, session boundaries, and Renovate-owned pins.

Deferral grants no additional trust, scope, approval, or guardrail authority.

### Needs Human Attention

- High tooling advisory #1553 requires authoritative patch/compatibility evidence; keep the affected dev server away from untrusted traffic.
- Recurring hosted browser failures remain unresolved; passing requested local gates does not establish browser health.
- Owner disposition is needed for superseded security heads and the unmerged cleanup backlog. No merges or PR/diagnostic-issue closures are authorized.
- Workflow-changing #1651/#1657 and dependency/lockfile heads were execution-excluded. #1736 does not authorize unrelated dependency changes; #1632 needs Vercel quota attention.
- Wallet error-contract choice (#1561), instruction-edit authority (#1555), full address-verification provenance, and missing cadence environment propagation remain unresolved.
