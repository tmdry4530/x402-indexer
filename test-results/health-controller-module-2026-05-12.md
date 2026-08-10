# HealthController Module Test Results

- Date: 2026-05-12 17:21:22 KST
- Branch: `test/health-controller-module`
- Commit: `5fcddfb`
- Node: `v25.5.0`
- pnpm: `10.27.0`
- Overall result: **PASS**

## Summary

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm install --frozen-lockfile` | 0 | ✅ PASS |
| `pnpm vitest run tests/api/healthController.test.ts` | 0 | ✅ PASS |
| `pnpm test` | 0 | ✅ PASS |
| `pnpm typecheck` | 0 | ✅ PASS |
| `pnpm build` | 0 | ✅ PASS |

## Notes

- This PR covers only `HealthController` module wiring and response contract.
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
Done in 609ms using pnpm v10.27.0
```

</details>

<details>
<summary><code>pnpm vitest run tests/api/healthController.test.ts</code> — exit 0</summary>

```txt

 RUN  v2.1.9 /Users/chamdom/Develop/x402-indexer-health-module-test

 ✓ tests/api/healthController.test.ts (1 test) 175ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  17:21:24
   Duration  2.61s (transform 469ms, setup 0ms, collect 1.21s, tests 175ms, environment 0ms, prepare 268ms)
```

</details>

<details>
<summary><code>pnpm test</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 test /Users/chamdom/Develop/x402-indexer-health-module-test
> vitest run


 RUN  v2.1.9 /Users/chamdom/Develop/x402-indexer-health-module-test

 ✓ tests/workers/realtimeWorker.test.ts (5 tests) 1132ms
   ✓ RealtimeWorker > waits for finality before queueing a new block 441ms
   ✓ RealtimeWorker > delegates missed realtime gaps to backfill instead of treating them as reorgs 321ms
 ✓ tests/pipeline/detectReorg.test.ts (5 tests) 1415ms
   ✓ detectReorg > treats the first processed block as canonical when no checkpoint exists 511ms
   ✓ detectReorg > returns the common ancestor when parentHash diverges from the checkpoint hash 349ms
 ✓ tests/pipeline/processBlock.integration.test.ts (1 test) 1572ms
   ✓ processBlock integration > persists a promoted payment flow end-to-end 1565ms
 ✓ tests/pipeline/aggregate.test.ts (1 test) 1389ms
   ✓ updateAggregates > recomputes full-day stats across multiple batches and uses WETH price for gas 1388ms
stderr | tests/pipeline/recoverReorg.test.ts > recoverReorg > marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint
[reorg] replay range recorded for manual backfill { startBlock: '2', endBlock: '3' }

 ✓ tests/pipeline/recoverReorg.test.ts (1 test) 2339ms
   ✓ recoverReorg > marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint 2336ms
 ✓ tests/pipeline/processBlock.branching.integration.test.ts (5 tests) 3809ms
   ✓ processBlock branching integration > stores only the block and advances the checkpoint when no transfer logs are found 975ms
   ✓ processBlock branching integration > keeps multiple payment evidence rows from a single transaction and aggregates both 1411ms
   ✓ processBlock branching integration > promotes a real-world-shaped direct EIP-3009 payment even when facilitator matching is absent 940ms
 ✓ tests/db/facilitatorSource.test.ts (1 test) 64ms
stderr | tests/api/app.test.ts > createApp > falls back to the database when Redis read/write operations fail
[cache] read failed, falling back to db dashboard:payments:{"limit":20,"offset":0,"payer":"0xagent"} Error: redis unavailable
    at Object.get (/Users/chamdom/Develop/x402-indexer-health-module-test/tests/api/app.test.ts:255:17)
    at RedisDashboardCacheAdapter.readThrough (/Users/chamdom/Develop/x402-indexer-health-module-test/src/infrastructure/cache/redis-dashboard-cache.adapter.ts:19:39)
    at ListPaymentsUseCase.execute (/Users/chamdom/Develop/x402-indexer-health-module-test/src/application/payment/list-payments.usecase.ts:21:23)
    at PaymentsController.list (/Users/chamdom/Develop/x402-indexer-health-module-test/src/api/payments/payments.controller.ts:20:51)
    at /Users/chamdom/Develop/x402-indexer-health-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:38:29
    at processTicksAndRejections (node:internal/process/task_queues:104:5)
    at /Users/chamdom/Develop/x402-indexer-health-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:46:28
    at /Users/chamdom/Develop/x402-indexer-health-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-proxy.js:9:17
[cache] write failed, continuing without cache dashboard:payments:{"limit":20,"offset":0,"payer":"0xagent"} Error: redis unavailable
    at Object.setex (/Users/chamdom/Develop/x402-indexer-health-module-test/tests/api/app.test.ts:258:17)
    at RedisDashboardCacheAdapter.readThrough (/Users/chamdom/Develop/x402-indexer-health-module-test/src/infrastructure/cache/redis-dashboard-cache.adapter.ts:29:24)
    at PaymentsController.list (/Users/chamdom/Develop/x402-indexer-health-module-test/src/api/payments/payments.controller.ts:20:20)
    at /Users/chamdom/Develop/x402-indexer-health-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:46:28
    at /Users/chamdom/Develop/x402-indexer-health-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-proxy.js:9:17

 ✓ tests/api/app.test.ts (8 tests) 5139ms
   ✓ createApp > returns health and payments data 2046ms
   ✓ createApp > serves the remaining read endpoints and not-found responses 763ms
   ✓ createApp > serves UI-supporting list, detail, and operations endpoints 1099ms
   ✓ createApp > validates backfill requests and reports worker availability 436ms
   ✓ createApp > serves cached dashboard responses from Redis on repeated reads 305ms
 ✓ tests/pipeline/extractEvidence.test.ts (1 test) 562ms
   ✓ extractEvidence > promotes direct EIP-3009 evidence when calldata matches the transfer log 561ms
 ✓ tests/pipeline/validateX402Candidate.test.ts (2 tests) 450ms
   ✓ validateX402Candidates > keeps a candidate in soft mode when facilitator is unknown 438ms
 ✓ tests/workers/backfillWorker.test.ts (5 tests) 892ms
   ✓ splitBlockRangeIntoChunks > does not treat a canonical block as complete when no worker checkpoint advanced past it 492ms
   ✓ splitBlockRangeIntoChunks > processes an older missing backfill block without regressing the worker checkpoint 357ms
 ✓ tests/pipeline/deriveDomain.test.ts (1 test) 716ms
   ✓ deriveDomain > keeps the earliest first_seen_block when older history is backfilled later 713ms
 ✓ tests/api/healthController.test.ts (1 test) 218ms
 ✓ tests/db/addressRegistry.test.ts (1 test) 162ms

 Test Files  14 passed (14)
      Tests  38 passed (38)
   Start at  17:21:28
   Duration  15.34s (transform 2.49s, setup 0ms, collect 55.17s, tests 19.86s, environment 20ms, prepare 4.97s)
```

</details>

<details>
<summary><code>pnpm typecheck</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 typecheck /Users/chamdom/Develop/x402-indexer-health-module-test
> tsc --noEmit -p tsconfig.json
```

</details>

<details>
<summary><code>pnpm build</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 build /Users/chamdom/Develop/x402-indexer-health-module-test
> tsc -p tsconfig.json
```

</details>
