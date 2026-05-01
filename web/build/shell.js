// App shell + routing + screens

const PAGES = [{
  id: "dashboard",
  label: "대시보드",
  icon: Icons.NavDash,
  count: null
}, {
  id: "payments",
  label: "결제",
  icon: Icons.NavPay,
  count: null
}, {
  id: "agents",
  label: "에이전트",
  icon: Icons.NavAgent,
  count: null
}, {
  id: "services",
  label: "서비스",
  icon: Icons.NavService,
  count: null
}, {
  id: "interactions",
  label: "상호작용",
  icon: Icons.NavInter,
  count: null
}, {
  id: "evidence",
  label: "판별 증거",
  icon: Icons.NavEv,
  count: null
}, {
  id: "operations",
  label: "운영",
  icon: Icons.NavOps,
  count: null
}];
const SETTINGS_PAGES = [{
  id: "settings",
  label: "설정",
  icon: Icons.NavSet,
  count: null
}, {
  id: "docs",
  label: "문서",
  icon: Icons.NavDocs,
  count: null
}];
function Sidebar({
  page,
  setPage,
  opsHealth
}) {
  const item = p => /*#__PURE__*/React.createElement("button", {
    key: p.id,
    type: "button",
    className: `nav-item ${page === p.id ? "active" : ""}`,
    onClick: () => setPage(p.id),
    "aria-current": page === p.id ? "page" : undefined
  }, /*#__PURE__*/React.createElement(p.icon, null), " ", /*#__PURE__*/React.createElement("span", null, p.label), p.id === "payments" && /*#__PURE__*/React.createElement("span", {
    className: "nav-count"
  }, MOCK.overview.payments_count), p.id === "agents" && /*#__PURE__*/React.createElement("span", {
    className: "nav-count"
  }, MOCK.overview.agents_count), p.id === "services" && /*#__PURE__*/React.createElement("span", {
    className: "nav-count"
  }, MOCK.overview.services_count), p.id === "interactions" && /*#__PURE__*/React.createElement("span", {
    className: "nav-count"
  }, MOCK.interactions.length), p.id === "evidence" && /*#__PURE__*/React.createElement("span", {
    className: "nav-count"
  }, MOCK.overview.evidence_count));
  const healthDot = opsHealth === "healthy" ? "" : opsHealth === "backfill_stuck" ? "err" : "warn";
  const realtimeDot = MOCK.sync.realtimeOn ? healthDot : "warn";
  const backfillDot = opsHealth === "backfill_stuck" ? "err" : MOCK.sync.backfillOn ? "" : "warn";
  return /*#__PURE__*/React.createElement("aside", {
    className: "sidebar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sidebar-brand"
  }, /*#__PURE__*/React.createElement("div", {
    className: "brand-mark"
  }, "4"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "brand-title"
  }, "x402 \uC778\uB371\uC11C"), /*#__PURE__*/React.createElement("div", {
    className: "brand-sub"
  }, "Base \uBA54\uC778\uB137 \xB7 8453"))), /*#__PURE__*/React.createElement("nav", {
    className: "nav-section"
  }, PAGES.map(item)), /*#__PURE__*/React.createElement("div", {
    className: "nav-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "nav-label"
  }, "\uC2DC\uC2A4\uD15C"), SETTINGS_PAGES.map(item)), /*#__PURE__*/React.createElement("div", {
    className: "sidebar-footer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "status-line"
  }, /*#__PURE__*/React.createElement("span", {
    className: `status-dot ${realtimeDot}`
  }), /*#__PURE__*/React.createElement("span", null, "\uC2E4\uC2DC\uAC04 \uC6CC\uCEE4")), /*#__PURE__*/React.createElement("div", {
    className: "status-line"
  }, /*#__PURE__*/React.createElement("span", {
    className: `status-dot ${backfillDot}`
  }), /*#__PURE__*/React.createElement("span", null, "\uBC31\uD544 \uC6CC\uCEE4")), /*#__PURE__*/React.createElement("div", {
    className: "status-line"
  }, /*#__PURE__*/React.createElement("span", {
    className: "status-dot"
  }), /*#__PURE__*/React.createElement("span", null, "Redis \uC5F0\uACB0")), /*#__PURE__*/React.createElement("div", {
    className: "status-line muted",
    style: {
      marginTop: 6,
      fontSize: 11,
      color: "var(--text-3)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "#", fmt.num(MOCK.overview.latest_indexed_block)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, "v0.4.2"))));
}
function TopBar({
  page,
  crumb,
  onNav,
  onRefresh,
  loading
}) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const detect = s => {
    const v = s.trim();
    if (!v) return null;
    if (/^0x[0-9a-fA-F]{64}$/.test(v)) return {
      type: "트랜잭션",
      go: "payments",
      note: "결제 목록에서 확인"
    };
    if (/^0x[0-9a-fA-F]{40}$/.test(v)) return {
      type: "주소",
      go: "agents",
      note: "에이전트/서비스 상세 확인"
    };
    if (/^0x[0-9a-fA-F]{8}$/.test(v)) return {
      type: "셀렉터",
      go: "interactions",
      note: "상호작용에서 확인"
    };
    if (/^\d+$/.test(v)) return {
      type: "블록",
      go: "operations",
      note: `블록 #${fmt.num(parseInt(v))} 운영 상태 확인`
    };
    return {
      type: "알 수 없음",
      go: null,
      note: "일치하는 형식이 없습니다"
    };
  };
  const hit = detect(q);
  return /*#__PURE__*/React.createElement("header", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "crumb"
  }, /*#__PURE__*/React.createElement("span", null, "x402"), /*#__PURE__*/React.createElement("span", {
    className: "crumb-sep"
  }, "/"), /*#__PURE__*/React.createElement("span", {
    className: "crumb-current"
  }, crumb || PAGES.find(p => p.id === page)?.label || "대시보드")), /*#__PURE__*/React.createElement("div", {
    className: "search"
  }, /*#__PURE__*/React.createElement("span", {
    className: "search-icon"
  }, /*#__PURE__*/React.createElement(Icons.Search, null)), /*#__PURE__*/React.createElement("input", {
    className: "search-input",
    placeholder: "\uD2B8\uB79C\uC7AD\uC158, \uC8FC\uC18C, \uBE14\uB85D, \uD568\uC218 \uC140\uB809\uD130 \uAC80\uC0C9\u2026",
    value: q,
    onChange: e => setQ(e.target.value),
    onFocus: () => setOpen(true),
    onBlur: () => setTimeout(() => setOpen(false), 150),
    onKeyDown: e => {
      if (e.key === "Enter" && hit?.go) {
        onNav(hit.go);
        setOpen(false);
        setQ("");
      }
    },
    "aria-label": "\uC804\uCCB4 \uAC80\uC0C9"
  }), !q && /*#__PURE__*/React.createElement("span", {
    className: "search-kbd"
  }, "\u2318K"), open && q && /*#__PURE__*/React.createElement("div", {
    className: "search-results"
  }, hit ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "search-result",
    onMouseDown: () => {
      if (hit.go) onNav(hit.go);
      setOpen(false);
      setQ("");
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "type-tag"
  }, hit.type), /*#__PURE__*/React.createElement("span", {
    className: "mono",
    style: {
      color: "var(--text-2)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, q), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      color: "var(--text-3)",
      fontSize: 11.5
    }
  }, hit.note)), /*#__PURE__*/React.createElement("div", {
    className: "search-hint"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "Enter"), "\uB85C \uC774\uB3D9")) : /*#__PURE__*/React.createElement("div", {
    className: "search-hint"
  }, "\uC8FC\uC18C, \uD2B8\uB79C\uC7AD\uC158 \uD574\uC2DC, \uBE14\uB85D \uBC88\uD638, \uD568\uC218 \uC140\uB809\uD130\uB97C \uC785\uB825\uD558\uC138\uC694."))), /*#__PURE__*/React.createElement("div", {
    className: "topbar-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-ghost",
    "aria-label": "\uC0C8\uB85C\uACE0\uCE68",
    onClick: onRefresh,
    disabled: loading
  }, /*#__PURE__*/React.createElement(Icons.Refresh, {
    size: 13
  }), " ", /*#__PURE__*/React.createElement("span", null, loading ? "불러오는 중" : "새로고침")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-ghost",
    "aria-label": "\uB0B4\uBCF4\uB0B4\uAE30",
    disabled: true,
    "data-tip": "\uB0B4\uBCF4\uB0B4\uAE30 API\uB294 \uC544\uC9C1 \uC5F0\uACB0\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
  }, /*#__PURE__*/React.createElement(Icons.Download, {
    size: 13
  }), " ", /*#__PURE__*/React.createElement("span", null, "\uB0B4\uBCF4\uB0B4\uAE30"))));
}
Object.assign(window, {
  PAGES,
  Sidebar,
  TopBar
});
