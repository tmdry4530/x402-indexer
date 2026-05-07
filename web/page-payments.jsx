// 결제 페이지 — API에서 받은 payment 목록과 상세 증거/트랜잭션 원문을 보여준다.

function FilterBar({ filters, setFilters }) {
  const set = (k, v) => setFilters({ ...filters, [k]: v });
  const reset = () => setFilters({payer: "", payTo: "", minUsd: "", maxUsd: "", from: "", to: ""});
  return (
    <div className="filter-bar">
      <span style={{fontSize: 12, color: "var(--text-3)", display: "flex", alignItems: "center", gap: 6}}>
        <Icons.Filter size={12}/> 필터
      </span>
      <input className="input mono" placeholder="지불자 0x…" value={filters.payer} onChange={e => set("payer", e.target.value)}/>
      <input className="input mono" placeholder="수신처 0x…" value={filters.payTo} onChange={e => set("payTo", e.target.value)}/>
      <input className="input" type="number" placeholder="최소 USD" value={filters.minUsd} onChange={e => set("minUsd", e.target.value)} style={{minWidth: 100}}/>
      <input className="input" type="number" placeholder="최대 USD" value={filters.maxUsd} onChange={e => set("maxUsd", e.target.value)} style={{minWidth: 100}}/>
      <input className="input" type="date" value={filters.from} onChange={e => set("from", e.target.value)} style={{minWidth: 130}} aria-label="시작일"/>
      <span className="muted" style={{fontSize: 11}}>→</span>
      <input className="input" type="date" value={filters.to} onChange={e => set("to", e.target.value)} style={{minWidth: 130}} aria-label="종료일"/>
      <div style={{marginLeft: "auto"}} className="hstack">
        <button className="btn btn-sm btn-ghost" onClick={reset}>초기화</button>
        <button className="btn btn-sm" disabled data-tip="CSV 내보내기는 다음 단계 API에서 연결할 예정입니다."><Icons.Download size={12}/> <span>CSV</span></button>
      </div>
    </div>
  );
}

function PaymentDetailBody({ p, loading, error }) {
  const gasPrice = Number(p.gasPriceGwei || 0).toLocaleString('ko-KR', { maximumFractionDigits: 9 });
  return (
    <>
      {loading && (
        <div className="alert-banner info">
          <Icons.Info />
          <span className="desc">결제 상세 데이터를 불러오는 중입니다.</span>
        </div>
      )}
      {error && (
        <div className="alert-banner warn">
          <Icons.Alert />
          <span className="desc">상세 조회에 실패해 목록 데이터를 표시합니다: {error}</span>
        </div>
      )}

      <div className="drawer-section">
        <div className="drawer-section-title">요약</div>
        <div style={{fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 4}} className="tnum">
          {fmt.usd(p.amountUsd)} <span className="muted" style={{fontSize: 13, fontWeight: 500}}>· {fmt.usdc(p.amount)}</span>
        </div>
        <div className="muted" style={{fontSize: 12}}>
          블록 {fmt.block(p.block)} · 로그 #{p.logIndex} · {p.date}
        </div>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-title">전송 흐름</div>
        <div className="flow">
          <div className="flow-party">
            <div className="role">지불자</div>
            <div className="addr-wrap"><AddressText value={p.payer}/></div>
            <div className="sub">Transfer.from</div>
          </div>
          <div className="flow-arrow">
            <div className="amount">{fmt.usdc(p.amount).replace(" USDC","")}</div>
            <div className="line"/>
            <div className="meta">USDC · {p.functionName}</div>
          </div>
          <div className="flow-party">
            <div className="role">수신처</div>
            <div className="addr-wrap"><AddressText value={p.payTo}/></div>
            <div className="sub">서비스</div>
          </div>
        </div>
        {p.submitter && p.submitter !== p.payer && (
          <div className="muted" style={{fontSize: 11.5}}>
            제출자(tx.from): <span className="mono">{fmt.addr(p.submitter)}</span> {p.facilitatorMatched && <span className="badge b-accent" style={{marginLeft: 4}}>퍼실리테이터</span>}
          </div>
        )}
      </div>

      <div className="drawer-section">
        <div className="drawer-section-title">신뢰도 · {p.confidence}/100</div>
        <EvidenceBreakdown p={p} variant="checklist"/>
      </div>

      <div className="drawer-section">
        <div className="drawer-section-title">원본 트랜잭션</div>
        <div className="kv"><span className="k">Tx 해시</span><span className="v"><TxHashText value={p.tx}/></span></div>
        <div className="kv"><span className="k">셀렉터</span><span className="v mono">{p.selector || "—"}</span></div>
        <div className="kv"><span className="k">함수</span><span className="v mono">{p.functionName || "—"}</span></div>
        <div className="kv"><span className="k">가스 사용량</span><span className="v tnum mono">{fmt.num(p.gasUsed)}</span></div>
        <div className="kv"><span className="k">가스 가격</span><span className="v tnum mono">{gasPrice} gwei</span></div>
        <div className="kv"><span className="k">가스 비용</span><span className="v tnum">{fmt.usd(p.gasUsd)}</span></div>
        <div className="kv"><span className="k">자산</span><span className="v"><AddressText value={p.asset} label="USDC"/></span></div>
      </div>

      <div className="hstack" style={{gap: 6}}>
        <a className="btn btn-sm" href={`https://basescan.org/tx/${p.tx}`} target="_blank" rel="noopener noreferrer"><Icons.External size={12}/> <span>BaseScan</span></a>
        <button className="btn btn-sm" onClick={() => copy(p.tx)}><Icons.Copy size={12}/> <span>Tx 복사</span></button>
      </div>
    </>
  );
}

