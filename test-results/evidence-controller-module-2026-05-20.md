# EvidenceController Module Test Results

- Date: 2026-05-20 10:48:29 KST
- Branch: `test/evidence-controller-module`
- Commit: `b41871d`
- Node: `v25.5.0`
- pnpm: `10.27.0`
- Overall result: **PASS**

## Summary

| Command | Exit code | Result |
| --- | ---: | --- |
| `pnpm install --frozen-lockfile` | 0 | ✅ PASS |
| `pnpm vitest run tests/api/evidenceController.test.ts` | 0 | ✅ PASS |
| `pnpm test` | 0 | ✅ PASS |
| `pnpm typecheck` | 0 | ✅ PASS |
| `pnpm build` | 0 | ✅ PASS |

## Notes

- This PR covers only `EvidenceController` module wiring through the wired use case/cache path.
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
Progress: resolved 246, reused 245, downloaded 0, added 137
Progress: resolved 246, reused 246, downloaded 0, added 243
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
Done in 4.8s using pnpm v10.27.0
```

</details>

<details>
<summary><code>pnpm vitest run tests/api/evidenceController.test.ts</code> — exit 0</summary>

```txt

 RUN  v2.1.9 /Users/chamdom/Develop/x402-indexer-evidence-module-test

 ✓ tests/api/evidenceController.test.ts (1 test) 115ms

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  10:48:36
   Duration  1.84s (transform 567ms, setup 0ms, collect 920ms, tests 115ms, environment 0ms, prepare 75ms)
```

</details>

<details>
<summary><code>pnpm test</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 test /Users/chamdom/Develop/x402-indexer-evidence-module-test
> vitest run


 RUN  v2.1.9 /Users/chamdom/Develop/x402-indexer-evidence-module-test

 ✓ tests/workers/realtimeWorker.test.ts (5 tests) 846ms
   ✓ RealtimeWorker > waits for finality before queueing a new block 498ms
 ✓ tests/pipeline/detectReorg.test.ts (5 tests) 805ms
   ✓ detectReorg > treats the first processed block as canonical when no checkpoint exists 376ms
stderr | tests/pipeline/recoverReorg.test.ts > recoverReorg > marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint
[reorg] replay range recorded for manual backfill { startBlock: '2', endBlock: '3' }

 ✓ tests/pipeline/recoverReorg.test.ts (1 test) 899ms
   ✓ recoverReorg > marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint 898ms
 ✓ tests/pipeline/aggregate.test.ts (1 test) 1026ms
   ✓ updateAggregates > recomputes full-day stats across multiple batches and uses WETH price for gas 1025ms
 ✓ tests/pipeline/processBlock.integration.test.ts (1 test) 1119ms
   ✓ processBlock integration > persists a promoted payment flow end-to-end 1118ms
 ✓ tests/pipeline/processBlock.branching.integration.test.ts (5 tests) 2457ms
   ✓ processBlock branching integration > stores only the block and advances the checkpoint when no transfer logs are found 356ms
   ✓ processBlock branching integration > quarantines low-confidence evidence without promoting it into payments or daily stats 338ms
   ✓ processBlock branching integration > keeps multiple payment evidence rows from a single transaction and aggregates both 814ms
   ✓ processBlock branching integration > promotes a real-world-shaped direct EIP-3009 payment even when facilitator matching is absent 840ms
 ✓ tests/db/facilitatorSource.test.ts (1 test) 5ms
 ✓ tests/workers/backfillWorker.test.ts (5 tests) 445ms
   ✓ splitBlockRangeIntoChunks > does not treat a canonical block as complete when no worker checkpoint advanced past it 390ms
stderr | tests/api/app.test.ts > createApp > falls back to the database when Redis read/write operations fail
[cache] read failed, falling back to db dashboard:payments:{"limit":20,"offset":0,"payer":"0xagent"} Error: redis unavailable
    at Object.get (/Users/chamdom/Develop/x402-indexer-evidence-module-test/tests/api/app.test.ts:255:17)
    at RedisDashboardCacheAdapter.readThrough (/Users/chamdom/Develop/x402-indexer-evidence-module-test/src/infrastructure/cache/redis-dashboard-cache.adapter.ts:19:39)
    at ListPaymentsUseCase.execute (/Users/chamdom/Develop/x402-indexer-evidence-module-test/src/application/payment/list-payments.usecase.ts:21:23)
    at PaymentsController.list (/Users/chamdom/Develop/x402-indexer-evidence-module-test/src/api/payments/payments.controller.ts:20:51)
    at /Users/chamdom/Develop/x402-indexer-evidence-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:38:29
    at processTicksAndRejections (node:internal/process/task_queues:104:5)
    at /Users/chamdom/Develop/x402-indexer-evidence-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:46:28
    at /Users/chamdom/Develop/x402-indexer-evidence-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-proxy.js:9:17
[cache] write failed, continuing without cache dashboard:payments:{"limit":20,"offset":0,"payer":"0xagent"} Error: redis unavailable
    at Object.setex (/Users/chamdom/Develop/x402-indexer-evidence-module-test/tests/api/app.test.ts:258:17)
    at RedisDashboardCacheAdapter.readThrough (/Users/chamdom/Develop/x402-indexer-evidence-module-test/src/infrastructure/cache/redis-dashboard-cache.adapter.ts:29:24)
    at PaymentsController.list (/Users/chamdom/Develop/x402-indexer-evidence-module-test/src/api/payments/payments.controller.ts:20:20)
    at /Users/chamdom/Develop/x402-indexer-evidence-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:46:28
    at /Users/chamdom/Develop/x402-indexer-evidence-module-test/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-proxy.js:9:17

 ✓ tests/api/evidenceController.test.ts (1 test) 430ms
   ✓ EvidenceController module wiring > resolves from the Nest container and returns evidence through the wired use case 427ms
 ✓ tests/api/app.test.ts (8 tests) 3256ms
   ✓ createApp > returns health and payments data 1689ms
   ✓ createApp > serves the remaining read endpoints and not-found responses 731ms
   ✓ createApp > serves UI-supporting list, detail, and operations endpoints 424ms
 ✓ tests/pipeline/extractEvidence.test.ts (1 test) 288ms
 ✓ tests/pipeline/validateX402Candidate.test.ts (2 tests) 240ms
 ✓ tests/pipeline/deriveDomain.test.ts (1 test) 339ms
   ✓ deriveDomain > keeps the earliest first_seen_block when older history is backfilled later 338ms
 ✓ tests/db/addressRegistry.test.ts (1 test) 59ms

 Test Files  14 passed (14)
      Tests  38 passed (38)
   Start at  10:48:39
   Duration  10.52s (transform 2.71s, setup 0ms, collect 39.31s, tests 12.21s, environment 35ms, prepare 4.08s)
```

</details>

<details>
<summary><code>pnpm typecheck</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 typecheck /Users/chamdom/Develop/x402-indexer-evidence-module-test
> tsc --noEmit -p tsconfig.json
```

</details>

<details>
<summary><code>pnpm build</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 build /Users/chamdom/Develop/x402-indexer-evidence-module-test
> tsc -p tsconfig.json
```

</details>
