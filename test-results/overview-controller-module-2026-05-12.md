# OverviewController Module Test Results

- Date: 2026-05-12 17:21:22 KST
- Branch: `test/overview-controller-module`
- Commit: `fcf5c20`
- Node: `v25.5.0`
- pnpm: `10.27.0`
- Overall result: **PASS**

## Summary

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm install --frozen-lockfile` | 0 | ✅ PASS |
| `pnpm vitest run tests/api/overviewController.test.ts` | 0 | ✅ PASS |
| `pnpm test` | 0 | ✅ PASS |
| `pnpm typecheck` | 0 | ✅ PASS |
| `pnpm build` | 0 | ✅ PASS |

## Notes

- This PR covers only `OverviewController` module wiring through the wired use case/cache path.
- `CONTRIBUTING.md` is not changed in this PR.
- Redis fallback stderr logs in the full suite are expected from existing fallback tests.

## Full command output

<details>
<summary><code>pnpm install --frozen-lockfile</code> — exit 0</summary>

```txt
Lockfile is up to date, resolution step is skipped
Already up to date

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: @nestjs/core@11.1.19, esbuild@0.21.5,               │
│   esbuild@0.27.7, msgpackr-extract@3.0.3.                                    │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 635ms using pnpm v10.27.0
```

</details>

<details>
<summary><code>pnpm vitest run tests/api/overviewController.test.ts</code> — exit 0</summary>

```txt

 RUN  v2.1.9 /Users/chamdom/Develop/x402-indexer-overview-module-test

 ✓ tests/api/overviewController.test.ts (1 test) 126ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  17:21:25
   Duration  2.43s (transform 423ms, setup 0ms, collect 951ms, tests 126ms, environment 0ms, prepare 221ms)
