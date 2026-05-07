// 운영 페이지 — 체크포인트, 백필 작업, 워커 상태를 확인하고 백필을 큐에 넣는다.

function OpsAlertBanner({ variant }) {
  if (variant === "healthy") return null;
  if (variant === "rpc_lag") {
    return (
      <div className="alert-banner warn">
        <Icons.Alert />
        <span className="title">RPC 응답 지연</span>
        <span className="desc">주 RPC가 느리거나 제한될 때는 보조 RPC로 전환해야 합니다. 실제 운영에서는 로그와 체크포인트 지연을 함께 확인하세요.</span>
        <button className="btn btn-sm" disabled>RPC 상태 보기</button>
      </div>
    );
  }
  if (variant === "backfill_stuck") {
    return (
      <div className="alert-banner err">
        <Icons.Alert />
        <span className="title">백필 작업 정체</span>
        <span className="desc">{MOCK.meta.opsMessage || "백필 작업이 실패 또는 수동 처리 상태입니다. 아래 작업 목록의 오류 메시지를 확인하세요."}</span>
        <button className="btn btn-sm" disabled>재처리 API 준비 중</button>
      </div>
    );
  }
  if (variant === "worker_attention") {
    return (
      <div className="alert-banner warn">
        <Icons.Alert />
        <span className="title">워커 확인 필요</span>
        <span className="desc">{MOCK.meta.opsMessage || "체크포인트가 없거나 오래되어 워커 실행 상태 확인이 필요합니다."}</span>
        <button className="btn btn-sm" disabled>로그 확인 필요</button>
      </div>
    );
  }
  return null;
}

function OpsAlertPills({ variant }) {
  const hasRealtimeCheckpoint = MOCK.sync.realtimeOn;
  const hasBackfillCheckpoint = MOCK.sync.backfillOn;
  return (
    <div className="ops-alerts-pills">
      <span className="ops-pill ok"><Icons.Dot/> API 서버 정상</span>
      <span className="ops-pill ok"><Icons.Dot/> DB 연결됨</span>
      <span className={`ops-pill ${variant === "rpc_lag" ? "warn" : "ok"}`}><Icons.Dot/> RPC 주 엔드포인트</span>
      <span className={`ops-pill ${variant === "backfill_stuck" ? "err" : hasBackfillCheckpoint ? "ok" : "warn"}`}><Icons.Dot/> 백필 체크포인트</span>
      <span className={`ops-pill ${hasRealtimeCheckpoint ? "ok" : "warn"}`}><Icons.Dot/> 실시간 체크포인트</span>
    </div>
  );
}

