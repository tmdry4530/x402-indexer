import { parseAbiItem, type Address } from 'viem';
import type {
    BlockHeader,
    PipelineContext,
    TransferLog,
} from '../types.js';

// ERC-20 Transfer 이벤트 ABI — getLogs 필터링용
// topic0이 자동으로 keccak256("Transfer(address,address,uint256)")로 인코딩됨
const TRANSFER_EVENT = parseAbiItem(
    'event Transfer(address indexed from, address indexed to, uint256 value)',
);

// 한 블록에서 known_assets 컨트랙트의 Transfer 이벤트만 필터링
// 가장 싼 RPC 호출 — 1차 퍼널, tx/receipt 조회 전에 후보 좁히기
// 학습 프로젝트는 USDC 1~2개 주소만 등록하므로 호출량 작음
export async function filterTransferLogs(
    header: BlockHeader,
    ctx: PipelineContext,
): Promise<TransferLog[]> {
    // known_assets 범위 안의 Transfer 로그만 먼저 긁어와 이후 비싼 tx/receipt 조회량을 줄인다.
    // known_assets가 비어있으면 (예: 초기 설정 미완료) 빈 배열 반환
    if (ctx.registry.knownAssets.size === 0) {
        return [];
    }

    const logs = await ctx.rpc.getLogs({
        fromBlock: header.number,
        toBlock: header.number,
        address: [...ctx.registry.knownAssets],
        event: TRANSFER_EVENT,
    });

    return logs
        .filter((log) => !('removed' in log) || !log.removed)
        .flatMap((log) => {
            // viem decoded log를 파이프라인 내부 표준 타입으로 정규화
            const args = log.args as {
                from?: Address;
                to?: Address;
                value?: bigint;
            };

            if (!args.from || !args.to || typeof args.value !== 'bigint' || !log.transactionHash) {
                return [];
            }

            return [{
                address: log.address,
                blockNumber: header.number,
                transactionHash: log.transactionHash,
                logIndex: Number(log.logIndex),
                from: args.from,
                to: args.to,
                value: args.value,
                raw: log,
            }];
        });
}
