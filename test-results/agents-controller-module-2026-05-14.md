# AgentsController Module Test Results

- Date: 2026-05-14 10:18:00 KST
- Branch: `test/agents-controller-module`
- Commit: `b41871d`
- Node: `v25.5.0`
- pnpm: `10.27.0`
- Overall result: **PASS**

## Summary

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm install --frozen-lockfile` | 0 | ✅ PASS |
| `pnpm vitest run tests/api/agentsController.test.ts` | 0 | ✅ PASS |
| `pnpm test` | 0 | ✅ PASS |
| `pnpm typecheck` | 0 | ✅ PASS |
| `pnpm build` | 0 | ✅ PASS |

## Notes

- This PR covers only `AgentsController` module wiring through the wired use case/cache paths.
- `CONTRIBUTING.md` is not changed in this PR.
- Redis fallback stderr logs in the full suite are expected from existing fallback tests.

## Full command output

<details>
<summary><code>pnpm install --frozen-lockfile</code> — exit 0</summary>

```txt
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +246
++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved 246, reused 245, downloaded 0, added 101
Progress: resolved 246, reused 246, downloaded 0, added 242
Progress: resolved 246, reused 246, downloaded 0, added 244
Progress: resolved 246, reused 246, downloaded 0, added 245
Progress: resolved 246, reused 246, downloaded 0, added 246
Progress: resolved 246, reused 246, downloaded 0, added 246, done

dependencies:
+ @nestjs/common 11.1.19
+ @nestjs/core 11.1.19
+ @nestjs/platform-express 11.1.19
+ bullmq 5.75.2
+ dotenv 16.6.1
+ ioredis 5.10.1
+ pg 8.20.0
+ reflect-metadata 0.2.2
+ rxjs 7.8.2
+ viem 2.48.1
+ zod 3.25.76

devDependencies:
+ @types/node 22.19.17
+ @types/pg 8.20.0
+ @types/supertest 7.2.0
+ pg-mem 3.0.14
+ supertest 7.2.2
+ tsx 4.21.0
+ typescript 5.9.3
+ vitest 2.1.9

╭ Warning ─────────────────────────────────────────────────────────────────────╮
│                                                                              │
│   Ignored build scripts: @nestjs/core@11.1.19, esbuild@0.21.5,               │
│   esbuild@0.27.7, msgpackr-extract@3.0.3.                                    │
│   Run "pnpm approve-builds" to pick which dependencies should be allowed     │
│   to run scripts.                                                            │
│                                                                              │
╰──────────────────────────────────────────────────────────────────────────────╯
Done in 5.7s using pnpm v10.27.0
```

</details>

<details>
<summary><code>pnpm vitest run tests/api/agentsController.test.ts</code> — exit 0</summary>

```txt

 RUN  v2.1.9 /Users/chamdom/Develop/x402-indexer-agents-module-test

 ✓ tests/api/agentsController.test.ts (1 test) 150ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  10:18:09
   Duration  3.63s (transform 800ms, setup 0ms, collect 1.27s, tests 150ms, environment 0ms, prepare 229ms)
