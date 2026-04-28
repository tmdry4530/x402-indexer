# x402 Indexer

Base 메인넷에서 발생하는 USDC 온체인 데이터를 읽고, 그중 x402 결제로 볼 수 있는 흐름을 찾아 분석 가능한 데이터로 저장하는 인덱서입니다.

블록체인에는 트랜잭션, 로그, 컨트랙트 호출 같은 raw data만 존재합니다. 이 프로젝트는 그 raw data를 그대로 보여주는 것이 아니라, 아래처럼 의미 있는 도메인 데이터로 바꿉니다.

```text
온체인 raw data
→ x402 결제 후보
→ confidence가 붙은 evidence
→ 확정 payment
→ agent/service/interactions/일별 통계
→ API와 dashboard에서 조회 가능한 read model
```

---

## What this indexer does

이 인덱서는 Base 체인에서 USDC `Transfer` 로그를 읽고, 해당 트랜잭션이 x402 결제 흐름인지 판단합니다.

x402 결제에서는 일반적인 토큰 전송과 다르게 다음 특징이 있을 수 있습니다.

- 사용자가 직접 트랜잭션을 보내지 않을 수 있음
- facilitator가 사용자의 authorization을 대신 제출할 수 있음
- `tx.from`과 실제 돈을 낸 주소가 다를 수 있음
- USDC의 EIP-3009 `transferWithAuthorization` 호출이 사용될 수 있음
- Permit2 계열 호출이 사용될 수 있음

그래서 이 프로젝트는 단순히 `tx.from`, `tx.to`만 보지 않고, Transfer log, calldata, selector, facilitator 주소, transaction receipt를 함께 봅니다.

중요한 주소 의미는 다음과 같습니다.

```text
tx.from        = 트랜잭션 제출자. facilitator일 수 있음
Transfer.from  = 실제 USDC를 낸 payer
Transfer.to    = 실제 돈을 받은 pay_to / service 후보
```

즉, x402 분석에서는 `Transfer.from`과 `Transfer.to`가 매우 중요합니다.

---

## Architecture

```text
Base RPC
  ↓
Workers
  ├─ RealtimeWorker
  └─ BackfillWorker
  ↓
Pipeline: processBlock()
  ↓
PostgreSQL
  ├─ raw tables
  ├─ evidence tables
  ├─ domain tables
  ├─ aggregate tables
  └─ operations tables
  ↓
Hono API
  ↓
Web Dashboard
```

역할을 나누면 다음과 같습니다.

| Layer | 역할 |
|---|---|
| Base RPC | 블록, 트랜잭션, 로그, receipt를 읽는 원천 |
| Workers | 어떤 블록을 처리할지 결정 |
| Pipeline | 블록 하나를 읽고 x402 여부를 판별 |
| PostgreSQL | raw/evidence/domain/aggregate/운영 상태 저장 |
| API | dashboard가 읽을 수 있는 형태로 데이터 제공 |
| Web UI | 인덱싱 결과와 운영 상태 시각화 |

핵심 설계는 **RealtimeWorker와 BackfillWorker가 같은 `processBlock()` 파이프라인을 공유한다**는 점입니다. 실시간 처리와 과거 재처리가 같은 로직을 타기 때문에 결과 데이터가 같은 형태로 수렴합니다.

---

## Main files

| 영역 | 파일 | 설명 |
|---|---|---|
| Bootstrap | `src/index.ts` | DB, Redis, worker, API 서버 조립 |
| Config | `src/config.ts` | 런타임 설정 로드/검증 |
| Pipeline | `src/pipeline/orchestrator.ts` | 단일 블록 처리 메인 흐름 |
| Realtime worker | `src/workers/realtimeWorker.ts` | 새 블록을 finality 이후 처리 |
| Backfill worker | `src/workers/backfillWorker.ts` | 과거/누락/reorg 구간 재처리 |
| Checkpoint | `src/db/checkpoints.ts` | worker 진행 상태, lock, reorg rewind |
| Backfill jobs | `src/db/backfillJobs.ts` | 복구할 block range 기록 |
| API | `src/api/app.ts` | Hono route와 request validation |
| API queries | `src/db/api-queries.ts` | dashboard/API용 SQL |
| Web UI | `web/` | 정적 dashboard |