function EvidenceBreakdown({ p, variant = "checklist" }) {
  const checks = [
    { label: "EIP-3009 또는 Permit2 방식", short: "방식", sub: p.method || p.functionName || "감지 방식 없음", pass: true, weight: 20 },
    { label: "calldata와 Transfer 로그 일치", short: "일치", sub: "수량, 지불자, 수신처가 ERC-20 Transfer 로그와 맞는지 확인", pass: Boolean(p.calldataMatches), weight: 20 },
    { label: "트랜잭션 성공", short: "성공", sub: "영수증 status = 1", pass: Boolean(p.txSuccess), weight: 10 },
    { label: "AuthorizationUsed 이벤트", short: "Auth", sub: "USDC 컨트랙트가 위임 사용 이벤트를 발생", pass: Boolean(p.authorizationUsed), weight: 30 },
    { label: "등록된 퍼실리테이터 제출", short: "제출자", sub: p.facilitatorMatched ? "tx.from이 registry/allowlist에 존재" : "직접 서명 또는 미등록 제출자", pass: Boolean(p.facilitatorMatched), weight: 20, partial: !p.facilitatorMatched },
  ];
  const earned = checks.filter(c => c.pass).reduce((s,c) => s + c.weight, 0);

  if (variant === "bar") {
    const total = checks.reduce((s,c) => s + c.weight, 0);
    return (
      <div className="conf-viz">
        <div className="ev-bar-track">
          {checks.map((c,i) => (
            <div key={i} className="ev-bar-seg" style={{
              width: `${(c.weight/total)*100}%`,
              background: c.pass ? `rgba(63,185,132,${0.7 - i*0.08})` : "var(--surface-2)",
              color: c.pass ? "#fff" : "var(--text-4)",
            }} data-tip={`${c.label}: +${c.pass ? c.weight : 0}`}>
              {c.weight}
            </div>
          ))}
        </div>
        <div className="hstack" style={{marginTop: 10, justifyContent: "space-between", fontSize: 12}}>
          <span className="muted">획득 점수 {earned} / {total}</span>
          <span className="strong tnum">{p.confidence}/100</span>
        </div>
      </div>
    );
  }

  if (variant === "radar") {
    const cx = 90, cy = 90, r = 72;
    const pts = checks.map((c, i) => {
      const a = (Math.PI * 2 * i) / checks.length - Math.PI / 2;
      const mag = c.pass ? 1 : (c.partial ? 0.15 : 0);
      return [cx + Math.cos(a) * r * mag, cy + Math.sin(a) * r * mag];
    });
    const axes = checks.map((_, i) => {
      const a = (Math.PI * 2 * i) / checks.length - Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
    return (
      <div className="radar-wrap">
        <svg width="240" height="200" role="img" aria-label="신뢰도 레이더 차트">
          {[0.33, 0.66, 1].map(t => (
            <polygon key={t} points={axes.map(([x,y]) => `${cx + (x-cx)*t},${cy + (y-cy)*t}`).join(" ")} fill="none" stroke="var(--border-subtle)"/>
          ))}
          {axes.map((a, i) => <line key={i} x1={cx} y1={cy} x2={a[0]} y2={a[1]} stroke="var(--border-subtle)"/>)}
          <polygon points={pts.map(p => p.join(",")).join(" ")} fill="var(--success-muted)" stroke="var(--success)" strokeWidth="1.25"/>
          {checks.map((c, i) => {
            const a = (Math.PI * 2 * i) / checks.length - Math.PI / 2;
            const x = cx + Math.cos(a) * (r + 14);
            const y = cy + Math.sin(a) * (r + 14);
            return <text key={i} x={x} y={y} fontSize="9" fill="var(--text-3)" textAnchor="middle" dominantBaseline="middle">{c.short}</text>;
          })}
          <text x={cx} y={cy} fontSize="18" fill="var(--text)" textAnchor="middle" dominantBaseline="middle" fontWeight="600" fontFamily="var(--font-mono)">{p.confidence}</text>
        </svg>
      </div>
    );
  }

  return (
    <div className="evidence-list">
      {checks.map((c, i) => (
        <div key={i} className="evidence-row">
          <span className={c.pass ? "check" : (c.partial ? "partial" : "miss")}>
            {c.pass ? <Icons.Check size={14}/> : <Icons.Circle size={12}/>}
          </span>
          <div>
            <div className="label">{c.label}</div>
            <div className="sub">{c.sub}</div>
          </div>
          <div className="score">+{c.pass ? c.weight : 0}</div>
        </div>
      ))}
    </div>
  );
}

function PaymentsTable({ payments, activeId, onRowClick }) {
  const sort = useSort("ts", "desc");
  const rows = [...payments].sort((a, b) => {
    const g = (x) => sort.key === "amountUsd" ? x.amountUsd : sort.key === "block" ? x.block : sort.key === "confidence" ? x.confidence : new Date(x.ts).getTime();
    const [A, B] = [g(a), g(b)];
    return sort.dir === "asc" ? A - B : B - A;
  });
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <SortHeader label="시간" k="ts" sort={sort}/>
            <th>Tx</th>
            <SortHeader label="블록" k="block" sort={sort}/>
            <th>지불자</th>
            <th>수신처</th>
            <th>자산</th>
            <th style={{textAlign: "right"}}>수량</th>
            <SortHeader label="USD" k="amountUsd" sort={sort} align="right"/>
            <SortHeader label="신뢰도" k="confidence" sort={sort} align="right"/>
          </tr>
        </thead>
        <tbody>
          {rows.map(p => {
            const open = () => onRowClick(p);
            return (
            <tr key={p.id} className={`clickable ${activeId === p.id ? "active" : ""}`} role="button" tabIndex={0} aria-label={`결제 상세 열기 ${fmt.hash(p.tx)}`} onClick={open} onKeyDown={(e) => { if (e.currentTarget !== e.target) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}>
              <td className="td-muted" data-tip={p.ts}>{p.date}</td>
              <td><TxHashText value={p.tx}/></td>
              <td className="td-num mono">{fmt.block(p.block)}</td>
              <td><AddressText value={p.payer}/></td>
              <td><AddressText value={p.payTo}/></td>
              <td><span className="badge b-info">USDC</span></td>
              <td className="td-num mono">{fmt.usdc(p.amount)}</td>
              <td className="td-num">{fmt.usd(p.amountUsd)}</td>
              <td className="td-right"><ConfidenceBadge score={p.confidence}/></td>
            </tr>
            );
          })}
        </tbody>
      </table>
      <div className="table-footer">
        <span>{fmt.num(rows.length)}건의 결제</span>
        <Pagination page={1} total={rows.length} pageSize={20} onChange={()=>{}}/>
      </div>
    </div>
  );
}

function PagePayments({ onOpenPayment, selectedId }) {
  const [filters, setFilters] = React.useState({payer: "", payTo: "", minUsd: "", maxUsd: "", from: "", to: ""});
  const rows = MOCK.payments.filter(p => {
    if (filters.payer && !p.payer.toLowerCase().includes(filters.payer.toLowerCase())) return false;
    if (filters.payTo && !p.payTo.toLowerCase().includes(filters.payTo.toLowerCase())) return false;
    if (filters.minUsd && p.amountUsd < parseFloat(filters.minUsd)) return false;
    if (filters.maxUsd && p.amountUsd > parseFloat(filters.maxUsd)) return false;
    if (filters.from && new Date(p.ts).getTime() < new Date(`${filters.from}T00:00:00Z`).getTime()) return false;
    if (filters.to && new Date(p.ts).getTime() > new Date(`${filters.to}T23:59:59Z`).getTime()) return false;
    return true;
  });
  const reset = () => setFilters({payer: "", payTo: "", minUsd: "", maxUsd: "", from: "", to: ""});
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">결제</h1>
          <div className="page-sub">{fmt.num(rows.length)}건의 x402 결제가 인덱싱되었습니다. 행을 클릭하거나 Enter를 누르면 신뢰도와 원본 트랜잭션을 확인할 수 있습니다.</div>
        </div>
      </div>
      <FilterBar filters={filters} setFilters={setFilters}/>
      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            title="조건에 맞는 결제가 없습니다"
            desc="필터를 초기화하거나 주소/금액/날짜 범위를 넓혀보세요. 데이터 자체가 없다면 백필 또는 실시간 워커 상태를 먼저 확인해야 합니다."
            action={<button className="btn btn-sm" onClick={reset}>필터 초기화</button>}
          />
        </div>
      ) : (
        <PaymentsTable payments={rows} activeId={selectedId} onRowClick={onOpenPayment}/>
      )}
    </div>
  );
}

