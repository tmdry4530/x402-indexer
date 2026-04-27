import type { Pool, PoolClient, QueryResult } from 'pg';

// Pool과 트랜잭션 client를 동일하게 받기 위한 최소 DB 인터페이스 타입.
export type Queryable = Pool | PoolClient;

// 단건 SELECT 헬퍼.
// 결과가 없으면 undefined 대신 null을 반환해 호출부 분기를 명시적으로 만든다.
export async function queryOne<T>(
  db: Queryable,
  text: string,
  params: readonly unknown[] = [],
): Promise<T | null> {
  // 단건 조회 공통 헬퍼 — 결과가 없으면 null 반환으로 분기 단순화
  const result = await db.query(text, [...params]);
  return (result.rows[0] as T | undefined) ?? null;
}

// 다건 SELECT 헬퍼.
// pg row 배열을 호출부가 지정한 타입으로 캐스팅해 반복되는 boilerplate를 줄인다.
export async function queryMany<T>(
  db: Queryable,
  text: string,
  params: readonly unknown[] = [],
): Promise<T[]> {
  // 다건 조회 공통 헬퍼 — 호출부에서 row casting boilerplate를 줄인다.
  const result = await db.query(text, [...params]);
  return result.rows as T[];
}

// DB 작업을 하나의 트랜잭션으로 감싼다.
// fn이 throw하면 rollback하고, 성공하면 commit한 뒤 client를 항상 release한다.
export async function withTransaction<T>(
  db: Pool,
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  // raw 저장처럼 원자성이 필요한 작업을 BEGIN/COMMIT/ROLLBACK으로 감싼다.
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// chain timestamp(seconds)를 JS Date로 변환한다.
// Postgres timestamptz 바인딩은 Date 객체를 받는 편이 가장 단순하다.
export function toDateTime(value: bigint): Date {
  // chain timestamp(seconds)를 Postgres timestamptz와 맞는 JS Date로 변환
  return new Date(Number(value) * 1000);
}

// bigint 값을 pg numeric 컬럼에 안전하게 바인딩하기 위한 문자열 변환.
// JS number로 바꾸지 않아 큰 금액/가스값 precision 손실을 피한다.
export function toPgNumeric(value: bigint): string {
  // bigint를 pg numeric 바인딩용 문자열로 변환
  return value.toString();
}

// bigint 값을 pg bigint 컬럼에 바인딩하기 위한 문자열 변환.
// pg 드라이버가 int8을 문자열로 다루는 관례와 맞춘다.
export function toPgBigInt(value: bigint): string {
  // bigint를 pg bigint 바인딩용 문자열로 변환
  return value.toString();
}

// 성공/실패 boolean을 smallint(1/0) 저장 형식으로 변환한다.
// receipt.status처럼 undefined 가능성이 있는 값을 실패값으로 보수 처리한다.
export function asSmallInt(success: boolean | undefined): number {
  // boolean 계열 상태값을 smallint(0/1)로 저장할 때 사용
  return success ? 1 : 0;
}

// 동적 IN clause placeholder를 생성한다.
// params 배열의 시작 index를 넘겨 여러 조건을 조합할 때 번호 충돌을 피한다.
export function buildInClause(startIndex: number, count: number): string {
  // 동적 IN (...) placeholder 문자열 생성
  return Array.from({ length: count }, (_, index) => `$${startIndex + index}`).join(', ');
}

// 두 컬럼으로 구성된 복합키 조건을 OR clause로 만든다.
// pg-mem 테스트 호환성을 위해 tuple IN 대신 명시적인 AND/OR 형태를 사용한다.
export function buildPairClause(
  leftColumnA: string,
  leftColumnB: string,
  pairs: Array<readonly [unknown, unknown]>,
  startIndex = 1,
): { clause: string; params: unknown[] } {
  // (colA = $1 AND colB = $2) OR ... 형태의 pair 조건을 만든다.
  // pg-mem 테스트 호환성 때문에 tuple IN 대신 이 헬퍼를 사용한다.
  const params: unknown[] = [];
  const clause = pairs
    .map(([a, b], index) => {
      params.push(a, b);
      const offset = startIndex + index * 2;
      return `(${leftColumnA} = $${offset} AND ${leftColumnB} = $${offset + 1})`;
    })
    .join(' OR ');

  return { clause, params };
}

// discriminated union exhaustive check용 helper.
// 새 variant를 추가했는데 switch/case에서 빠뜨리면 compile/runtime 양쪽에서 드러나게 한다.
export function assertNever(_: never, message: string): never {
  // exhaustive check 보조 헬퍼 — 새로운 union case 누락을 빠르게 드러낸다.
  throw new Error(message);
}