---

## Worker model

### RealtimeWorker

`RealtimeWorker`는 새 블록을 감지하고, finality lag 이후 순서대로 처리합니다.

```text
새 block 감지
→ finality lag만큼 대기
→ 내부 queue에 추가
→ block 순차 처리
→ processBlock(source = realtime)
```

실시간 처리 중 문제가 생기면 직접 복구하려고 하지 않고, backfill 경로로 넘깁니다.

예:

- 중간 block gap 발견
- 특정 block 처리 실패
- finality 대기 중 문제 발생

이 경우 복구해야 할 range를 `backfill_jobs`에 남기고 BackfillWorker가 처리하게 합니다.

### BackfillWorker

`BackfillWorker`는 특정 block range를 다시 읽습니다.

```text
backfill job 수신
→ range를 chunk로 분할
→ block 단위 순차 처리
→ processBlock(source = backfill)
→ progress/status 기록
```

Backfill은 다음 상황에서 사용됩니다.

- 과거 데이터 최초 적재
- realtime이 놓친 gap 복구
- 실패한 block 재처리
- reorg 이후 replay

---

## Processing pipeline

블록 하나는 `processBlock()`에서 다음 순서로 처리됩니다.

```text
1. address registry refresh
2. block header 조회
3. reorg 검사
4. USDC Transfer log 필터링
5. x402 후보 검증
6. raw block / transaction / log 저장
7. evidence 추출 및 confidence 계산
8. threshold 이상 evidence를 payment로 승격
9. agent / service / interaction 도메인 데이터 생성
10. daily aggregate 갱신
11. checkpoint advance
```

### 1. Address registry refresh

known asset, facilitator, proxy 주소 정보를 최신 상태로 맞춥니다.

이 정보는 candidate validation과 confidence 계산에 사용됩니다.

### 2. Block header 조회

Base RPC에서 처리할 block의 header를 읽습니다.

이 header는 다음 용도로 사용됩니다.

- block 저장
- parent hash 기반 reorg 검사
- checkpoint에 저장할 canonical hash

### 3. Reorg 검사

현재 block의 `parentHash`와 worker checkpoint의 마지막 processed hash를 비교합니다.

- 이어지는 chain이면 계속 처리합니다.
- parent hash가 맞지 않으면 reorg로 보고 복구 루틴을 실행합니다.

reorg가 발생하면 common ancestor를 찾고, ancestor 이후 데이터는 orphan 처리하거나 재계산 대상으로 넘깁니다.

### 4. Transfer log 필터링

모든 transaction을 무작정 분석하지 않고, 먼저 known asset의 `Transfer` 로그를 찾습니다.

현재 핵심 asset은 Base USDC입니다.

Transfer log가 없으면 x402 payment가 될 가능성이 낮기 때문에 block만 저장하고 종료합니다.

### 5. x402 후보 검증

Transfer가 있는 transaction만 더 자세히 확인합니다.

검증 신호:

- EIP-3009 `transferWithAuthorization` selector
- Permit2 계열 selector
- known facilitator 또는 proxy 주소 매칭
- transaction success 여부
- calldata와 Transfer log의 payer/pay_to/amount 일치 여부

이 단계의 결과는 “이 transaction이 x402일 가능성이 있다”는 후보입니다.

### 6. Raw data 저장

후보가 있으면 원천 데이터를 저장합니다.

저장 대상:

- block
- transaction
- log

raw layer를 남겨두면 나중에 evidence 계산이나 domain derivation을 다시 검증할 수 있습니다.

### 7. Evidence 추출

후보에서 x402 판단 근거를 추출하고 confidence를 계산합니다.

`x402_evidence`는 payment보다 넓은 계층입니다.

- 확실한 x402도 evidence로 저장
- 애매한 후보도 evidence로 저장
- confidence threshold 이상만 payment로 승격

이렇게 분리하는 이유는, 나중에 threshold나 판별 기준을 바꿔도 후보 데이터를 다시 분석할 수 있기 때문입니다.

### 8. Payment 승격

confidence가 기준 이상이면 domain layer의 `payments`로 승격합니다.

이때 payment에는 다음 정보가 들어갑니다.

