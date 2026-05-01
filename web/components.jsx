// Shared UI primitives (icons, address, table, charts)

const Icons = {
  Search: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/></svg>,
  Copy: (p) => <svg width={p?.size||12} height={p?.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  External: (p) => <svg width={p?.size||12} height={p?.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>,
  Check: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  X: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Circle: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/></svg>,
  ArrowRight: (p) => <svg width={p?.size||12} height={p?.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  ChevronDown: (p) => <svg width={p?.size||12} height={p?.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>,
  ChevronUp: (p) => <svg width={p?.size||12} height={p?.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>,
  ChevronLeft: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>,
  ChevronRight: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>,
  Filter: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  Download: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Refresh: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  Plus: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  // Nav
  NavDash: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  NavPay: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  NavAgent: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  NavService: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="8" rx="2"/><rect x="2" y="13" width="20" height="8" rx="2"/><line x1="6" y1="7" x2="6.01" y2="7"/><line x1="6" y1="17" x2="6.01" y2="17"/></svg>,
  NavInter: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  NavEv: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  NavOps: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  NavSet: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  NavDocs: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Dot: () => <span style={{width:6, height:6, borderRadius:3, background:"currentColor", display:"inline-block"}}/>,
  Alert: (p) => <svg width={p?.size||14} height={p?.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  Info: (p) => <svg width={p?.size||12} height={p?.size||12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Play: (p) => <svg width={p?.size||12} height={p?.size||12} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
};

function copy(text) {
  try { navigator.clipboard.writeText(text); } catch(e) {}
}

function AddressText({ value, label, short = true, clickable = false, onClick }) {
  const [copied, setCopied] = React.useState(false);
  if (!value) return null;
  const display = short ? fmt.addr(value) : value;
  const handleCopy = (e) => {
    e.stopPropagation();
    copy(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 900);
  };
  return (
    <span className="addr" title={value} onClick={(e) => { if (clickable && onClick) { e.stopPropagation(); onClick(value); } }}>
      {label && <span className="label">{label}</span>}
      <span className="mono">{display}</span>
      <button className="icon-btn" onClick={handleCopy} aria-label="주소 복사">
        <Icons.Copy />
      </button>
      <a className="icon-btn" href={`https://basescan.org/address/${value}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="BaseScan에서 주소 열기">
        <Icons.External />
      </a>
      {copied && <span className="copied">복사됨</span>}
    </span>
  );
}

function TxHashText({ value, onClick }) {
  const [copied, setCopied] = React.useState(false);
  if (!value) return null;
  return (
    <span className="hash" title={value} onClick={(e) => { if (onClick) { e.stopPropagation(); onClick(value); } }}>
      <span className="mono">{fmt.hash(value)}</span>
      <button className="icon-btn" onClick={(e) => { e.stopPropagation(); copy(value); setCopied(true); setTimeout(() => setCopied(false), 900); }} aria-label="트랜잭션 해시 복사">
        <Icons.Copy />
      </button>
      <a className="icon-btn" href={`https://basescan.org/tx/${value}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} aria-label="BaseScan에서 트랜잭션 열기">
        <Icons.External />
      </a>
      {copied && <span className="copied">복사됨</span>}
    </span>
  );
}

function ConfidenceBadge({ score }) {
  const safeScore = Number.isFinite(Number(score)) ? Number(score) : 0;
  let cls = "b-success", label = "매우 높음";
  if (safeScore < 40) { cls = "b-danger"; label = "약함"; }
  else if (safeScore < 70) { cls = "b-warning"; label = "증거만 있음"; }
  else if (safeScore < 90) { cls = "b-info"; label = "승격됨"; }
  return (
    <span className={`badge ${cls}`} data-tip="신뢰도 점수는 EIP-3009 서명, AuthorizationUsed 이벤트, calldata 일치 여부, 퍼실리테이터 등록 정보를 합산합니다.">
      <Icons.Dot /> {safeScore} · {label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    running: { cls: "b-success", label: "실행 중" },
    completed: { cls: "b-info", label: "완료" },
    failed: { cls: "b-danger", label: "실패" },
    queued: { cls: "", label: "대기" },
    pending_manual: { cls: "b-warning", label: "수동 재처리 필요" },
    reorged: { cls: "b-warning", label: "리오그 감지" },
  };
  const m = map[status] || { cls: "", label: status || "알 수 없음" };
  return <span className={`badge ${m.cls}`}><Icons.Dot /> {m.label}</span>;
}

function TypeBadge({ type }) {
  const map = {
    asset: { cls: "b-info", label: "자산" },
    facilitator: { cls: "b-accent", label: "퍼실리테이터" },
    proxy: { cls: "", label: "프록시" },
    agent: { cls: "", label: "에이전트" },
    service: { cls: "", label: "서비스" },
    unknown: { cls: "", label: "미분류" },
  };
  const value = map[type] || { cls: "", label: type || "미분류" };
  return <span className={`badge ${value.cls}`}>{value.label}</span>;
}

function EmptyState({ title = "표시할 데이터가 없습니다", desc = "인덱싱이 진행되면 이 영역에 실시간 데이터가 표시됩니다.", action = null }) {
  return (
    <div className="empty">
      <div className="title">{title}</div>
      {desc && <div className="desc">{desc}</div>}
      {action}
    </div>
  );
}

// Line / bar chart SVG
function LineChart({ data = [], width = 600, height = 140, color = "var(--chart-1)", fill = true, showAxis = true, accessor = (d) => d.volume, labelAccessor = (d) => d.date }) {
  const safeData = Array.isArray(data) ? data : [];
  if (safeData.length === 0) {
    return (
      <svg width={width} height={height} style={{display: "block"}} role="img" aria-label="빈 선 그래프">
        <rect x="0" y="0" width={width} height={height} fill="transparent" />
        <text x={width / 2} y={height / 2} fill="var(--text-3)" fontSize="12" textAnchor="middle" dominantBaseline="middle">데이터 없음</text>
      </svg>
    );
  }
  const pad = { top: 10, right: 10, bottom: showAxis ? 22 : 4, left: showAxis ? 40 : 4 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const values = safeData.map((d) => Number(accessor(d)) || 0);
  const max = Math.max(...values, 0.001);
  const stepX = w / Math.max(safeData.length - 1, 1);
  const points = safeData.map((d, i) => {
    const x = pad.left + i * stepX;
    const y = pad.top + h - ((Number(accessor(d)) || 0) / max) * h;
    return [x, y];
  });
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaPath = `${path} L ${points[points.length - 1][0]} ${pad.top + h} L ${points[0][0]} ${pad.top + h} Z`;

  return (
    <svg width={width} height={height} style={{display: "block"}} role="img" aria-label="시계열 선 그래프">
      {showAxis && [0, 0.5, 1].map((t, i) => (
        <line key={i} x1={pad.left} y1={pad.top + h - t * h} x2={pad.left + w} y2={pad.top + h - t * h}
              stroke="var(--border-subtle)" strokeDasharray={t === 0 ? "" : "2 3"} />
      ))}
      {showAxis && [0, 0.5, 1].map((t, i) => (
        <text key={"l"+i} x={pad.left - 6} y={pad.top + h - t * h + 3} fontSize="9.5" fill="var(--text-3)" textAnchor="end" fontFamily="var(--font-mono)">
          {(max * t).toFixed(4)}
        </text>
      ))}
      {fill && <path d={areaPath} fill={color} fillOpacity="0.12" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" />
      {points.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2" fill={color} />
      ))}
      {showAxis && safeData.map((d, i) => {
        if (i % Math.max(Math.floor(safeData.length / 6), 1) !== 0 && i !== safeData.length - 1) return null;
        return <text key={"x"+i} x={pad.left + i * stepX} y={height - 6} fontSize="10" fill="var(--text-3)" textAnchor="middle">{labelAccessor(d)}</text>;
      })}
    </svg>
  );
}

function BarChart({ data = [], width = 600, height = 140, color = "var(--chart-1)", accessor = (d) => d.payments, labelAccessor = (d) => d.date }) {
  const safeData = Array.isArray(data) ? data : [];
  if (safeData.length === 0) {
    return (
      <svg width={width} height={height} style={{display: "block"}} role="img" aria-label="빈 막대 그래프">
        <rect x="0" y="0" width={width} height={height} fill="transparent" />
        <text x={width / 2} y={height / 2} fill="var(--text-3)" fontSize="12" textAnchor="middle" dominantBaseline="middle">데이터 없음</text>
      </svg>
    );
  }
  const pad = { top: 10, right: 10, bottom: 22, left: 28 };
  const w = width - pad.left - pad.right;
  const h = height - pad.top - pad.bottom;
  const values = safeData.map((d) => Number(accessor(d)) || 0);
  const max = Math.max(...values, 1);
  const n = safeData.length;
  const gap = 2;
  const bw = Math.max(1, (w - gap * (n - 1)) / n);
  return (
    <svg width={width} height={height} style={{display: "block"}} role="img" aria-label="막대 그래프">
      {[0, 0.5, 1].map((t, i) => (
        <line key={i} x1={pad.left} y1={pad.top + h - t * h} x2={pad.left + w} y2={pad.top + h - t * h}
              stroke="var(--border-subtle)" strokeDasharray={t === 0 ? "" : "2 3"} />
      ))}
      {[0, max].map((v, i) => (
        <text key={"l"+i} x={pad.left - 6} y={pad.top + h - (v === 0 ? 0 : h) + 3} fontSize="9.5" fill="var(--text-3)" textAnchor="end" fontFamily="var(--font-mono)">{v}</text>
      ))}
      {safeData.map((d, i) => {
        const v = Number(accessor(d)) || 0;
        const bh = (v / max) * h;
        const x = pad.left + i * (bw + gap);
        const y = pad.top + h - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw} height={Math.max(bh, v > 0 ? 2 : 0)} fill={v > 0 ? color : "var(--border)"} rx="1" />
          </g>
        );
      })}
      {safeData.map((d, i) => {
        if (i % Math.max(Math.floor(n / 6), 1) !== 0 && i !== n - 1) return null;
        return <text key={"x"+i} x={pad.left + i * (bw + gap) + bw / 2} y={height - 6} fontSize="10" fill="var(--text-3)" textAnchor="middle">{labelAccessor(d)}</text>;
      })}
    </svg>
  );
}

// Sparkline
function Spark({ data = [], width = 80, height = 22, color = "var(--chart-1)", accessor = (d) => d }) {
  const values = (Array.isArray(data) ? data : []).map((d) => Number(accessor(d)) || 0);
  if (values.length === 0) {
    return <svg width={width} height={height} className="spark" aria-hidden="true" />;
  }
  const max = Math.max(...values, 0.0001);
  const min = Math.min(...values);
  const n = values.length;
  const stepX = width / Math.max(n - 1, 1);
  const points = values.map((v, i) => [i * stepX, height - ((v - min) / (max - min || 1)) * height]);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} className="spark" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="1.25" />
    </svg>
  );
}

// Pagination
function Pagination({ page, total, pageSize, onChange }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : Math.min(total, (page - 1) * pageSize + 1);
  return (
    <div className="pagination">
      <span className="muted" style={{marginRight: 12}}>
        {start}–{Math.min(total, page * pageSize)} / 총 {fmt.num(total)}건
      </span>
      <button className="btn btn-sm btn-icon" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="이전 페이지"><Icons.ChevronLeft /></button>
      <span className="muted" style={{padding: "0 6px", fontSize: 12}}>페이지 {page} / {pages}</span>
      <button className="btn btn-sm btn-icon" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="다음 페이지"><Icons.ChevronRight /></button>
    </div>
  );
}

// Simple sort helper
function useSort(defaultKey, defaultDir = "desc") {
  const [key, setKey] = React.useState(defaultKey);
  const [dir, setDir] = React.useState(defaultDir);
  const toggle = (k) => {
    if (key === k) setDir(d => d === "asc" ? "desc" : "asc");
    else { setKey(k); setDir("desc"); }
  };
  return { key, dir, toggle };
}

function SortHeader({ label, k, sort, align }) {
  const active = sort.key === k;
  const ariaSort = active ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
  return (
    <th className={`sortable ${active ? "sorted" : ""}`} aria-sort={ariaSort} style={align === "right" ? {textAlign: "right"} : {}}>
      <button type="button" className="sort-btn" onClick={() => sort.toggle(k)}>
        {label}
        <span className="sort-ind">
          {active ? (sort.dir === "asc" ? "▲" : "▼") : "▾"}
        </span>
      </button>
    </th>
  );
}

Object.assign(window, {
  Icons, AddressText, TxHashText, ConfidenceBadge, StatusBadge, TypeBadge, EmptyState,
  LineChart, BarChart, Spark, Pagination, useSort, SortHeader, copy,
});