```

</details>

<details>
<summary><code>pnpm test</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 test /Users/chamdom/Develop/x402-indexer-overview-module-test
> vitest run


 RUN  v2.1.9 /Users/chamdom/Develop/x402-indexer-overview-module-test

 ✓ tests/pipeline/detectReorg.test.ts (5 tests) 1283ms
   ✓ detectReorg > treats the first processed block as canonical when no checkpoint exists 684ms
 ✓ tests/workers/realtimeWorker.test.ts (5 tests) 1270ms
   ✓ RealtimeWorker > waits for finality before queueing a new block 455ms
   ✓ RealtimeWorker > requeues failed realtime blocks into backfill recovery 357ms
stderr | tests/pipeline/recoverReorg.test.ts > recoverReorg > marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint
[reorg] replay range recorded for manual backfill { startBlock: '2', endBlock: '3' }

 ✓ tests/pipeline/processBlock.integration.test.ts (1 test) 1919ms
   ✓ processBlock integration > persists a promoted payment flow end-to-end 1912ms
 ✓ tests/pipeline/aggregate.test.ts (1 test) 2136ms
   ✓ updateAggregates > recomputes full-day stats across multiple batches and uses WETH price for gas 2135ms
 ✓ tests/pipeline/recoverReorg.test.ts (1 test) 1954ms
   ✓ recoverReorg > marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint 1950ms
 ✓ tests/pipeline/processBlock.branching.integration.test.ts (5 tests) 4342ms
   ✓ processBlock branching integration > stores only the block and advances the checkpoint when no transfer logs are found 1137ms
   ✓ processBlock branching integration > quarantines low-confidence evidence without promoting it into payments or daily stats 437ms
   ✓ processBlock branching integration > stores only the block when transfer logs exist but none pass candidate validation 374ms
   ✓ processBlock branching integration > keeps multiple payment evidence rows from a single transaction and aggregates both 1274ms
   ✓ processBlock branching integration > promotes a real-world-shaped direct EIP-3009 payment even when facilitator matching is absent 1119ms
 ✓ tests/db/facilitatorSource.test.ts (1 test) 2ms
 ✓ tests/api/overviewController.test.ts (1 test) 756ms
   ✓ OverviewController module wiring > resolves from the Nest container and returns overview data through the wired use case 755ms
 ✓ tests/pipeline/extractEvidence.test.ts (1 test) 479ms
   ✓ extractEvidence > promotes direct EIP-3009 evidence when calldata matches the transfer log 476ms
stderr | tests/api/app.test.ts > createApp > falls back to the database when Redis read/write operations fail
[cache] read failed, falling back to db dashboard:payments:{"limit":20,"offset":0,"payer":"0xagent"} Error: redis unavailable
    at Object.get (/Users/chamdom/Develop/x402-indexer-overview-module-test/tests/api/app.test.ts:255:17)
    at RedisDashboardCacheAdapter.readThrough (/Users/chamdom/Develop/x402-indexer-overview-module-test/src/infrastructure/cache/redis-dashboard-cache.adapter.ts:19:39)
    at ListPaymentsUseCase.execute (/Users/chamdom/Develop/x402-indexer-overview-module-test/src/application/payment/list-payments.usecase.ts:21:23)
    at PaymentsController.list (/Users/chamdom/Develop/x402-indexer-overview-module-test/src/api/payments/payments.controller.ts:20:51)
    at /Users/chamdom/Develop/x402-indexer-overview-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:38:29
    at processTicksAndRejections (node:internal/process/task_queues:104:5)
    at /Users/chamdom/Develop/x402-indexer-overview-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:46:28
    at /Users/chamdom/Develop/x402-indexer-overview-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-proxy.js:9:17
[cache] write failed, continuing without cache dashboard:payments:{"limit":20,"offset":0,"payer":"0xagent"} Error: redis unavailable
    at Object.setex (/Users/chamdom/Develop/x402-indexer-overview-module-test/tests/api/app.test.ts:258:17)
    at RedisDashboardCacheAdapter.readThrough (/Users/chamdom/Develop/x402-indexer-overview-module-test/src/infrastructure/cache/redis-dashboard-cache.adapter.ts:29:24)
    at PaymentsController.list (/Users/chamdom/Develop/x402-indexer-overview-module-test/src/api/payments/payments.controller.ts:20:20)
    at /Users/chamdom/Develop/x402-indexer-overview-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:46:28
    at /Users/chamdom/Develop/x402-indexer-overview-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-proxy.js:9:17

 ✓ tests/api/app.test.ts (8 tests) 5584ms
   ✓ createApp > returns health and payments data 2353ms
   ✓ createApp > serves the remaining read endpoints and not-found responses 626ms
   ✓ createApp > serves UI-supporting list, detail, and operations endpoints 1624ms
   ✓ createApp > falls back to the database when Redis read/write operations fail 305ms
 ✓ tests/workers/backfillWorker.test.ts (5 tests) 526ms
   ✓ splitBlockRangeIntoChunks > does not treat a canonical block as complete when no worker checkpoint advanced past it 439ms
 ✓ tests/pipeline/validateX402Candidate.test.ts (2 tests) 322ms
   ✓ validateX402Candidates > keeps a candidate in soft mode when facilitator is unknown 311ms
 ✓ tests/pipeline/deriveDomain.test.ts (1 test) 467ms
   ✓ deriveDomain > keeps the earliest first_seen_block when older history is backfilled later 464ms
 ✓ tests/db/addressRegistry.test.ts (1 test) 78ms

 Test Files  14 passed (14)
      Tests  38 passed (38)
   Start at  17:21:28
   Duration  15.39s (transform 3.30s, setup 0ms, collect 51.99s, tests 21.12s, environment 17ms, prepare 6.23s)
```

</details>

<details>
<summary><code>pnpm typecheck</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 typecheck /Users/chamdom/Develop/x402-indexer-overview-module-test
> tsc --noEmit -p tsconfig.json
```

</details>

<details>
<summary><code>pnpm build</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 build /Users/chamdom/Develop/x402-indexer-overview-module-test
> tsc -p tsconfig.json
```

</details>
