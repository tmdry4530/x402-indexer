# x402 인덱서

Base 메인넷에서 발생하는 USDC 온체인 데이터를 읽고, 그중 x402 결제로 볼 수 있는 흐름을 찾아 분석 가능한 데이터로 저장하는 인덱서입니다.

블록체인에는 트랜잭션, 로그, 컨트랙트 호출 같은 원본 데이터만 존재합니다. 이 프로젝트는 그 원본 데이터를 그대로 보여주는 것이 아니라, x402 결제 후보를 찾고 confidence를 계산한 뒤 `payments`, `agents`, `services`, `interactions`, `daily stats` 같은 분석용 데이터로 변환합니다.

```text
온체인 원본 데이터
→ x402 후보 탐지
→ evidence / confidence 계산
→ payment 승격
→ agent / service / interaction 파생
→ 일별 통계 집계
→ API / 대시보드 조회
```

---

## 아키텍처

전체 구조는 다음과 같습니다.

```text
Base RPC
  ↓
Worker
  ├─ RealtimeWorker
  └─ BackfillWorker
  ↓
Pipeline
  └─ processBlock()
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

각 계층의 역할은 다음과 같습니다.

| 계층 | 역할 |
|---|---|
| Base RPC | 블록, 트랜잭션, 로그, receipt 조회 |
| Worker | 어떤 블록을 처리할지 결정 |
| Pipeline | 블록 하나를 x402 관점으로 분석 |
| PostgreSQL | 원본 데이터, 후보, 결제, 집계, 운영 상태 저장 |
| API | 대시보드가 조회할 수 있는 형태로 데이터 제공 |
| Dashboard | 인덱싱 결과와 운영 상태 시각화 |

핵심은 `RealtimeWorker`와 `BackfillWorker`가 서로 다른 방식으로 블록을 가져오지만, 실제 처리 로직은 모두 `processBlock()` 하나를 공유한다는 점입니다.

---

## 파일 구조

프로젝트의 주요 디렉터리 구조는 다음과 같습니다.

```text
src/
  index.ts                 앱 부팅 진입점
  config.ts                환경 설정 로드/검증

  api/
    app.ts                 Hono API 라우터

  db/
    client.ts              PostgreSQL/Redis/context 생성
    migrations/            DB 스키마
    api-queries.ts         대시보드/API 조회 SQL
    checkpoints.ts         checkpoint, cursor lock, rewind
    backfillJobs.ts        백필 range 기록/enqueue fallback
    addressRegistry.ts     asset/facilitator/proxy registry 관리
    facilitatorSource.ts   외부 facilitator 목록 동기화

  workers/
    realtimeWorker.ts      신규 블록 실시간 처리
    backfillWorker.ts      과거/누락/reorg 구간 백필 처리

  pipeline/
    orchestrator.ts        processBlock() 메인 파이프라인
    types.ts               파이프라인 공통 타입
    steps/                 블록 처리 단계별 로직
      fetchBlockHeader.ts
      detectReorg.ts
      recoverReorg.ts
      filterTransferLogs.ts
      validateX402Candidate.ts
      storeRaw.ts
      extractEvidence.ts
      deriveDomain.ts
      aggregate.ts
      dailyStats.ts

web/
  index.html               정적 UI 엔트리
  data.js                  API 응답을 화면 모델로 변환
  page-dashboard.jsx       대시보드 화면
  page-operations.jsx      운영 상태 화면
  page-payments.jsx        결제 목록/상세 화면
  components.jsx           공통 UI 컴포넌트

tests/
  pipeline/                파이프라인 단위/통합 테스트
  workers/                 realtime/backfill worker 테스트
  api/                     API 테스트
  db/                      DB 보조 로직 테스트

docs/                      상세 설계/흐름 설명 문서
```

구조상 핵심은 `workers/`가 블록 처리 시점을 결정하고, `pipeline/`이 실제 인덱싱 판단을 수행하며, `db/`가 저장/조회/운영 상태를 담당한다는 점입니다.

---

## 설계

### Worker 설계

Worker는 블록 처리의 진입점입니다.

- `RealtimeWorker`는 새로 생기는 블록을 감지하고 finality lag 이후 처리합니다.
- `BackfillWorker`는 과거 구간, 누락 구간, 실패 구간, reorg 이후 재처리 구간을 처리합니다.

둘 다 최종적으로 같은 파이프라인을 호출합니다.

```text
RealtimeWorker ─┐
                ├─ processBlock()