function PaymentDrawer({ payment, onClose, variant }) {
  const [detail, setDetail] = React.useState(payment);
  const [state, setState] = React.useState({ loading: false, error: null });

  React.useEffect(() => {
    let alive = true;
    setDetail(payment);
    setState({ loading: true, error: null });
    window.loadPaymentDetail(payment)
      .then((next) => { if (alive) setDetail(next || payment); })
      .catch((error) => { if (alive) setState({ loading: false, error: error instanceof Error ? error.message : String(error) }); })
      .finally(() => { if (alive) setState((current) => ({ ...current, loading: false })); });
    return () => { alive = false; };
  }, [payment?.id]);

  if (!payment) return null;
  const p = detail || payment;
  const relatedPayments = MOCK.payments.filter(item => item.payer === p.payer && item.id !== p.id).slice(0, 3);
  if (variant === "page") {
    return (
      <div className="drawer-overlay" onClick={onClose}>
        <div className="detail-page-shell" onClick={e => e.stopPropagation()}>
          <div className="drawer-header">
            <div className="hstack">
              <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose} aria-label="닫기"><Icons.ChevronLeft/></button>
              <span className="drawer-title">결제</span>
              <span className="mono muted" style={{fontSize: 12}}>{fmt.hash(p.tx)}</span>
            </div>
            <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose} aria-label="닫기"><Icons.X/></button>
          </div>
          <div className="detail-page-body">
            <div><PaymentDetailBody p={p} loading={state.loading} error={state.error}/></div>
            <div>
              <div className="card">
                <div className="card-header"><div className="card-title">관련 활동</div></div>
                <div className="card-body">
                  <div className="muted" style={{fontSize: 12, marginBottom: 8}}>같은 지불자의 다른 결제</div>
                  {relatedPayments.length === 0 ? (
                    <EmptyState title="관련 결제가 없습니다" desc="현재 목록에는 같은 지불자의 다른 결제가 없습니다." />
                  ) : relatedPayments.map(item => (
                    <div key={item.id} className="hstack" style={{justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 12}}>
                      <TxHashText value={item.tx}/>
                      <span className="tnum">{fmt.usd(item.amountUsd)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="drawer-overlay" onClick={onClose}/>
      <aside className="drawer">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">결제</div>
          </div>
          <button className="btn btn-sm btn-ghost btn-icon" onClick={onClose} aria-label="닫기"><Icons.X/></button>
        </div>
        <div className="drawer-body">
          <PaymentDetailBody p={p} loading={state.loading} error={state.error}/>
        </div>
      </aside>
    </>
  );
}

Object.assign(window, { PagePayments, PaymentDrawer, EvidenceBreakdown });
