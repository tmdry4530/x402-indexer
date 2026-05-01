// App shell + routing + screens

const PAGES = [
  { id: "dashboard",    label: "대시보드",    icon: Icons.NavDash,    count: null },
  { id: "payments",     label: "결제",        icon: Icons.NavPay,     count: null },
  { id: "agents",       label: "에이전트",    icon: Icons.NavAgent,   count: null },
  { id: "services",     label: "서비스",      icon: Icons.NavService, count: null },
  { id: "interactions", label: "상호작용",    icon: Icons.NavInter,   count: null },
  { id: "evidence",     label: "판별 증거",   icon: Icons.NavEv,      count: null },
  { id: "operations",   label: "운영",        icon: Icons.NavOps,     count: null },
];
const SETTINGS_PAGES = [
  { id: "settings", label: "설정", icon: Icons.NavSet, count: null },
  { id: "docs",     label: "문서", icon: Icons.NavDocs, count: null },
];

function Sidebar({ page, setPage, opsHealth }) {
  const item = (p) => (
    <button key={p.id} type="button" className={`nav-item ${page === p.id ? "active" : ""}`} onClick={() => setPage(p.id)} aria-current={page === p.id ? "page" : undefined}>
      <p.icon /> <span>{p.label}</span>
      {p.id === "payments" && <span className="nav-count">{MOCK.overview.payments_count}</span>}
      {p.id === "agents" && <span className="nav-count">{MOCK.overview.agents_count}</span>}
      {p.id === "services" && <span className="nav-count">{MOCK.overview.services_count}</span>}
      {p.id === "interactions" && <span className="nav-count">{MOCK.interactions.length}</span>}
      {p.id === "evidence" && <span className="nav-count">{MOCK.overview.evidence_count}</span>}
    </button>
  );
  const healthDot = opsHealth === "healthy" ? "" : opsHealth === "backfill_stuck" ? "err" : "warn";
  const realtimeDot = MOCK.sync.realtimeOn ? healthDot : "warn";
  const backfillDot = opsHealth === "backfill_stuck" ? "err" : MOCK.sync.backfillOn ? "" : "warn";
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">4</div>
        <div>
          <div className="brand-title">x402 인덱서</div>
          <div className="brand-sub">Base 메인넷 · 8453</div>
        </div>
      </div>
      <nav className="nav-section">
        {PAGES.map(item)}
      </nav>
      <div className="nav-section">
        <div className="nav-label">시스템</div>
        {SETTINGS_PAGES.map(item)}
      </div>
      <div className="sidebar-footer">
        <div className="status-line"><span className={`status-dot ${realtimeDot}`}></span><span>실시간 워커</span></div>
        <div className="status-line"><span className={`status-dot ${backfillDot}`}></span><span>백필 워커</span></div>
        <div className="status-line"><span className="status-dot"></span><span>Redis 연결</span></div>
        <div className="status-line muted" style={{marginTop: 6, fontSize: 11, color: "var(--text-3)"}}>
          <span className="mono">#{fmt.num(MOCK.overview.latest_indexed_block)}</span>
          <span style={{marginLeft: "auto"}}>v0.4.2</span>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ page, crumb, onNav, onRefresh, loading }) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const detect = (s) => {
    const v = s.trim();
    if (!v) return null;
    if (/^0x[0-9a-fA-F]{64}$/.test(v)) return { type: "트랜잭션", go: "payments", note: "결제 목록에서 확인" };
    if (/^0x[0-9a-fA-F]{40}$/.test(v)) return { type: "주소", go: "agents", note: "에이전트/서비스 상세 확인" };
    if (/^0x[0-9a-fA-F]{8}$/.test(v)) return { type: "셀렉터", go: "interactions", note: "상호작용에서 확인" };
    if (/^\d+$/.test(v)) return { type: "블록", go: "operations", note: `블록 #${fmt.num(parseInt(v))} 운영 상태 확인` };
    return { type: "알 수 없음", go: null, note: "일치하는 형식이 없습니다" };
  };
  const hit = detect(q);

  return (
    <header className="topbar">
      <div className="crumb">
        <span>x402</span>
        <span className="crumb-sep">/</span>
        <span className="crumb-current">{crumb || PAGES.find(p => p.id === page)?.label || "대시보드"}</span>
      </div>
      <div className="search">
        <span className="search-icon"><Icons.Search /></span>
        <input
          className="search-input"
          placeholder="트랜잭션, 주소, 블록, 함수 셀렉터 검색…"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={e => { if (e.key === "Enter" && hit?.go) { onNav(hit.go); setOpen(false); setQ(""); } }}
          aria-label="전체 검색"
        />
        {!q && <span className="search-kbd">⌘K</span>}
        {open && q && (
          <div className="search-results">
            {hit ? (
              <>
                <div className="search-result" onMouseDown={() => { if (hit.go) onNav(hit.go); setOpen(false); setQ(""); }}>
                  <span className="type-tag">{hit.type}</span>
                  <span className="mono" style={{color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{q}</span>
                  <span style={{marginLeft: "auto", color: "var(--text-3)", fontSize: 11.5}}>{hit.note}</span>
                </div>
                <div className="search-hint"><span className="mono">Enter</span>로 이동</div>
              </>
            ) : (
              <div className="search-hint">주소, 트랜잭션 해시, 블록 번호, 함수 셀렉터를 입력하세요.</div>
            )}
          </div>
        )}
      </div>
      <div className="topbar-actions">
        <button className="btn btn-sm btn-ghost" aria-label="새로고침" onClick={onRefresh} disabled={loading}><Icons.Refresh size={13}/> <span>{loading ? "불러오는 중" : "새로고침"}</span></button>
        <button className="btn btn-sm btn-ghost" aria-label="내보내기" disabled data-tip="내보내기 API는 아직 연결되지 않았습니다."><Icons.Download size={13}/> <span>내보내기</span></button>
      </div>
    </header>
  );
}

Object.assign(window, { PAGES, Sidebar, TopBar });