```

</details>

<details>
<summary><code>pnpm test</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 test /Users/chamdom/Develop/x402-indexer-agents-module-test
> vitest run


 RUN  v2.1.9 /Users/chamdom/Develop/x402-indexer-agents-module-test

 ✓ tests/pipeline/detectReorg.test.ts (5 tests) 1682ms
   ✓ detectReorg > treats the first processed block as canonical when no checkpoint exists 474ms
   ✓ detectReorg > returns the common ancestor when parentHash diverges from the checkpoint hash 453ms
 ✓ tests/workers/realtimeWorker.test.ts (5 tests) 1513ms
   ✓ RealtimeWorker > waits for finality before queueing a new block 567ms
   ✓ RealtimeWorker > requeues failed realtime blocks into backfill recovery 322ms
 ✓ tests/pipeline/processBlock.integration.test.ts (1 test) 1675ms
   ✓ processBlock integration > persists a promoted payment flow end-to-end 1673ms
stderr | tests/pipeline/recoverReorg.test.ts > recoverReorg > marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint
[reorg] replay range recorded for manual backfill { startBlock: '2', endBlock: '3' }

 ✓ tests/pipeline/recoverReorg.test.ts (1 test) 1700ms
   ✓ recoverReorg > marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint 1698ms
 ✓ tests/pipeline/aggregate.test.ts (1 test) 2484ms
   ✓ updateAggregates > recomputes full-day stats across multiple batches and uses WETH price for gas 2481ms
 ✓ tests/pipeline/processBlock.branching.integration.test.ts (5 tests) 3398ms
   ✓ processBlock branching integration > stores only the block and advances the checkpoint when no transfer logs are found 905ms
   ✓ processBlock branching integration > keeps multiple payment evidence rows from a single transaction and aggregates both 1372ms
   ✓ processBlock branching integration > promotes a real-world-shaped direct EIP-3009 payment even when facilitator matching is absent 601ms
 ✓ tests/db/facilitatorSource.test.ts (1 test) 18ms
 ✓ tests/api/agentsController.test.ts (1 test) 311ms
   ✓ AgentsController module wiring > resolves from the Nest container and returns agents through the wired use cases 310ms
stderr | tests/api/app.test.ts > createApp > falls back to the database when Redis read/write operations fail
[cache] read failed, falling back to db dashboard:payments:{"limit":20,"offset":0,"payer":"0xagent"} Error: redis unavailable
    at Object.get (/Users/chamdom/Develop/x402-indexer-agents-module-test/tests/api/app.test.ts:255:17)
    at RedisDashboardCacheAdapter.readThrough (/Users/chamdom/Develop/x402-indexer-agents-module-test/src/infrastructure/cache/redis-dashboard-cache.adapter.ts:19:39)
    at ListPaymentsUseCase.execute (/Users/chamdom/Develop/x402-indexer-agents-module-test/src/application/payment/list-payments.usecase.ts:21:23)
    at PaymentsController.list (/Users/chamdom/Develop/x402-indexer-agents-module-test/src/api/payments/payments.controller.ts:20:51)
    at /Users/chamdom/Develop/x402-indexer-agents-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:38:29
    at processTicksAndRejections (node:internal/process/task_queues:104:5)
    at /Users/chamdom/Develop/x402-indexer-agents-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:46:28
    at /Users/chamdom/Develop/x402-indexer-agents-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-proxy.js:9:17
[cache] write failed, continuing without cache dashboard:payments:{"limit":20,"offset":0,"payer":"0xagent"} Error: redis unavailable
    at Object.setex (/Users/chamdom/Develop/x402-indexer-agents-module-test/tests/api/app.test.ts:258:17)
    at RedisDashboardCacheAdapter.readThrough (/Users/chamdom/Develop/x402-indexer-agents-module-test/src/infrastructure/cache/redis-dashboard-cache.adapter.ts:29:24)
    at PaymentsController.list (/Users/chamdom/Develop/x402-indexer-agents-module-test/src/api/payments/payments.controller.ts:20:20)
    at /Users/chamdom/Develop/x402-indexer-agents-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:46:28
    at /Users/chamdom/Develop/x402-indexer-agents-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-proxy.js:9:17

 ✓ tests/api/app.test.ts (8 tests) 4870ms
   ✓ createApp > returns health and payments data 1909ms
   ✓ createApp > serves the remaining read endpoints and not-found responses 655ms
   ✓ createApp > serves UI-supporting list, detail, and operations endpoints 1247ms
   ✓ createApp > validates backfill requests and reports worker availability 365ms
   ✓ createApp > falls back to the database when Redis read/write operations fail 424ms
 ✓ tests/pipeline/validateX402Candidate.test.ts (2 tests) 743ms
   ✓ validateX402Candidates > keeps a candidate in soft mode when facilitator is unknown 702ms
 ✓ tests/pipeline/extractEvidence.test.ts (1 test) 792ms
   ✓ extractEvidence > promotes direct EIP-3009 evidence when calldata matches the transfer log 791ms
 ✓ tests/pipeline/deriveDomain.test.ts (1 test) 946ms
   ✓ deriveDomain > keeps the earliest first_seen_block when older history is backfilled later 943ms
 ✓ tests/workers/backfillWorker.test.ts (5 tests) 723ms
   ✓ splitBlockRangeIntoChunks > does not treat a canonical block as complete when no worker checkpoint advanced past it 307ms
 ✓ tests/db/addressRegistry.test.ts (1 test) 122ms

 Test Files  14 passed (14)
      Tests  38 passed (38)
   Start at  10:18:14
   Duration  18.95s (transform 4.73s, setup 0ms, collect 72.36s, tests 20.98s, environment 3ms, prepare 4.81s)
```

</details>

<details>
<summary><code>pnpm typecheck</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 typecheck /Users/chamdom/Develop/x402-indexer-agents-module-test
> tsc --noEmit -p tsconfig.json
```

</details>

<details>
<summary><code>pnpm build</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 build /Users/chamdom/Develop/x402-indexer-agents-module-test
> tsc -p tsconfig.json
```

</details>