- transaction hash
- log index
- block number / timestamp
- payer
- pay_to
- asset
- amount
- amount_usd

### 9. Domain data 생성

승격된 payment를 기준으로 분석용 테이블을 갱신합니다.

- `agents`: payer 기준 참여자
- `services`: pay_to 기준 수신처
- `payments`: 확정 결제
- `interactions`: target contract / function selector 흐름

### 10. Aggregate 갱신

대시보드에서 바로 쓰기 위해 일별 집계를 갱신합니다.

대표 지표:

- agent별 결제 수
- 총 spend
- gas cost
- revenue
- net ROI
- unique service 수

### 11. Checkpoint advance

모든 처리가 성공한 뒤에만 checkpoint를 전진합니다.

```text
raw 저장
→ evidence 저장
→ domain 반영
→ aggregate 갱신
→ checkpoint advance
```

이 순서를 지키는 이유는 중간에 실패했을 때 같은 block을 다시 처리할 수 있게 하기 위해서입니다.

---

## Data model

DB는 목적별로 계층을 나눕니다.

| 계층 | 테이블 | 설명 |
|---|---|---|
| Raw | `blocks`, `transactions`, `logs` | 온체인 원본 데이터 |
| Evidence | `x402_evidence` | x402 후보와 confidence |
| Domain | `agents`, `services`, `payments`, `interactions` | 분석/API에서 직접 쓰는 데이터 |
| Aggregate | `agent_daily_stats` | 일별 결제/비용/수익 집계 |
| Operations | `sync_checkpoints`, `backfill_jobs` | worker 진행 상태와 복구 작업 |
| Registry | `address_registry` | asset, facilitator, proxy 주소 |
| Enrichment | `price_snapshots`, `function_signatures` | 가격과 selector 보강 데이터 |

이 구조의 장점은 raw data와 분석용 데이터를 분리한다는 점입니다.

- raw table은 원천 기록입니다.
- evidence table은 판단 근거입니다.
- domain table은 서비스가 바로 조회할 결과입니다.
- aggregate table은 dashboard 성능을 위한 요약입니다.
- operations table은 인덱서가 어디까지 안전하게 처리했는지 보여줍니다.

---

## Checkpoint and recovery

`sync_checkpoints`는 worker별 마지막 처리 block과 hash를 저장합니다.

checkpoint는 다음 역할을 합니다.

- 어디까지 처리했는지 기록
- reorg 검사 기준 제공
- worker 간 cursor lock 기준 제공
- 실패 후 재시작 지점 제공

복구 흐름은 다음과 같습니다.

```text
realtime gap 또는 block 실패
→ backfill range 생성
→ BullMQ queue에 등록
→ queue 불가 시 pending_manual로 DB 기록
→ BackfillWorker가 range 재처리
```

reorg 복구 흐름은 다음과 같습니다.

```text
parentHash mismatch 감지
→ common ancestor 탐색
→ ancestor 이후 block/domain data 정리
→ checkpoint rewind
→ replay range를 backfill로 기록
```

---

## API and dashboard

API는 저장된 데이터를 dashboard가 쓰기 쉬운 형태로 제공합니다.

주요 API는 다음 범주로 나뉩니다.

| 범주 | 예시 |
|---|---|
| Overview | `/overview` |
| Payments | `/payments`, `/payments/:txHash/:logIndex` |
| Agents | `/agents`, `/agents/:address`, `/agents/:address/stats` |
| Services | `/services`, `/services/:address` |
| Evidence | `/evidence` |
| Interactions | `/interactions` |
| Operations | `/operations/checkpoints`, `/operations/backfill-jobs`, `/jobs/backfill` |

Web UI는 API 응답을 `web/data.js`에서 화면 모델로 정규화한 뒤 보여줍니다.

---

## Related docs

더 자세한 설명은 아래 문서에 있습니다.

- `docs/INDEXER_LOGIC_GUIDE.md`
- `docs/INDEXER_FULL_WALKTHROUGH.md`
- `docs/FUNCTION_SEQUENCE_DIAGRAMS.md`
- `docs/CODEBASE_FLOW_ANALYSIS.md`
- `docs/senior-backend-review-points.md`
