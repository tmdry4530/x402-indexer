# NestJS Migration Verification Results

- Date: 2026-05-11 19:39:17 KST
- Branch: `chore/verify-nestjs-migration`
- Commit: `b41871d`
- Node: `v25.5.0`
- pnpm: `10.27.0`
- Overall result: **PASS**

## Summary

| Check | Command | Exit code | Result |
| --- | --- | ---: | --- |
| install | `pnpm install --frozen-lockfile` | 0 | ✅ PASS |
| test | `pnpm test` | 0 | ✅ PASS |
| typecheck | `pnpm typecheck` | 0 | ✅ PASS |
| build | `pnpm build` | 0 | ✅ PASS |

## Notes

- Redis fallback tests intentionally log cache read/write failures while verifying database fallback behavior.
- No source code or CONTRIBUTING.md changes are included in this verification result file.

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
Done in 347ms using pnpm v10.27.0
```

</details>

<details>
<summary><code>pnpm test</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 test /Users/chamdom/Develop/x402-indexer-verify-nestjs
> vitest run


 RUN  v2.1.9 /Users/chamdom/Develop/x402-indexer-verify-nestjs

 ✓ tests/workers/realtimeWorker.test.ts (5 tests) 372ms
 ✓ tests/pipeline/detectReorg.test.ts (5 tests) 314ms
stderr | tests/pipeline/recoverReorg.test.ts > recoverReorg > marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint
[reorg] replay range recorded for manual backfill { startBlock: '2', endBlock: '3' }

 ✓ tests/pipeline/recoverReorg.test.ts (1 test) 406ms
   ✓ recoverReorg > marks orphan blocks, invalidates domain rows, clears dashboard cache, and rewinds the checkpoint 404ms
 ✓ tests/pipeline/processBlock.integration.test.ts (1 test) 381ms
   ✓ processBlock integration > persists a promoted payment flow end-to-end 380ms
 ✓ tests/pipeline/aggregate.test.ts (1 test) 460ms
   ✓ updateAggregates > recomputes full-day stats across multiple batches and uses WETH price for gas 460ms
 ✓ tests/pipeline/processBlock.branching.integration.test.ts (5 tests) 881ms
 ✓ tests/db/facilitatorSource.test.ts (1 test) 4ms
stderr | tests/api/app.test.ts > createApp > falls back to the database when Redis read/write operations fail
[cache] read failed, falling back to db dashboard:payments:{"limit":20,"offset":0,"payer":"0xagent"} Error: redis unavailable
    at Object.get (/Users/chamdom/Develop/x402-indexer-verify-nestjs/tests/api/app.test.ts:255:17)
    at RedisDashboardCacheAdapter.readThrough (/Users/chamdom/Develop/x402-indexer-verify-nestjs/src/infrastructure/cache/redis-dashboard-cache.adapter.ts:19:39)
    at ListPaymentsUseCase.execute (/Users/chamdom/Develop/x402-indexer-verify-nestjs/src/application/payment/list-payments.usecase.ts:21:23)
    at PaymentsController.list (/Users/chamdom/Develop/x402-indexer-verify-nestjs/src/api/payments/payments.controller.ts:20:51)
    at /Users/chamdom/Develop/x402-indexer-verify-nestjs/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:38:29
    at processTicksAndRejections (node:internal/process/task_queues:104:5)
    at /Users/chamdom/Develop/x402-indexer-verify-nestjs/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:46:28
    at /Users/chamdom/Develop/x402-indexer-verify-nestjs/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-proxy.js:9:17
[cache] write failed, continuing without cache dashboard:payments:{"limit":20,"offset":0,"payer":"0xagent"} Error: redis unavailable
    at Object.setex (/Users/chamdom/Develop/x402-indexer-verify-nestjs/tests/api/app.test.ts:258:17)
    at RedisDashboardCacheAdapter.readThrough (/Users/chamdom/Develop/x402-indexer-verify-nestjs/src/infrastructure/cache/redis-dashboard-cache.adapter.ts:29:24)
    at PaymentsController.list (/Users/chamdom/Develop/x402-indexer-verify-nestjs/src/api/payments/payments.controller.ts:20:20)
    at /Users/chamdom/Develop/x402-indexer-verify-nestjs/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-execution-context.js:46:28
    at /Users/chamdom/Develop/x402-indexer-verify-nestjs/node_modules/.pnpm/@nestjs+core@11.1.19_@nestjs+common@11.1.19_reflect-metadata@0.2.2_rxjs@7.8.2__@nestjs+_7a6537f00dbd352f656d15669a98db2e/node_modules/@nestjs/core/router/router-proxy.js:9:17

 ✓ tests/api/app.test.ts (8 tests) 868ms
 ✓ tests/pipeline/extractEvidence.test.ts (1 test) 159ms
 ✓ tests/workers/backfillWorker.test.ts (5 tests) 176ms
 ✓ tests/pipeline/validateX402Candidate.test.ts (2 tests) 97ms
 ✓ tests/pipeline/deriveDomain.test.ts (1 test) 209ms
 ✓ tests/db/addressRegistry.test.ts (1 test) 61ms

 Test Files  13 passed (13)
      Tests  37 passed (37)
   Start at  19:39:08
   Duration  4.03s (transform 1.36s, setup 0ms, collect 14.54s, tests 4.39s, environment 20ms, prepare 1.22s)
```

</details>

<details>
<summary><code>pnpm typecheck</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 typecheck /Users/chamdom/Develop/x402-indexer-verify-nestjs
> tsc --noEmit -p tsconfig.json
```

</details>

<details>
<summary><code>pnpm build</code> — exit 0</summary>

```txt

> x402-indexer@0.1.0 build /Users/chamdom/Develop/x402-indexer-verify-nestjs
> tsc -p tsconfig.json
```

</details>
