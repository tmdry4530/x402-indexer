// 에이전트, 서비스, 상호작용, 증거, 설정, 문서 페이지.

function PageAgents({ onOpen }) {
  const sort = useSort("spent");
  const rows = [...MOCK.agents].sort((a,b) => {
    const g = (x) => x[sort.key] ?? 0;
    return sort.dir === "asc" ? g(a) - g(b) : g(b) - g(a);
  });
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">에이전트</h1>
          <div className="page-sub">결제 지불자(payer) 주소 {fmt.num(rows.length)}개를 총 USDC 지출 기준으로 정렬합니다.</div>
        </div>
        <button className="btn btn-sm" disabled data-tip="CSV 내보내기는 다음 단계 API에서 연결할 예정입니다."><Icons.Download size={12}/> <span>CSV</span></button>
      </div>
      {rows.length === 0 ? (
        <div className="card"><EmptyState title="에이전트가 없습니다" desc="결제가 인덱싱되면 payer 주소가 에이전트로 집계됩니다." /></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>에이전트</th>
                <th>종류</th>
                <SortHeader label="결제 수" k="payments" sort={sort} align="right"/>
                <SortHeader label="총 지출" k="spent" sort={sort} align="right"/>
                <SortHeader label="가스" k="gas" sort={sort} align="right"/>
                <th className="td-right">수익</th>
                <th className="td-right">순 ROI</th>
                <th className="td-right">서비스</th>
                <th className="td-right">마지막 블록</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a => {
                const roi = a.revenue - a.spent - a.gas;
                return (
                  <tr key={a.address} className="clickable" onClick={() => onOpen(a)}>
                    <td><AddressText value={a.address}/></td>
                    <td><span className="badge">{a.kind}</span></td>
                    <td className="td-num">{a.payments}</td>
                    <td className="td-num">{fmt.usd(a.spent)}</td>
                    <td className="td-num">{fmt.usd(a.gas)}</td>
                    <td className="td-num td-muted">{fmt.usd(a.revenue)}</td>
                    <td className="td-num" style={{color: roi < 0 ? "var(--danger)" : "var(--success)"}}>{fmt.usd(roi)}</td>
                    <td className="td-num">{a.services}</td>
                    <td className="td-num mono">{fmt.block(a.lastSeen)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PageAgentDetail({ agent, onBack, roiVariant }) {
  const payments = MOCK.payments.filter(p => p.payer === agent.address);
  const interactions = MOCK.interactions.filter(i => i.agent === agent.address);
  const roi = agent.revenue - agent.spent - agent.gas;

  return (
    <div className="page">
      <div className="hstack" style={{marginBottom: 14}}>
        <button className="btn btn-sm btn-ghost" onClick={onBack}><Icons.ChevronLeft/> <span>에이전트</span></button>
      </div>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{display: "flex", alignItems: "center", gap: 10, fontFamily: "var(--font-mono)", fontSize: 17, letterSpacing: "-0.01em"}}>
            {agent.address}
          </h1>
          <div className="hstack mb-12" style={{marginTop: 6}}>
            <span className="badge">{agent.kind}</span>
            <span className="muted" style={{fontSize: 12}}>첫 발견 {fmt.block(agent.firstSeen)} · 마지막 발견 {fmt.block(agent.lastSeen)}</span>
          </div>
        </div>
        <div className="hstack">
          <a className="btn btn-sm" href={`https://basescan.org/address/${agent.address}`} target="_blank" rel="noopener noreferrer"><Icons.External size={12}/> <span>BaseScan</span></a>
          <button className="btn btn-sm" onClick={() => copy(agent.address)}><Icons.Copy size={12}/> <span>복사</span></button>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi-cell"><span className="label">결제 수</span><span className="val">{agent.payments}</span></div>
        <div className="kpi-cell"><span className="label">총 지출</span><span className="val">{fmt.usd(agent.spent)}</span></div>
        <div className="kpi-cell"><span className="label">가스</span><span className="val">{fmt.usd(agent.gas)}</span></div>
        <div className="kpi-cell"><span className="label">수익</span><span className="val">{fmt.usd(agent.revenue)}</span></div>
        <div className="kpi-cell"><span className="label">순 ROI</span><span className="val" style={{color: roi < 0 ? "var(--danger)" : "var(--success)"}}>{fmt.usd(roi)}</span></div>
        <div className="kpi-cell"><span className="label">서비스</span><span className="val">{agent.services}</span></div>
      </div>

      {roiVariant === "multi" ? (
        <div className="chart-grid-3">
          {[
            { title: "일별 지출", color: "var(--chart-1)", acc: d => d.volume },
            { title: "일별 가스", color: "var(--chart-4)", acc: d => d.gas },
            { title: "일별 결제 수", color: "var(--chart-2)", acc: d => d.payments },
          ].map(c => (
            <div className="card" key={c.title}>
              <div className="card-header"><div className="card-title">{c.title}</div></div>
              <div className="card-body"><LineChart data={MOCK.daily} accessor={c.acc} color={c.color} width={340} height={140}/></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card mb-20">
          <div className="card-header"><div className="card-title">ROI 흐름</div><span className="muted" style={{fontSize: 11.5}}>지출 · 가스 · 수익</span></div>
          <div className="card-body">
            <LineChart data={MOCK.daily} accessor={d => d.volume} color="var(--chart-1)" width={1100} height={180}/>
          </div>
        </div>
      )}

      <div className="sec-title">이 에이전트의 결제</div>
      {payments.length === 0 ? (
        <div className="card"><EmptyState title="결제 내역이 없습니다" desc="현재 로드된 최근 결제 목록 안에는 이 에이전트의 결제가 없습니다." /></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>시간</th><th>Tx</th><th>수신처</th><th className="td-right">수량</th><th className="td-right">USD</th></tr></thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td className="td-muted">{p.date}</td>
                  <td><TxHashText value={p.tx}/></td>
                  <td><AddressText value={p.payTo}/></td>
                  <td className="td-num mono">{fmt.usdc(p.amount)}</td>
                  <td className="td-num">{fmt.usd(p.amountUsd)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="sec-title">최근 상호작용</div>
      {interactions.length === 0 ? (
        <div className="card"><EmptyState title="상호작용 내역이 없습니다" desc="이 에이전트가 호출한 함수/대상 컨트랙트가 아직 로드되지 않았습니다." /></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>시간</th><th>Tx</th><th>대상</th><th>셀렉터</th><th>함수</th></tr></thead>
            <tbody>
              {interactions.map((i, idx) => (
                <tr key={idx}>
                  <td className="td-muted">{i.ts}</td>
                  <td><TxHashText value={i.tx}/></td>
                  <td><AddressText value={i.target}/></td>
                  <td className="td-mono">{i.selector}</td>
                  <td className="td-mono">{i.fn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PageServices() {
  const rows = [...MOCK.services].sort((a, b) => b.received - a.received);
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">서비스</h1>
          <div className="page-sub">x402 정산을 받은 pay_to 주소 {fmt.num(rows.length)}개입니다.</div>
        </div>
      </div>
      {rows.length === 0 ? (
        <div className="card"><EmptyState title="서비스가 없습니다" desc="결제 수신처가 감지되면 서비스별 수신액과 지불자 수를 표시합니다." /></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr>
              <th>서비스</th><th>이름</th><th>카테고리</th>
              <th className="td-right">결제 수</th><th className="td-right">수신액</th>
              <th className="td-right">고유 지불자</th><th className="td-right">마지막 블록</th>
            </tr></thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.address}>
                  <td><AddressText value={s.address}/></td>
                  <td>{s.name || <span className="muted">이름 없음</span>}</td>
                  <td>{s.category || <span className="muted">카테고리 없음</span>}</td>
                  <td className="td-num">{s.payments}</td>
                  <td className="td-num">{fmt.usd(s.received)}</td>
                  <td className="td-num">{s.payers}</td>
                  <td className="td-num mono">{fmt.block(s.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PageInteractions() {
  const selectorMap = new Map();
  const targetMap = new Map();
  for (const item of MOCK.interactions) {
    const sel = item.selector || "unknown";
    const prev = selectorMap.get(sel) || { sel, fn: item.fn, n: 0 };
    prev.n += 1;
    selectorMap.set(sel, prev);
    const target = item.target || "unknown";
    const current = targetMap.get(target) || { target, n: 0 };
    current.n += 1;
    targetMap.set(target, current);
  }
  const selectors = [...selectorMap.values()].sort((a, b) => b.n - a.n);
  const targets = [...targetMap.values()].sort((a, b) => b.n - a.n).slice(0, 5);
  const maxSelector = Math.max(1, ...selectors.map(r => r.n));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">상호작용</h1>
          <div className="page-sub">x402 전송과 함께 호출된 함수 셀렉터와 대상 컨트랙트입니다. 퍼실리테이터 패턴을 파악하는 데 사용합니다.</div>
        </div>
      </div>
      <div className="chart-grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">셀렉터 분포</div></div>
          <div className="card-body">
            {selectors.length === 0 ? <EmptyState title="셀렉터 데이터가 없습니다" desc="상호작용이 인덱싱되면 함수 셀렉터별 호출 수가 표시됩니다." /> : selectors.map(r => (
              <div key={r.sel} className="bar-row">
                <div className="bar-label"><span className="mono">{r.sel}</span> <span className="muted" style={{fontSize: 11.5}}>· {r.fn}</span></div>
                <div className="bar-val tnum">{r.n}</div>
                <div className="bar-track" style={{gridColumn: "1 / -1"}}><div className="bar-fill" style={{width: `${(r.n/maxSelector)*100}%`}}/></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">대상 컨트랙트</div></div>
          <div className="card-body">
            {targets.length === 0 ? <EmptyState title="대상 데이터가 없습니다" desc="호출 대상 컨트랙트가 아직 없습니다." /> : targets.map(t => (
              <div className="kv" key={t.target}>
                <span className="k">{t.target?.startsWith?.("0x") ? <AddressText value={t.target}/> : <span className="mono muted">{t.target || "unknown"}</span>}</span>
                <span className="v tnum">{fmt.num(t.n)}회 호출</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {MOCK.interactions.length === 0 ? (
        <div className="card"><EmptyState title="상호작용 목록이 없습니다" desc="결제 후보를 처리하면 관련 transaction selector와 target이 저장됩니다." /></div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>시간</th><th>Tx</th><th>에이전트</th><th>대상</th><th>셀렉터</th><th>함수</th><th className="td-right">블록</th></tr></thead>
            <tbody>
              {MOCK.interactions.map((i, idx) => (
                <tr key={idx}>
                  <td className="td-muted">{i.ts}</td>
                  <td><TxHashText value={i.tx}/></td>
                  <td><AddressText value={i.agent}/></td>
                  <td><AddressText value={i.target}/></td>
                  <td className="td-mono">{i.selector}</td>
                  <td className="td-mono">{i.fn}</td>
                  <td className="td-num mono">{fmt.block(i.block)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function PageEvidence({ evidenceVariant }) {
  const [filter, setFilter] = React.useState("all");
  const [selId, setSelId] = React.useState(null);
  const all = MOCK.evidence;
  const promotedCount = all.filter(e => e.promoted).length;
  const belowCount = all.length - promotedCount;
  const rows = all.filter((e) => filter === "all" || (filter === "promoted" ? e.promoted : !e.promoted));

  React.useEffect(() => {
    if (rows.length > 0 && !rows.some((row) => row.id === selId)) {
      setSelId(rows[0].id);
    }
  }, [filter, all.length]);

  const sel = rows.find(a => a.id === selId) || rows[0];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">판별 증거</h1>
          <div className="page-sub">x402 패턴과 매칭된 모든 후보 로그입니다. 승격 {fmt.num(promotedCount)}건 · 기준 미달 {fmt.num(belowCount)}건.</div>
        </div>
        <div className="seg-tabs" role="tablist" aria-label="증거 필터">
          {[
            ["all", "전체"],
            ["promoted", "승격됨"],
            ["below", "기준 미달"],
          ].map(([id, label]) => <button key={id} type="button" className={`seg-tab ${filter===id?"active":""}`} onClick={() => setFilter(id)}>{label}</button>)}
        </div>
      </div>
      {all.length === 0 ? (
        <div className="card"><EmptyState title="판별 증거가 없습니다" desc="필터링 단계에서 x402 후보를 찾으면 신뢰도와 승격 여부가 여기에 표시됩니다." /></div>
      ) : (
        <div className="evidence-layout">
          <div className="table-wrap" style={{alignSelf: "start"}}>
            <table className="table">
              <thead><tr>
                <th>시간</th><th>Tx</th><th>방식</th>
                <th className="td-right">신뢰도</th><th>승격</th>
              </tr></thead>
              <tbody>
                {rows.map(a => (
                  <tr key={a.id} className={`clickable ${selId === a.id ? "active" : ""}`} onClick={() => setSelId(a.id)}>
                    <td className="td-muted">{a.date}</td>
                    <td><TxHashText value={a.tx}/></td>
                    <td className="td-mono" style={{fontSize: 11.5}}>{a.method}</td>
                    <td className="td-right"><ConfidenceBadge score={a.confidence}/></td>
                    <td>{a.promoted ? <span className="badge b-success"><Icons.Dot/> 예</span> : <span className="badge"><Icons.Dot/> 아니오</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <EmptyState title="선택한 필터의 증거가 없습니다" desc="다른 필터를 선택해 확인하세요." />}
          </div>
          <div>
            {sel ? (
              <div className="card evidence-sticky">
                <div className="card-header">
                  <div>
                    <div className="card-title">신뢰도 상세</div>
                    <div className="card-sub mono" style={{fontSize: 11}}>{fmt.hash(sel.tx)}</div>
                  </div>
                  <ConfidenceBadge score={sel.confidence}/>
                </div>
                <div className="card-body">
                  <EvidenceBreakdown p={{
                    method: sel.method,
                    calldataMatches: sel.calldataMatches ?? true,
                    txSuccess: sel.txSuccess ?? true,
                    authorizationUsed: sel.authorizationUsed ?? false,
                    facilitatorMatched: sel.facilitatorMatched ?? false,
                    confidence: sel.confidence,
                  }} variant={evidenceVariant}/>
                  {!sel.promoted && (
                    <div className="alert-banner warn" style={{marginTop: 14, marginBottom: 0}}>
                      <Icons.Info/>
                      <span className="desc">신뢰도 {sel.confidence}점은 승격 기준 {MOCK.settings.confidenceThreshold}점보다 낮아 payment로 승격되지 않았습니다.</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card"><EmptyState title="선택된 증거가 없습니다" desc="왼쪽 목록에서 증거를 선택하세요." /></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PageSettings() {
  const s = MOCK.settings;
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">설정</h1>
          <div className="page-sub">런타임 설정 요약입니다. 비밀값은 마스킹되며 실제 수정은 환경 변수로 합니다.</div>
        </div>
      </div>
      <div className="chart-grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">체인</div></div>
          <div className="card-body">
            <div className="kv"><span className="k">네트워크</span><span className="v">{s.chain}</span></div>
            <div className="kv"><span className="k">체인 ID</span><span className="v tnum">{s.chainId}</span></div>
            <div className="kv"><span className="k">RPC 호스트</span><span className="v mono">{s.rpcHost}</span></div>
            <div className="kv"><span className="k">RPC 키</span><span className="v mono muted">{s.rpcKeyMasked ? "****" : "—"}</span></div>
            <div className="kv"><span className="k">보조 RPC</span><span className="v tnum">{s.fallbackRpcCount}</span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">판별</div></div>
          <div className="card-body">
            <div className="kv"><span className="k">신뢰도 기준</span><span className="v tnum">{s.confidenceThreshold}</span></div>
            <div className="kv"><span className="k">퍼실리테이터 필터</span><span className="v">{s.facilitatorFilterMode}</span></div>
            <div className="kv"><span className="k">Finality 지연</span><span className="v tnum">{s.finalityLag} 블록</span></div>
            <div className="kv"><span className="k">최대 리오그 깊이</span><span className="v tnum">{s.maxReorgDepth}</span></div>
          </div>
        </div>
      </div>
      <div className="chart-grid-2">
        <div className="card">
          <div className="card-header"><div className="card-title">레지스트리</div></div>
          <div className="card-body">
            <div className="kv"><span className="k">등록 자산</span><span className="v tnum">{s.knownAssetsCount}</span></div>
            <div className="kv"><span className="k">등록 퍼실리테이터</span><span className="v tnum">{s.knownFacilitatorsCount}</span></div>
            <div className="kv"><span className="k">등록 프록시</span><span className="v tnum">{s.knownProxiesCount}</span></div>
            <div className="kv"><span className="k">퍼실리테이터 소스</span><span className="v mono" style={{fontSize: 11.5}}>{s.facilitatorSourceUrl}</span></div>
            <div className="kv"><span className="k">소스 사용</span><span className="v"><span className="badge b-success"><Icons.Dot/> 예</span></span></div>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">인프라</div></div>
          <div className="card-body">
            <div className="kv"><span className="k">데이터베이스</span><span className="v mono muted">{s.dbUrlMasked}</span></div>
            <div className="kv"><span className="k">Redis</span><span className="v mono muted">{s.redisUrlMasked}</span></div>
            <div className="muted" style={{fontSize: 11.5, marginTop: 8}}>연결 문자열은 마스킹됩니다. <span className="mono">DATABASE_URL</span>, <span className="mono">REDIS_URL</span> 환경 변수로 변경합니다.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PageDocs() {
  const docs = [
    ["전체 설계 문서", "x402 인덱서가 어떤 로직으로 결제를 찾고 저장하는지 설명합니다.", "/docs/final.md"],
    ["초보자용 로직 가이드", "블록체인/개발 지식이 없어도 전체 흐름을 학습할 수 있게 풀어쓴 문서입니다.", "/docs/INDEXER_LOGIC_GUIDE.md"],
    ["코드 흐름 분석", "파일과 함수 기준으로 인덱싱 파이프라인을 따라갑니다.", "/docs/CODEBASE_FLOW_ANALYSIS.md"],
    ["UI 요구사항", "현재 콘솔 화면을 만들 때 참고한 데이터 시각화/UX 요구사항입니다.", "/docs/UI_REQUIREMENTS.md"],
  ];
  return (
    <div className="page" style={{maxWidth: 780}}>
      <div className="page-header"><div><h1 className="page-title">문서</h1><div className="page-sub">학습 문서와 설계 참고 자료입니다.</div></div></div>
      <div className="card"><div className="card-body vstack" style={{gap: 10}}>
        {docs.map(([t, d, href]) => (
          <a key={t} href={href} className="hstack" style={{padding: "10px 12px", borderRadius: 6, border: "1px solid var(--border-subtle)", background: "var(--surface)"}} target="_blank" rel="noopener noreferrer">
            <div><div className="strong" style={{fontSize: 13}}>{t}</div><div className="muted" style={{fontSize: 12}}>{d}</div></div>
            <span style={{marginLeft: "auto", color: "var(--text-3)"}}><Icons.External/></span>
          </a>
        ))}
      </div></div>
    </div>
  );
}

Object.assign(window, { PageAgents, PageAgentDetail, PageServices, PageInteractions, PageEvidence, PageSettings, PageDocs });
