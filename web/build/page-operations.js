// 운영 페이지 — 체크포인트, 백필 작업, 워커 상태를 확인하고 백필을 큐에 넣는다.

function OpsAlertBanner({
  variant
}) {
  if (variant === "healthy") return null;
  if (variant === "rpc_lag") {
    return /*#__PURE__*/React.createElement("div", {
      className: "alert-banner warn"
    }, /*#__PURE__*/React.createElement(Icons.Alert, null), /*#__PURE__*/React.createElement("span", {
      className: "title"
    }, "RPC \uC751\uB2F5 \uC9C0\uC5F0"), /*#__PURE__*/React.createElement("span", {
      className: "desc"
    }, "\uC8FC RPC\uAC00 \uB290\uB9AC\uAC70\uB098 \uC81C\uD55C\uB420 \uB54C\uB294 \uBCF4\uC870 RPC\uB85C \uC804\uD658\uD574\uC57C \uD569\uB2C8\uB2E4. \uC2E4\uC81C \uC6B4\uC601\uC5D0\uC11C\uB294 \uB85C\uADF8\uC640 \uCCB4\uD06C\uD3EC\uC778\uD2B8 \uC9C0\uC5F0\uC744 \uD568\uAED8 \uD655\uC778\uD558\uC138\uC694."), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-sm",
      disabled: true
    }, "RPC \uC0C1\uD0DC \uBCF4\uAE30"));
  }
  if (variant === "backfill_stuck") {
    return /*#__PURE__*/React.createElement("div", {
      className: "alert-banner err"
    }, /*#__PURE__*/React.createElement(Icons.Alert, null), /*#__PURE__*/React.createElement("span", {
      className: "title"
    }, "\uBC31\uD544 \uC791\uC5C5 \uC815\uCCB4"), /*#__PURE__*/React.createElement("span", {
      className: "desc"
    }, MOCK.meta.opsMessage || "백필 작업이 실패 또는 수동 처리 상태입니다. 아래 작업 목록의 오류 메시지를 확인하세요."), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-sm",
      disabled: true
    }, "\uC7AC\uCC98\uB9AC API \uC900\uBE44 \uC911"));
  }
  if (variant === "worker_attention") {
    return /*#__PURE__*/React.createElement("div", {
      className: "alert-banner warn"
    }, /*#__PURE__*/React.createElement(Icons.Alert, null), /*#__PURE__*/React.createElement("span", {
      className: "title"
    }, "\uC6CC\uCEE4 \uD655\uC778 \uD544\uC694"), /*#__PURE__*/React.createElement("span", {
      className: "desc"
    }, MOCK.meta.opsMessage || "체크포인트가 없거나 오래되어 워커 실행 상태 확인이 필요합니다."), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-sm",
      disabled: true
    }, "\uB85C\uADF8 \uD655\uC778 \uD544\uC694"));
  }
  return null;
}
function OpsAlertPills({
  variant
}) {
  const hasRealtimeCheckpoint = MOCK.sync.realtimeOn;
  const hasBackfillCheckpoint = MOCK.sync.backfillOn;
  return /*#__PURE__*/React.createElement("div", {
    className: "ops-alerts-pills"
  }, /*#__PURE__*/React.createElement("span", {
    className: "ops-pill ok"
  }, /*#__PURE__*/React.createElement(Icons.Dot, null), " API \uC11C\uBC84 \uC815\uC0C1"), /*#__PURE__*/React.createElement("span", {
    className: "ops-pill ok"
  }, /*#__PURE__*/React.createElement(Icons.Dot, null), " DB \uC5F0\uACB0\uB428"), /*#__PURE__*/React.createElement("span", {
    className: `ops-pill ${variant === "rpc_lag" ? "warn" : "ok"}`
  }, /*#__PURE__*/React.createElement(Icons.Dot, null), " RPC \uC8FC \uC5D4\uB4DC\uD3EC\uC778\uD2B8"), /*#__PURE__*/React.createElement("span", {
    className: `ops-pill ${variant === "backfill_stuck" ? "err" : hasBackfillCheckpoint ? "ok" : "warn"}`
  }, /*#__PURE__*/React.createElement(Icons.Dot, null), " \uBC31\uD544 \uCCB4\uD06C\uD3EC\uC778\uD2B8"), /*#__PURE__*/React.createElement("span", {
    className: `ops-pill ${hasRealtimeCheckpoint ? "ok" : "warn"}`
  }, /*#__PURE__*/React.createElement(Icons.Dot, null), " \uC2E4\uC2DC\uAC04 \uCCB4\uD06C\uD3EC\uC778\uD2B8"));
}
function BackfillForm({
  onQueued
}) {
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
  const s = parseInt(start, 10),
    e = parseInt(end, 10);
  const range = Number.isFinite(s) && Number.isFinite(e) ? e - s + 1 : 0;
  const tooBig = range > 1_000_000;
  const invalid = !start || !end || Number.isNaN(s) || Number.isNaN(e) || s > e;
  const setField = setter => event => {
    setDirty(true);
    setter(event.target.value);
  };
  const submit = async () => {
    if (invalid) {
      setMsg({
        kind: "err",
        text: "시작 블록은 종료 블록보다 작거나 같아야 합니다."
      });
      return;
    }
    if (tooBig) {
      setMsg({
        kind: "warn",
        text: `${fmt.num(range)}개 블록 범위는 오래 걸릴 수 있습니다. 1,000,000개 이하로 나누는 것을 권장합니다.`
      });
      return;
    }
    setSubmitting(true);
    setMsg(null);
    try {
      await window.postBackfill(s, e);
      setMsg({
        kind: "ok",
        text: `백필 작업을 큐에 넣었습니다: ${fmt.num(s)} → ${fmt.num(e)} (${fmt.num(range)}개 블록).`
      });
      await onQueued?.();
    } catch (error) {
      setMsg({
        kind: "err",
        text: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setSubmitting(false);
      setTimeout(() => setMsg(null), 6000);
    }
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uBC31\uD544 \uC2E4\uD589"), /*#__PURE__*/React.createElement("div", {
    className: "card-sub"
  }, "\uB204\uB77D \uAD6C\uAC04 \uBCF5\uAD6C, \uC7AC\uB3D9\uAE30\uD654, \uB9AC\uC624\uADF8 \uD6C4 \uC7AC\uCC98\uB9AC\uB97C \uC704\uD574 \uBE14\uB85D \uBC94\uC704\uB97C \uB2E4\uC2DC \uC77D\uC2B5\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11.5
    },
    "data-tip": "\uBC31\uD544 \uC6CC\uCEE4\uB294 ENABLE_BACKFILL_WORKER=true\uB85C \uCF1C\uC57C \uD569\uB2C8\uB2E4."
  }, "\uC6CC\uCEE4 \uD544\uC694 \xB7 \uD050 \uB4F1\uB85D")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "backfill-form"
  }, /*#__PURE__*/React.createElement("label", {
    className: "input-label"
  }, /*#__PURE__*/React.createElement("span", null, "\uC2DC\uC791 \uBE14\uB85D"), /*#__PURE__*/React.createElement("input", {
    className: "input mono",
    value: start,
    onChange: setField(setStart),
    inputMode: "numeric"
  }), /*#__PURE__*/React.createElement("span", {
    className: "hint"
  }, "\uD3EC\uD568")), /*#__PURE__*/React.createElement("label", {
    className: "input-label"
  }, /*#__PURE__*/React.createElement("span", null, "\uC885\uB8CC \uBE14\uB85D"), /*#__PURE__*/React.createElement("input", {
    className: "input mono",
    value: end,
    onChange: setField(setEnd),
    inputMode: "numeric"
  }), /*#__PURE__*/React.createElement("span", {
    className: "hint"
  }, "\uD3EC\uD568")), /*#__PURE__*/React.createElement("label", {
    className: "input-label"
  }, /*#__PURE__*/React.createElement("span", null, "\uBC94\uC704"), /*#__PURE__*/React.createElement("div", {
    className: "input mono",
    style: {
      display: "flex",
      alignItems: "center",
      color: invalid ? "var(--danger)" : tooBig ? "var(--warning)" : "var(--text-2)"
    }
  }, invalid ? "—" : fmt.num(range)), /*#__PURE__*/React.createElement("span", {
    className: "hint"
  }, "\uBE14\uB85D")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: submit,
    disabled: invalid || submitting
  }, /*#__PURE__*/React.createElement(Icons.Play, {
    size: 11
  }), " ", /*#__PURE__*/React.createElement("span", null, submitting ? "요청 중" : "백필 큐 등록"))), msg && /*#__PURE__*/React.createElement("div", {
    className: `alert-banner ${msg.kind === "ok" ? "info" : msg.kind === "warn" ? "warn" : "err"}`,
    style: {
      marginTop: 14,
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement(Icons.Info, null), /*#__PURE__*/React.createElement("span", {
    className: "desc"
  }, msg.text))));
}
function CheckpointsTable() {
  if (MOCK.checkpoints.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement(EmptyState, {
      title: "\uCCB4\uD06C\uD3EC\uC778\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
      desc: "\uC6CC\uCEE4\uAC00 \uBE14\uB85D\uC744 \uCC98\uB9AC\uD558\uBA74 sync_checkpoints \uD14C\uC774\uBE14\uC5D0 \uB9C8\uC9C0\uB9C9 \uCC98\uB9AC \uBE14\uB85D\uACFC \uC0C1\uD0DC\uAC00 \uC800\uC7A5\uB429\uB2C8\uB2E4."
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\uC6CC\uCEE4"), /*#__PURE__*/React.createElement("th", null, "\uB9C8\uC9C0\uB9C9 \uBE14\uB85D"), /*#__PURE__*/React.createElement("th", null, "\uB9C8\uC9C0\uB9C9 \uD574\uC2DC"), /*#__PURE__*/React.createElement("th", null, "\uC0C1\uD0DC"), /*#__PURE__*/React.createElement("th", null, "\uAC31\uC2E0"))), /*#__PURE__*/React.createElement("tbody", null, MOCK.checkpoints.map(c => /*#__PURE__*/React.createElement("tr", {
    key: c.worker
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      fontSize: 12
    }
  }, c.worker)), /*#__PURE__*/React.createElement("td", {
    className: "td-num"
  }, fmt.block(c.lastBlock)), /*#__PURE__*/React.createElement("td", {
    className: "td-mono td-muted"
  }, c.lastHash || "—"), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(StatusBadge, {
    status: c.status
  })), /*#__PURE__*/React.createElement("td", {
    className: "td-muted"
  }, c.updatedAt))))));
}
function BackfillJobsTable() {
  const sort = useSort("id", "desc");
  const rows = [...MOCK.backfillJobs].sort((a, b) => {
    const g = x => sort.key === "id" ? x.id : sort.key === "range" ? x.range[0] : 0;
    const [A, B] = [g(a), g(b)];
    return sort.dir === "asc" ? A - B : B - A;
  });
  if (rows.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement(EmptyState, {
      title: "\uBC31\uD544 \uC791\uC5C5\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
      desc: "\uC704 \uD3FC\uC5D0\uC11C \uBC31\uD544 \uBC94\uC704\uB97C \uD050\uC5D0 \uB123\uC73C\uBA74 \uC791\uC5C5 \uBAA9\uB85D\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
    }));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement(SortHeader, {
    label: "\uC791\uC5C5",
    k: "id",
    sort: sort
  }), /*#__PURE__*/React.createElement(SortHeader, {
    label: "\uBC94\uC704",
    k: "range",
    sort: sort
  }), /*#__PURE__*/React.createElement("th", null, "\uC0C1\uD0DC"), /*#__PURE__*/React.createElement("th", null, "\uC7AC\uC2DC\uB3C4"), /*#__PURE__*/React.createElement("th", null, "\uC2DC\uC791"), /*#__PURE__*/React.createElement("th", null, "\uC18C\uC694 \uC2DC\uAC04"), /*#__PURE__*/React.createElement("th", null, "\uC624\uB958"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(j => /*#__PURE__*/React.createElement("tr", {
    key: j.id
  }, /*#__PURE__*/React.createElement("td", {
    className: "td-mono"
  }, "#", j.id), /*#__PURE__*/React.createElement("td", {
    className: "td-mono"
  }, fmt.num(j.range[0]), " \u2192 ", fmt.num(j.range[1])), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(StatusBadge, {
    status: j.status
  })), /*#__PURE__*/React.createElement("td", {
    className: j.retry > 0 ? "td-num" : "td-num td-muted",
    style: j.retry > 0 ? {
      color: "var(--warning)"
    } : {}
  }, j.retry), /*#__PURE__*/React.createElement("td", {
    className: "td-muted"
  }, j.startedAt), /*#__PURE__*/React.createElement("td", {
    className: "td-muted"
  }, j.duration), /*#__PURE__*/React.createElement("td", {
    className: "td-muted",
    style: {
      maxWidth: 260,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: j.error ? "var(--danger)" : "var(--text-4)"
    }
  }, j.error || "—"))))));
}
function PageOperations({
  alertStyle,
  alertVariant,
  onRefresh
}) {
  const kpis = [{
    label: "최신 인덱싱 블록",
    value: fmt.num(MOCK.sync.latestBlock),
    tip: "인덱서가 DB에 커밋한 가장 높은 블록"
  }, {
    label: "RPC 기준 블록",
    value: MOCK.sync.rpcLatest ? fmt.num(MOCK.sync.rpcLatest) : "—",
    tip: "현재 UI API가 제공하는 RPC head 값"
  }, {
    label: "지연",
    value: `${fmt.num(MOCK.sync.lag)} 블록`,
    tip: "RPC head와 인덱싱 블록의 차이"
  }, {
    label: "체크포인트 갱신",
    value: MOCK.sync.lastCheckpointAgo || "없음",
    tip: "가장 최근 체크포인트 갱신 시점"
  }, {
    label: "Finality 지연",
    value: `${MOCK.settings.finalityLag} 블록`,
    tip: "후보 증거를 확정하기 전 기다리는 블록 수"
  }, {
    label: "최대 리오그 깊이",
    value: MOCK.settings.maxReorgDepth,
    tip: "리오그 감지/복구 확인 범위"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "page operations-page",
    style: alertStyle === "sidebar" ? {
      display: "grid",
      gridTemplateColumns: "1fr 260px",
      gap: 20,
      maxWidth: 1440
    } : {}
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\uC6B4\uC601"), /*#__PURE__*/React.createElement("div", {
    className: "page-sub"
  }, "\uC778\uB371\uC11C \uC0C1\uD0DC, \uCCB4\uD06C\uD3EC\uC778\uD2B8, \uBC31\uD544 \uD050\uB97C \uD655\uC778\uD569\uB2C8\uB2E4. \uB370\uC774\uD130\uAC00 \uC548 \uBCF4\uC77C \uB54C \uC6D0\uC778\uC744 \uCC3E\uB294 \uAE30\uC900 \uD654\uBA74\uC785\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("div", {
    className: "hstack"
  }, alertStyle === "pills" && /*#__PURE__*/React.createElement(OpsAlertPills, {
    variant: alertVariant
  }))), alertStyle === "banner" && /*#__PURE__*/React.createElement(OpsAlertBanner, {
    variant: alertVariant
  }), /*#__PURE__*/React.createElement("div", {
    className: "kpi-row"
  }, kpis.map(k => /*#__PURE__*/React.createElement("div", {
    key: k.label,
    className: "kpi-cell",
    "data-tip": k.tip
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, k.label), /*#__PURE__*/React.createElement("span", {
    className: "val mono"
  }, k.value)))), /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "\uC6CC\uCEE4 \uCCB4\uD06C\uD3EC\uC778\uD2B8"), /*#__PURE__*/React.createElement(CheckpointsTable, null), /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "\uBC31\uD544"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(BackfillForm, {
    onQueued: onRefresh
  })), /*#__PURE__*/React.createElement(BackfillJobsTable, null), /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "\uCD5C\uADFC \uC778\uB371\uC2F1 \uD65C\uB3D9"), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body",
    style: {
      paddingBottom: 6
    }
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: MOCK.daily,
    accessor: d => d.payments,
    color: "var(--chart-1)",
    width: 1100,
    height: 140
  }), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5,
      marginTop: 6
    }
  }, "\uC77C\uBCC4 \uAC10\uC9C0\uB41C \uACB0\uC81C \uC218\uC785\uB2C8\uB2E4. \uBE44\uC5B4 \uC788\uB294 \uAD6C\uAC04\uC740 x402 \uD65C\uB3D9\uC774 \uC5C6\uC5C8\uAC70\uB098 \uC544\uC9C1 \uBC31\uD544\uB418\uC9C0 \uC54A\uC740 \uAD6C\uAC04\uC77C \uC218 \uC788\uC73C\uBBC0\uB85C \uCCB4\uD06C\uD3EC\uC778\uD2B8\uC640 \uD568\uAED8 \uD655\uC778\uD558\uC138\uC694.")))), alertStyle === "sidebar" && /*#__PURE__*/React.createElement("aside", {
    className: "ops-side",
    style: {
      position: "sticky",
      top: 20,
      alignSelf: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uC0C1\uD0DC")), /*#__PURE__*/React.createElement("div", {
    className: "card-body",
    style: {
      padding: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "vstack",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "small-check"
  }, /*#__PURE__*/React.createElement("span", {
    className: "on"
  }, /*#__PURE__*/React.createElement(Icons.Check, {
    size: 12
  })), " API \uC11C\uBC84"), /*#__PURE__*/React.createElement("div", {
    className: "small-check"
  }, /*#__PURE__*/React.createElement("span", {
    className: "on"
  }, /*#__PURE__*/React.createElement(Icons.Check, {
    size: 12
  })), " \uB370\uC774\uD130\uBCA0\uC774\uC2A4"), /*#__PURE__*/React.createElement("div", {
    className: "small-check"
  }, /*#__PURE__*/React.createElement("span", {
    className: alertVariant === "rpc_lag" ? "off" : "on"
  }, alertVariant === "rpc_lag" ? /*#__PURE__*/React.createElement(Icons.Alert, {
    size: 12
  }) : /*#__PURE__*/React.createElement(Icons.Check, {
    size: 12
  })), " \uC8FC RPC"), /*#__PURE__*/React.createElement("div", {
    className: "small-check"
  }, /*#__PURE__*/React.createElement("span", {
    className: alertVariant === "backfill_stuck" ? "off" : MOCK.sync.backfillOn ? "on" : "off"
  }, alertVariant === "backfill_stuck" ? /*#__PURE__*/React.createElement(Icons.X, {
    size: 12
  }) : MOCK.sync.backfillOn ? /*#__PURE__*/React.createElement(Icons.Check, {
    size: 12
  }) : /*#__PURE__*/React.createElement(Icons.Alert, {
    size: 12
  })), " \uBC31\uD544 \uCCB4\uD06C\uD3EC\uC778\uD2B8"), /*#__PURE__*/React.createElement("div", {
    className: "small-check"
  }, /*#__PURE__*/React.createElement("span", {
    className: MOCK.sync.realtimeOn ? "on" : "off"
  }, MOCK.sync.realtimeOn ? /*#__PURE__*/React.createElement(Icons.Check, {
    size: 12
  }) : /*#__PURE__*/React.createElement(Icons.Alert, {
    size: 12
  })), " \uC2E4\uC2DC\uAC04 \uCCB4\uD06C\uD3EC\uC778\uD2B8")), /*#__PURE__*/React.createElement("div", {
    className: "divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "RPC \uD638\uC2A4\uD2B8"), /*#__PURE__*/React.createElement("span", {
    className: "v mono",
    style: {
      fontSize: 11.5
    }
  }, MOCK.settings.rpcHost)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uBCF4\uC870 RPC"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, MOCK.settings.fallbackRpcCount)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uC9C0\uC5F0"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, fmt.num(MOCK.sync.lag), " \uBE14\uB85D")))), alertVariant !== "healthy" && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(OpsAlertBanner, {
    variant: alertVariant
  }))));
}
Object.assign(window, {
  PageOperations
});