BackfillWorker ─┘
```

이렇게 만든 이유는 실시간 처리와 백필 처리가 같은 판별 기준, 같은 저장 방식, 같은 집계 방식으로 수렴하게 하기 위해서입니다.

### Pipeline 설계

Pipeline은 블록 하나를 끝까지 처리하는 단위입니다.

주요 책임은 다음과 같습니다.

- block header 조회
- reorg 감지
- USDC Transfer log 필터링
- x402 후보 검증
- raw data 저장
- evidence / confidence 계산
- payment 승격
- agent / service / interaction 파생
- daily aggregate 갱신
- checkpoint 전진

checkpoint는 모든 처리가 끝난 뒤에만 전진합니다. 중간에 실패하면 같은 블록을 다시 처리할 수 있게 하기 위해서입니다.

### 데이터 설계

데이터는 목적별로 계층을 나눕니다.

| 계층 | 테이블 | 설명 |
|---|---|---|
| Raw | `blocks`, `transactions`, `logs` | 온체인 원본 데이터 |
| Evidence | `x402_evidence` | x402 후보와 confidence |
| Domain | `payments`, `agents`, `services`, `interactions` | 실제 분석에 사용하는 데이터 |
| Aggregate | `agent_daily_stats` | 일별 결제/비용/수익 집계 |
| Operations | `sync_checkpoints`, `backfill_jobs` | 워커 진행 상태와 복구 작업 |
| Registry | `address_registry` | asset, facilitator, proxy 주소 |

Raw와 Domain을 분리한 이유는, 나중에 판별 기준이나 confidence threshold가 바뀌어도 원본 데이터를 기준으로 다시 검증할 수 있게 하기 위해서입니다.

### x402 판별 설계

x402 결제에서는 트랜잭션을 제출한 주소와 실제 돈을 낸 주소가 다를 수 있습니다.

```text
tx.from        = 트랜잭션 제출자, facilitator일 수 있음
Transfer.from  = 실제 USDC를 낸 payer
Transfer.to    = 실제 돈을 받은 pay_to / service 후보
```

그래서 이 인덱서는 단순히 `tx.from`만 보지 않고 다음 신호를 함께 봅니다.

- Base USDC `Transfer` log
- EIP-3009 `transferWithAuthorization` selector
- Permit2 계열 selector
- facilitator / proxy 주소 매칭
- transaction success 여부
- calldata와 Transfer log의 payer / pay_to / amount 정합성

판별 결과는 먼저 `x402_evidence`에 저장되고, confidence가 기준 이상이면 `payments`로 승격됩니다.

---

## 흐름

### 전체 처리 흐름

`processBlock()` 기준 전체 흐름입니다.

```text
1. address registry 갱신
2. block header 조회
3. reorg 검사
4. USDC Transfer log 수집
5. x402 후보 검증
6. raw block / transaction / log 저장
7. evidence 추출 및 confidence 계산
8. threshold 이상 evidence를 payment로 승격
9. agent / service / interaction 생성
10. daily aggregate 갱신
11. checkpoint advance
```

### 실시간 처리 흐름

```text
새 블록 감지
→ finality lag 대기
→ 내부 queue에 추가
→ 순차적으로 processBlock() 호출
→ 실패 또는 gap 발생 시 backfill range 생성
```

실시간 워커는 gap을 직접 무리해서 처리하지 않고 backfill에 넘깁니다.

### 백필 처리 흐름

```text
backfill range 수신
→ range를 chunk로 분할
→ block 단위 순차 처리
→ processBlock() 호출
→ progress / status 기록
```

백필은 다음 경우에 사용됩니다.

- 과거 데이터 최초 적재
- 실시간 처리 중 놓친 구간 복구
- 실패한 블록 재처리
- reorg 이후 replay

### Reorg 복구 흐름

```text
parentHash mismatch 감지
→ common ancestor 탐색
→ ancestor 이후 데이터 정리
→ checkpoint rewind
→ replay range를 backfill로 기록
```

reorg가 감지되면 현재 블록을 억지로 계속 처리하지 않고, 안전한 공통 조상으로 되돌린 뒤 다시 처리할 수 있게 만듭니다.

---

## 주요 파일

| 파일 | 설명 |
|---|---|
| `src/index.ts` | 앱 부팅, DB/Redis/worker/API 조립 |
| `src/pipeline/orchestrator.ts` | `processBlock()` 메인 파이프라인 |
| `src/workers/realtimeWorker.ts` | 실시간 블록 처리 |
| `src/workers/backfillWorker.ts` | 과거/누락/reorg 구간 백필 |
| `src/db/checkpoints.ts` | checkpoint, lock, rewind 처리 |
| `src/db/backfillJobs.ts` | backfill range 기록 |
| `src/api/app.ts` | Hono API route |
| `src/db/api-queries.ts` | 대시보드/API 조회 SQL |
| `web/` | 정적 대시보드 UI |
