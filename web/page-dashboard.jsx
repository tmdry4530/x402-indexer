// 대시보드 페이지 — 실제 API에서 읽은 결제/증거/운영 요약을 한 화면에 보여준다.

function PageDashboard({ layoutVariant, onNavigate, onOpenPayment, loadState = { loading: false, error: null } }) {
  const ov = MOCK.overview;
  const cards = [
    { label: "인덱싱된 결제", value: fmt.num(ov.payments_count), delta: `${fmt.num(ov.evidence_count)}개 후보 중 승격`, deltaCls: "", spark: MOCK.daily.map(d => d.payments) },
    { label: "총 결제액", value: fmt.usd(ov.total_volume_usd), delta: "USDC 정산 금액 합계", deltaCls: "", spark: MOCK.daily.map(d => d.volume) },
    { label: "가스 비용", value: fmt.usd(ov.total_gas_usd), delta: `순 ROI ${fmt.usd(ov.net_roi_usd)}`, deltaCls: ov.net_roi_usd < 0 ? "down" : "up", spark: MOCK.daily.map(d => d.gas) },
    { label: "활성 에이전트", value: fmt.num(ov.agents_count), delta: `${fmt.num(ov.services_count)}개 서비스로 결제`, deltaCls: "", spark: null },
    { label: "증거 승격률", value: Math.round(ov.promotion_rate * 100) + "%", delta: `${fmt.num(ov.payments_count)} / ${fmt.num(ov.evidence_count)} 승격`, deltaCls: "", spark: null },
    { label: "최신 인덱싱 블록", value: fmt.block(ov.latest_indexed_block), delta: MOCK.sync.lastCheckpointAgo ? `체크포인트 ${MOCK.sync.lastCheckpointAgo}` : "체크포인트 없음", deltaCls: "", spark: null },
  ];

  const topAgents = [...MOCK.agents].sort((a,b) => b.spent - a.spent).slice(0, 5);
  const topServices = [...MOCK.services].sort((a,b) => b.received - a.received).slice(0, 5);
  const topSvcMax = Math.max(1, ...topServices.map(s => s.received));
  const topAgMax = Math.max(1, ...topAgents.map(a => a.spent));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">대시보드</h1>
          <div className="page-sub">Base 메인넷에서 감지한 x402 결제 활동과 인덱서 상태를 한눈에 봅니다.</div>
        </div>
        <div className="hstack">
          <div className="seg-tabs" aria-label="조회 기간">
            {["24시간","7일","14일","30일"].map((t,i) => <span key={t} className={`seg-tab ${i===2?"active":""}`}>{t}</span>)}
          </div>
        </div>
      </div>

      {loadState.loading && (
        <div className="alert-banner info">
          <Icons.Info />
          <span className="desc">API에서 최신 인덱싱 데이터를 불러오는 중입니다.</span>
        </div>
      )}
      {loadState.error && (
        <div className="alert-banner err">
          <Icons.Alert />
          <span className="desc">데이터를 불러오지 못했습니다: {loadState.error}</span>
        </div>
      )}

      {layoutVariant === "row" ? (
        <div className="kpi-row">
          {cards.map(c => (
            <div className="kpi-cell" key={c.label}>
              <span className="label">{c.label}</span>
              <span className="val">{c.value}</span>
              <span className="muted" style={{fontSize: 11}}>{c.delta}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="kpi-grid kpi-grid-dashboard">
          {cards.map(c => (
            <div className="kpi" key={c.label}>
              <div className="kpi-label">{c.label}
                {c.spark && <span style={{marginLeft: "auto"}}><Spark data={c.spark} color="var(--chart-1)"/></span>}
              </div>
              <div className="kpi-value">{c.value}</div>
              <div className={`kpi-delta ${c.deltaCls}`}>{c.delta}</div>
            </div>
          ))}
        </div>
      )}

      <div className="chart-grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">일별 결제 금액</div>
              <div className="card-sub">일자별 USDC 정산액입니다. 데이터가 없으면 빈 그래프를 표시합니다.</div>
            </div>
            <span className="badge">USD</span>
          </div>
          <div className="card-body">
            <LineChart data={MOCK.daily} accessor={d => d.volume} width={680} height={180}/>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">일별 결제 수</div>
              <div className="card-sub">날짜별 승격된 payment 개수</div>
            </div>
          </div>
          <div className="card-body">
            <BarChart data={MOCK.daily} accessor={d => d.payments} width={340} height={180}/>
          </div>
        </div>
      </div>

      <div className="chart-grid-2">
        <div className="card">
          <div className="card-header">
            <div className="card-title">지출 상위 에이전트</div>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate("agents")}>전체 보기 <Icons.ArrowRight/></button>
          </div>
          <div className="card-body" style={{paddingTop: 6}}>
            {topAgents.length === 0 ? (
              <EmptyState title="에이전트 데이터가 없습니다" desc="결제가 승격되면 payer 주소별 집계가 표시됩니다." />
            ) : topAgents.map(a => (
              <div key={a.address} className="bar-row">
                <div className="bar-label">
                  <AddressText value={a.address}/>
                  <span className="muted" style={{fontSize: 11}}>· {a.kind}</span>
                </div>
                <div className="bar-val tnum">{fmt.usd(a.spent)}</div>
                <div className="bar-track" style={{gridColumn: "1 / -1"}}>
                  <div className="bar-fill" style={{width: `${(a.spent / topAgMax) * 100}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">수신 상위 서비스</div>
            <button className="btn btn-sm btn-ghost" onClick={() => onNavigate("services")}>전체 보기 <Icons.ArrowRight/></button>
          </div>
          <div className="card-body" style={{paddingTop: 6}}>
            {topServices.length === 0 ? (
              <EmptyState title="서비스 데이터가 없습니다" desc="pay_to 주소로 결제가 들어오면 서비스별 수신액을 집계합니다." />
            ) : topServices.map(s => (
              <div key={s.address} className="bar-row">
                <div className="bar-label">
                  <AddressText value={s.address}/>
                  <span className="muted" style={{fontSize: 11}}>· {s.name || "이름 없음"}</span>
                </div>
                <div className="bar-val tnum">{fmt.usd(s.received)}</div>
                <div className="bar-track" style={{gridColumn: "1 / -1"}}>
                  <div className="bar-fill" style={{width: `${(s.received / topSvcMax) * 100}%`, background: "var(--chart-2)"}}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">최근 결제</div>
            <div className="card-sub">가장 최근에 승격된 x402 payment입니다. 행을 클릭하거나 Enter로 상세를 엽니다.</div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={() => onNavigate("payments")}>전체 보기 <Icons.ArrowRight/></button>
        </div>
        {MOCK.payments.length === 0 ? (
          <EmptyState title="아직 승격된 결제가 없습니다" desc="백필 또는 실시간 워커가 x402 후보를 찾아 신뢰도 기준을 넘기면 여기에 표시됩니다." />
        ) : (
          <div className="table-wrap table-wrap-flat">
            <table className="table">
              <thead>
                <tr>
                  <th>시간</th>
                  <th>Tx</th>
                  <th>지불자</th>
                  <th>수신처</th>
                  <th className="td-right">수량</th>
                  <th className="td-right">USD</th>
                  <th className="td-right">신뢰도</th>
                </tr>
              </thead>
              <tbody>
                {MOCK.payments.slice(0, 5).map(p => {
                  const open = () => onOpenPayment(p);
                  return (
                  <tr key={p.id} className="clickable" role="button" tabIndex={0} aria-label={`결제 상세 열기 ${fmt.hash(p.tx)}`} onClick={open} onKeyDown={(e) => { if (e.currentTarget !== e.target) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}>
                    <td className="td-muted" data-tip={p.ts}>{p.date}</td>
                    <td><TxHashText value={p.tx}/></td>
                    <td><AddressText value={p.payer}/></td>
                    <td><AddressText value={p.payTo}/></td>
                    <td className="td-num mono">{fmt.usdc(p.amount)}</td>
                    <td className="td-num">{fmt.usd(p.amountUsd)}</td>
                    <td className="td-right"><ConfidenceBadge score={p.confidence}/></td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { PageDashboard });