function BackfillForm({ onQueued }) {
  const latestBlock = MOCK.sync.latestBlock || 0;
  const [start, setStart] = React.useState("0");
  const [end, setEnd] = React.useState("0");
  const [dirty, setDirty] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [msg, setMsg] = React.useState(null);

  React.useEffect(() => {
    if (!dirty && latestBlock > 0) {
      setStart(String(Math.max(0, latestBlock - 100)));
      setEnd(String(latestBlock));
    }
  }, [dirty, latestBlock]);

  const s = parseInt(start, 10), e = parseInt(end, 10);
  const range = Number.isFinite(s) && Number.isFinite(e) ? e - s + 1 : 0;
  const tooBig = range > 1_000_000;
  const invalid = !start || !end || Number.isNaN(s) || Number.isNaN(e) || s > e;
  const setField = (setter) => (event) => {
    setDirty(true);
    setter(event.target.value);
  };

  const submit = async () => {
    if (invalid) { setMsg({ kind: "err", text: "시작 블록은 종료 블록보다 작거나 같아야 합니다." }); return; }
    if (tooBig) { setMsg({ kind: "warn", text: `${fmt.num(range)}개 블록 범위는 오래 걸릴 수 있습니다. 1,000,000개 이하로 나누는 것을 권장합니다.` }); return; }
    setSubmitting(true);
    setMsg(null);
    try {
      await window.postBackfill(s, e);
      setMsg({ kind: "ok", text: `백필 작업을 큐에 넣었습니다: ${fmt.num(s)} → ${fmt.num(e)} (${fmt.num(range)}개 블록).` });
      await onQueued?.();
    } catch (error) {
      setMsg({ kind: "err", text: error instanceof Error ? error.message : String(error) });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMsg(null), 6000);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">백필 실행</div>
          <div className="card-sub">누락 구간 복구, 재동기화, 리오그 후 재처리를 위해 블록 범위를 다시 읽습니다.</div>
        </div>
        <span className="muted" style={{fontSize: 11.5}} data-tip="백필 워커는 ENABLE_BACKFILL_WORKER=true로 켜야 합니다.">워커 필요 · 큐 등록</span>
      </div>
      <div className="card-body">
        <div className="backfill-form">
          <label className="input-label">
            <span>시작 블록</span>
            <input className="input mono" value={start} onChange={setField(setStart)} inputMode="numeric" />
            <span className="hint">포함</span>
          </label>
          <label className="input-label">
            <span>종료 블록</span>
            <input className="input mono" value={end} onChange={setField(setEnd)} inputMode="numeric" />
            <span className="hint">포함</span>
          </label>
          <label className="input-label">
            <span>범위</span>
            <div className="input mono" style={{display: "flex", alignItems: "center", color: invalid ? "var(--danger)" : tooBig ? "var(--warning)" : "var(--text-2)"}}>
              {invalid ? "—" : fmt.num(range)}
            </div>
            <span className="hint">블록</span>
          </label>
          <button className="btn btn-primary" onClick={submit} disabled={invalid || submitting}>
            <Icons.Play size={11}/> <span>{submitting ? "요청 중" : "백필 큐 등록"}</span>
          </button>
        </div>
        {msg && (
          <div className={`alert-banner ${msg.kind === "ok" ? "info" : msg.kind === "warn" ? "warn" : "err"}`} style={{marginTop: 14, marginBottom: 0}}>
            <Icons.Info />
            <span className="desc">{msg.text}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CheckpointsTable() {
  if (MOCK.checkpoints.length === 0) {
    return <div className="card"><EmptyState title="체크포인트가 없습니다" desc="워커가 블록을 처리하면 sync_checkpoints 테이블에 마지막 처리 블록과 상태가 저장됩니다." /></div>;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>워커</th>
            <th>마지막 블록</th>
            <th>마지막 해시</th>
            <th>상태</th>
            <th>갱신</th>
          </tr>
        </thead>
        <tbody>
          {MOCK.checkpoints.map(c => (
            <tr key={c.worker}>
              <td><span className="mono" style={{fontSize: 12}}>{c.worker}</span></td>
              <td className="td-num">{fmt.block(c.lastBlock)}</td>
              <td className="td-mono td-muted">{c.lastHash || "—"}</td>
              <td><StatusBadge status={c.status}/></td>
              <td className="td-muted">{c.updatedAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BackfillJobsTable() {
  const sort = useSort("id", "desc");
  const rows = [...MOCK.backfillJobs].sort((a, b) => {
    const g = (x) => sort.key === "id" ? x.id : sort.key === "range" ? x.range[0] : 0;
    const [A, B] = [g(a), g(b)];
    return sort.dir === "asc" ? A - B : B - A;
  });
  if (rows.length === 0) {
    return <div className="card"><EmptyState title="백필 작업이 없습니다" desc="위 폼에서 백필 범위를 큐에 넣으면 작업 목록에 표시됩니다." /></div>;
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <SortHeader label="작업" k="id" sort={sort}/>
            <SortHeader label="범위" k="range" sort={sort}/>
            <th>상태</th>
            <th>재시도</th>
            <th>시작</th>
            <th>소요 시간</th>
            <th>오류</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(j => (
            <tr key={j.id}>
              <td className="td-mono">#{j.id}</td>
              <td className="td-mono">{fmt.num(j.range[0])} → {fmt.num(j.range[1])}</td>
              <td><StatusBadge status={j.status}/></td>
              <td className={j.retry > 0 ? "td-num" : "td-num td-muted"} style={j.retry > 0 ? {color: "var(--warning)"} : {}}>{j.retry}</td>
              <td className="td-muted">{j.startedAt}</td>
              <td className="td-muted">{j.duration}</td>
              <td className="td-muted" style={{maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: j.error ? "var(--danger)" : "var(--text-4)"}}>{j.error || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageOperations({ alertStyle, alertVariant, onRefresh }) {
  const kpis = [
    { label: "최신 인덱싱 블록", value: fmt.num(MOCK.sync.latestBlock), tip: "인덱서가 DB에 커밋한 가장 높은 블록" },
    { label: "RPC 기준 블록", value: MOCK.sync.rpcLatest ? fmt.num(MOCK.sync.rpcLatest) : "—", tip: "현재 UI API가 제공하는 RPC head 값" },
    { label: "지연", value: `${fmt.num(MOCK.sync.lag)} 블록`, tip: "RPC head와 인덱싱 블록의 차이" },
    { label: "체크포인트 갱신", value: MOCK.sync.lastCheckpointAgo || "없음", tip: "가장 최근 체크포인트 갱신 시점" },
    { label: "Finality 지연", value: `${MOCK.settings.finalityLag} 블록`, tip: "후보 증거를 확정하기 전 기다리는 블록 수" },
    { label: "최대 리오그 깊이", value: MOCK.settings.maxReorgDepth, tip: "리오그 감지/복구 확인 범위" },
  ];
  return (
    <div className="page operations-page" style={alertStyle === "sidebar" ? {display: "grid", gridTemplateColumns: "1fr 260px", gap: 20, maxWidth: 1440} : {}}>
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">운영</h1>
            <div className="page-sub">인덱서 상태, 체크포인트, 백필 큐를 확인합니다. 데이터가 안 보일 때 원인을 찾는 기준 화면입니다.</div>
          </div>
          <div className="hstack">
            {alertStyle === "pills" && <OpsAlertPills variant={alertVariant}/>}
          </div>
        </div>

        {alertStyle === "banner" && <OpsAlertBanner variant={alertVariant}/>}

        <div className="kpi-row">
          {kpis.map(k => (
            <div key={k.label} className="kpi-cell" data-tip={k.tip}>
              <span className="label">{k.label}</span>
              <span className="val mono">{k.value}</span>
            </div>
          ))}
        </div>

        <div className="sec-title">워커 체크포인트</div>
        <CheckpointsTable />

        <div className="sec-title">백필</div>
        <div style={{marginBottom: 14}}><BackfillForm onQueued={onRefresh}/></div>
        <BackfillJobsTable />

        <div className="sec-title">최근 인덱싱 활동</div>
        <div className="card">
          <div className="card-body" style={{paddingBottom: 6}}>
            <LineChart data={MOCK.daily} accessor={d => d.payments} color="var(--chart-1)" width={1100} height={140} />
            <div className="muted" style={{fontSize: 11.5, marginTop: 6}}>
              일별 감지된 결제 수입니다. 비어 있는 구간은 x402 활동이 없었거나 아직 백필되지 않은 구간일 수 있으므로 체크포인트와 함께 확인하세요.
            </div>
          </div>
        </div>
      </div>

      {alertStyle === "sidebar" && (
        <aside className="ops-side" style={{position: "sticky", top: 20, alignSelf: "start"}}>
          <div className="card">
            <div className="card-header">
              <div className="card-title">상태</div>
            </div>
            <div className="card-body" style={{padding: 12}}>
              <div className="vstack" style={{gap: 6}}>
                <div className="small-check"><span className="on"><Icons.Check size={12}/></span> API 서버</div>
                <div className="small-check"><span className="on"><Icons.Check size={12}/></span> 데이터베이스</div>
                <div className="small-check"><span className={alertVariant === "rpc_lag" ? "off" : "on"}>{alertVariant === "rpc_lag" ? <Icons.Alert size={12}/> : <Icons.Check size={12}/>}</span> 주 RPC</div>
                <div className="small-check"><span className={alertVariant === "backfill_stuck" ? "off" : MOCK.sync.backfillOn ? "on" : "off"}>{alertVariant === "backfill_stuck" ? <Icons.X size={12}/> : MOCK.sync.backfillOn ? <Icons.Check size={12}/> : <Icons.Alert size={12}/>}</span> 백필 체크포인트</div>
                <div className="small-check"><span className={MOCK.sync.realtimeOn ? "on" : "off"}>{MOCK.sync.realtimeOn ? <Icons.Check size={12}/> : <Icons.Alert size={12}/>}</span> 실시간 체크포인트</div>
              </div>
              <div className="divider"/>
              <div className="kv"><span className="k">RPC 호스트</span><span className="v mono" style={{fontSize: 11.5}}>{MOCK.settings.rpcHost}</span></div>
              <div className="kv"><span className="k">보조 RPC</span><span className="v tnum">{MOCK.settings.fallbackRpcCount}</span></div>
              <div className="kv"><span className="k">지연</span><span className="v tnum">{fmt.num(MOCK.sync.lag)} 블록</span></div>
            </div>
          </div>
          {(alertVariant !== "healthy") && (
            <div style={{marginTop: 12}}>
              <OpsAlertBanner variant={alertVariant}/>
            </div>
          )}
        </aside>
      )}
    </div>
  );
}

Object.assign(window, { PageOperations });
