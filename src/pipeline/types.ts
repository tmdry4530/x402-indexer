import type {
    Address,
    Hash,
    PublicClient,
    Block,
    Transaction,
    TransactionReceipt,
    Log,
} from 'viem';
import type { Pool } from 'pg';
import type { EventEmitter } from 'node:events';

// 워커 종류 구분 — orchestrator의 실시간/백필 분기 결정에 사용
export type WorkerSource = 'realtime' | 'backfill';

// 워커 인스턴스 식별자 — cursor lock과 sync_checkpoints의 PK
// 실시간은 항상 'realtime' 단일, 백필은 인스턴스별로 'backfill_001', 'backfill_002' 등
export type WorkerName = 'realtime' | `backfill_${string}`;

// 워커가 파이프라인에 넘기는 최소 입력
export interface BlockInput {
    blockNumber: bigint;
    source: WorkerSource;
    workerName: WorkerName;
}

// 파이프라인 전 단계가 공유하는 의존성 컨테이너
export interface PipelineContext {
    rpc: PublicClient;
    db: DbClient;
    redis: RedisClient;
    jobs: {
        enqueueBackfill?: (input: { startBlock: bigint; endBlock: bigint }) => Promise<void>;
    };
    registry: AddressRegistry;
    config: PipelineConfig;
    integrations: IntegrationConfig;
}

// 운영 상수 — 환경변수에서 로드
export interface PipelineConfig {
    // x402_evidence → payments 승격 임계값 (0~100)
    confidenceThreshold: number;

    // 실시간 워커가 대기할 블록 수 (latest - finalityLag 이상만 처리)
    finalityLag: number;

    // reorg 복구 시 최대 역추적 깊이 (초과 시 수동 점검)
    maxReorgDepth: number;

    // 백필 워커가 한 번에 처리할 블록 chunk 크기
    backfillChunkSize: number;

    // facilitator를 candidate 단계에서 hard filter로 볼지 여부
    facilitatorFilterMode: 'hard' | 'soft';
}

// 외부 enrichment API 설정.
// 결제 저장 자체는 이 API들에 의존하지 않고, 가격/selector 보강 단계에서만 사용한다.
export interface IntegrationConfig {
    defiLlamaBaseUrl: string;
    openChainBaseUrl: string;
}

// 알려진 주소 레지스트리 — orchestrator의 3중 필터 검증에 사용
export interface AddressRegistry {
    knownAssets: Set<Address>;        // Base USDC 등
    knownFacilitators: Set<Address>;  // Coinbase CDP, Questflow 등
    knownProxies: Set<Address>;       // x402ExactPermit2Proxy 등
}

export type DbClient = Pool;

// 파이프라인이 요구하는 Redis 최소 인터페이스.
// ioredis 실제 타입 대신 필요한 메서드만 노출해 테스트 mock과 BullMQ 공유를 단순화한다.
export interface RedisClient {
    on(event: 'error', listener: (error: unknown) => void): EventEmitter;
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<unknown>;
    scanStream(options: { match: string; count: number }): EventEmitter;
    del(...keys: string[]): Promise<number>;
    quit(): Promise<string>;
}

// 파이프라인 내부에서 흘러다니는 경량 블록 헤더
// viem의 Block은 transactions/uncles 등 무거운 필드를 포함하므로 필요한 4개만 추림
export interface BlockHeader {
    number: bigint;
    hash: Hash;
    parentHash: Hash;
    timestamp: bigint;
}

// reorg 검사 결과 — discriminated union으로 valid 분기 강제
export type ReorgCheckResult =
    | { valid: true }
    | {
        valid: false;
        currentBlockNumber: bigint;
        localHash: Hash;
        canonicalHash: Hash;
        commonAncestorBlock: bigint;
    };

// known_assets에서 emit된 ERC-20 Transfer 로그 (디코딩 완료된 형태)
export interface TransferLog {
    address: Address;          // 토큰 컨트랙트 주소 (USDC 등)
    blockNumber: bigint;
    transactionHash: Hash;
    logIndex: number;
    from: Address;             // 결제의 실제 payer
    to: Address;               // payTo (서비스 주소)
    value: bigint;             // 결제 금액 (토큰 최소 단위)
    raw: Log;                  // 원본 Log — 디버깅/재처리용 보존
}

// 3중 필터를 통과한 x402 결제 후보
// Transfer log + tx + receipt를 한 묶음으로 가짐
export interface X402Candidate {
    txHash: Hash;
    logIndex: number;
    blockNumber: bigint;
    transferLog: TransferLog;
    tx: Transaction;
    receipt: TransactionReceipt;
}

// x402 결제 감지 방법 — confidence 계산의 핵심 입력
export type DetectionMethod =
    | 'eip3009_direct'   // USDC.transferWithAuthorization 직접 호출
    | 'permit2_proxy'    // x402ExactPermit2Proxy 경유
    | 'custom_event';    // 별도 facilitator 컨트랙트의 커스텀 이벤트

// x402_evidence 테이블에 저장될 형태
export interface X402Evidence {
    txHash: Hash;
    logIndex: number;
    blockNumber: bigint;
    detectionMethod: DetectionMethod;
    confidence: number;          // 0~100, 임계값 초과 시 payments로 승격
    payer: Address;
    payTo: Address;
    asset: Address;
    amount: bigint;
}

// 원본 viem 타입 재노출 — 다른 파일에서 viem 직접 import 안 해도 되게
export type RawBlock = Block;
export type RawTransaction = Transaction;
export type RawReceipt = TransactionReceipt;
export type RawLog = Log;
