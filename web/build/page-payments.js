// 결제 페이지 — API에서 받은 payment 목록과 상세 증거/트랜잭션 원문을 보여준다.

function FilterBar({
  filters,
  setFilters
}) {
  const set = (k, v) => setFilters({
    ...filters,
    [k]: v
  });
  const reset = () => setFilters({
    payer: "",
    payTo: "",
    minUsd: "",
    maxUsd: "",
    from: "",
    to: ""
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "filter-bar"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: "var(--text-3)",
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icons.Filter, {
    size: 12
  }), " \uD544\uD130"), /*#__PURE__*/React.createElement("input", {
    className: "input mono",
    placeholder: "\uC9C0\uBD88\uC790 0x\u2026",
    value: filters.payer,
    onChange: e => set("payer", e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    className: "input mono",
    placeholder: "\uC218\uC2E0\uCC98 0x\u2026",
    value: filters.payTo,
    onChange: e => set("payTo", e.target.value)
  }), /*#__PURE__*/React.createElement("input", {
    className: "input",
    type: "number",
    placeholder: "\uCD5C\uC18C USD",
    value: filters.minUsd,
    onChange: e => set("minUsd", e.target.value),
    style: {
      minWidth: 100
    }
  }), /*#__PURE__*/React.createElement("input", {
    className: "input",
    type: "number",
    placeholder: "\uCD5C\uB300 USD",
    value: filters.maxUsd,
    onChange: e => set("maxUsd", e.target.value),
    style: {
      minWidth: 100
    }
  }), /*#__PURE__*/React.createElement("input", {
    className: "input",
    type: "date",
    value: filters.from,
    onChange: e => set("from", e.target.value),
    style: {
      minWidth: 130
    },
    "aria-label": "\uC2DC\uC791\uC77C"
  }), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11
    }
  }, "\u2192"), /*#__PURE__*/React.createElement("input", {
    className: "input",
    type: "date",
    value: filters.to,
    onChange: e => set("to", e.target.value),
    style: {
      minWidth: 130
    },
    "aria-label": "\uC885\uB8CC\uC77C"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto"
    },
    className: "hstack"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-ghost",
    onClick: reset
  }, "\uCD08\uAE30\uD654"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    disabled: true,
    "data-tip": "CSV \uB0B4\uBCF4\uB0B4\uAE30\uB294 \uB2E4\uC74C \uB2E8\uACC4 API\uC5D0\uC11C \uC5F0\uACB0\uD560 \uC608\uC815\uC785\uB2C8\uB2E4."
  }, /*#__PURE__*/React.createElement(Icons.Download, {
    size: 12
  }), " ", /*#__PURE__*/React.createElement("span", null, "CSV"))));
}
function PaymentDetailBody({
  p,
  loading,
  error
}) {
  const gasPrice = Number(p.gasPriceGwei || 0).toLocaleString('ko-KR', {
    maximumFractionDigits: 9
  });
  return /*#__PURE__*/React.createElement(React.Fragment, null, loading && /*#__PURE__*/React.createElement("div", {
    className: "alert-banner info"
  }, /*#__PURE__*/React.createElement(Icons.Info, null), /*#__PURE__*/React.createElement("span", {
    className: "desc"
  }, "\uACB0\uC81C \uC0C1\uC138 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.")), error && /*#__PURE__*/React.createElement("div", {
    className: "alert-banner warn"
  }, /*#__PURE__*/React.createElement(Icons.Alert, null), /*#__PURE__*/React.createElement("span", {
    className: "desc"
  }, "\uC0C1\uC138 \uC870\uD68C\uC5D0 \uC2E4\uD328\uD574 \uBAA9\uB85D \uB370\uC774\uD130\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4: ", error)), /*#__PURE__*/React.createElement("div", {
    className: "drawer-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "drawer-section-title"
  }, "\uC694\uC57D"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 20,
      fontWeight: 600,
      letterSpacing: "-0.01em",
      marginBottom: 4
    },
    className: "tnum"
  }, fmt.usd(p.amountUsd), " ", /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 13,
      fontWeight: 500
    }
  }, "\xB7 ", fmt.usdc(p.amount))), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12
    }
  }, "\uBE14\uB85D ", fmt.block(p.block), " \xB7 \uB85C\uADF8 #", p.logIndex, " \xB7 ", p.date)), /*#__PURE__*/React.createElement("div", {
    className: "drawer-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "drawer-section-title"
  }, "\uC804\uC1A1 \uD750\uB984"), /*#__PURE__*/React.createElement("div", {
    className: "flow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flow-party"
  }, /*#__PURE__*/React.createElement("div", {
    className: "role"
  }, "\uC9C0\uBD88\uC790"), /*#__PURE__*/React.createElement("div", {
    className: "addr-wrap"
  }, /*#__PURE__*/React.createElement(AddressText, {
    value: p.payer
  })), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Transfer.from")), /*#__PURE__*/React.createElement("div", {
    className: "flow-arrow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "amount"
  }, fmt.usdc(p.amount).replace(" USDC", "")), /*#__PURE__*/React.createElement("div", {
    className: "line"
  }), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, "USDC \xB7 ", p.functionName)), /*#__PURE__*/React.createElement("div", {
    className: "flow-party"
  }, /*#__PURE__*/React.createElement("div", {
    className: "role"
  }, "\uC218\uC2E0\uCC98"), /*#__PURE__*/React.createElement("div", {
    className: "addr-wrap"
  }, /*#__PURE__*/React.createElement(AddressText, {
    value: p.payTo
  })), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "\uC11C\uBE44\uC2A4"))), p.submitter && p.submitter !== p.payer && /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5
    }
  }, "\uC81C\uCD9C\uC790(tx.from): ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, fmt.addr(p.submitter)), " ", p.facilitatorMatched && /*#__PURE__*/React.createElement("span", {
    className: "badge b-accent",
    style: {
      marginLeft: 4
    }
  }, "\uD37C\uC2E4\uB9AC\uD14C\uC774\uD130"))), /*#__PURE__*/React.createElement("div", {
    className: "drawer-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "drawer-section-title"
  }, "\uC2E0\uB8B0\uB3C4 \xB7 ", p.confidence, "/100"), /*#__PURE__*/React.createElement(EvidenceBreakdown, {
    p: p,
    variant: "checklist"
  })), /*#__PURE__*/React.createElement("div", {
    className: "drawer-section"
  }, /*#__PURE__*/React.createElement("div", {
    className: "drawer-section-title"
  }, "\uC6D0\uBCF8 \uD2B8\uB79C\uC7AD\uC158"), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Tx \uD574\uC2DC"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, /*#__PURE__*/React.createElement(TxHashText, {
    value: p.tx
  }))), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uC140\uB809\uD130"), /*#__PURE__*/React.createElement("span", {
    className: "v mono"
  }, p.selector || "—")), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uD568\uC218"), /*#__PURE__*/React.createElement("span", {
    className: "v mono"
  }, p.functionName || "—")), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uAC00\uC2A4 \uC0AC\uC6A9\uB7C9"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum mono"
  }, fmt.num(p.gasUsed))), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uAC00\uC2A4 \uAC00\uACA9"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum mono"
  }, gasPrice, " gwei")), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uAC00\uC2A4 \uBE44\uC6A9"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, fmt.usd(p.gasUsd))), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uC790\uC0B0"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, /*#__PURE__*/React.createElement(AddressText, {
    value: p.asset,
    label: "USDC"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "hstack",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("a", {
    className: "btn btn-sm",
    href: `https://basescan.org/tx/${p.tx}`,
    target: "_blank",
    rel: "noopener noreferrer"
  }, /*#__PURE__*/React.createElement(Icons.External, {
    size: 12
  }), " ", /*#__PURE__*/React.createElement("span", null, "BaseScan")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => copy(p.tx)
  }, /*#__PURE__*/React.createElement(Icons.Copy, {
    size: 12
  }), " ", /*#__PURE__*/React.createElement("span", null, "Tx \uBCF5\uC0AC"))));
}
function EvidenceBreakdown({
  p,
  variant = "checklist"
}) {
  const checks = [{
    label: "EIP-3009 또는 Permit2 방식",
    short: "방식",
    sub: p.method || p.functionName || "감지 방식 없음",
    pass: true,
    weight: 20
  }, {
    label: "calldata와 Transfer 로그 일치",
    short: "일치",
    sub: "수량, 지불자, 수신처가 ERC-20 Transfer 로그와 맞는지 확인",
    pass: Boolean(p.calldataMatches),
    weight: 20
  }, {
    label: "트랜잭션 성공",
    short: "성공",
    sub: "영수증 status = 1",
    pass: Boolean(p.txSuccess),
    weight: 10
  }, {
    label: "AuthorizationUsed 이벤트",
    short: "Auth",
    sub: "USDC 컨트랙트가 위임 사용 이벤트를 발생",
    pass: Boolean(p.authorizationUsed),
    weight: 30
  }, {
    label: "등록된 퍼실리테이터 제출",
    short: "제출자",
    sub: p.facilitatorMatched ? "tx.from이 registry/allowlist에 존재" : "직접 서명 또는 미등록 제출자",
    pass: Boolean(p.facilitatorMatched),
    weight: 20,
    partial: !p.facilitatorMatched
  }];
  const earned = checks.filter(c => c.pass).reduce((s, c) => s + c.weight, 0);
  if (variant === "bar") {
    const total = checks.reduce((s, c) => s + c.weight, 0);
    return /*#__PURE__*/React.createElement("div", {
      className: "conf-viz"
    }, /*#__PURE__*/React.createElement("div", {
      className: "ev-bar-track"
    }, checks.map((c, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      className: "ev-bar-seg",
      style: {
        width: `${c.weight / total * 100}%`,
        background: c.pass ? `rgba(63,185,132,${0.7 - i * 0.08})` : "var(--surface-2)",
        color: c.pass ? "#fff" : "var(--text-4)"
      },
      "data-tip": `${c.label}: +${c.pass ? c.weight : 0}`
    }, c.weight))), /*#__PURE__*/React.createElement("div", {
      className: "hstack",
      style: {
        marginTop: 10,
        justifyContent: "space-between",
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "muted"
    }, "\uD68D\uB4DD \uC810\uC218 ", earned, " / ", total), /*#__PURE__*/React.createElement("span", {
      className: "strong tnum"
    }, p.confidence, "/100")));
  }
  if (variant === "radar") {
    const cx = 90,
      cy = 90,
      r = 72;
    const pts = checks.map((c, i) => {
      const a = Math.PI * 2 * i / checks.length - Math.PI / 2;
      const mag = c.pass ? 1 : c.partial ? 0.15 : 0;
      return [cx + Math.cos(a) * r * mag, cy + Math.sin(a) * r * mag];
    });
    const axes = checks.map((_, i) => {
      const a = Math.PI * 2 * i / checks.length - Math.PI / 2;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    });
    return /*#__PURE__*/React.createElement("div", {
      className: "radar-wrap"
    }, /*#__PURE__*/React.createElement("svg", {
      width: "240",
      height: "200",
      role: "img",
      "aria-label": "\uC2E0\uB8B0\uB3C4 \uB808\uC774\uB354 \uCC28\uD2B8"
    }, [0.33, 0.66, 1].map(t => /*#__PURE__*/React.createElement("polygon", {
      key: t,
      points: axes.map(([x, y]) => `${cx + (x - cx) * t},${cy + (y - cy) * t}`).join(" "),
      fill: "none",
      stroke: "var(--border-subtle)"
    })), axes.map((a, i) => /*#__PURE__*/React.createElement("line", {
      key: i,
      x1: cx,
      y1: cy,
      x2: a[0],
      y2: a[1],
      stroke: "var(--border-subtle)"
    })), /*#__PURE__*/React.createElement("polygon", {
      points: pts.map(p => p.join(",")).join(" "),
      fill: "var(--success-muted)",
      stroke: "var(--success)",
      strokeWidth: "1.25"
    }), checks.map((c, i) => {
      const a = Math.PI * 2 * i / checks.length - Math.PI / 2;
      const x = cx + Math.cos(a) * (r + 14);
      const y = cy + Math.sin(a) * (r + 14);
      return /*#__PURE__*/React.createElement("text", {
        key: i,
        x: x,
        y: y,
        fontSize: "9",
        fill: "var(--text-3)",
        textAnchor: "middle",
        dominantBaseline: "middle"
      }, c.short);
    }), /*#__PURE__*/React.createElement("text", {
      x: cx,
      y: cy,
      fontSize: "18",
      fill: "var(--text)",
      textAnchor: "middle",
      dominantBaseline: "middle",
      fontWeight: "600",
      fontFamily: "var(--font-mono)"
    }, p.confidence)));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "evidence-list"
  }, checks.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "evidence-row"
  }, /*#__PURE__*/React.createElement("span", {
    className: c.pass ? "check" : c.partial ? "partial" : "miss"
  }, c.pass ? /*#__PURE__*/React.createElement(Icons.Check, {
    size: 14
  }) : /*#__PURE__*/React.createElement(Icons.Circle, {
    size: 12
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "label"
  }, c.label), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, c.sub)), /*#__PURE__*/React.createElement("div", {
    className: "score"
  }, "+", c.pass ? c.weight : 0))));
}
function PaymentsTable({
  payments,
  activeId,
  onRowClick
}) {
  const sort = useSort("ts", "desc");
  const rows = [...payments].sort((a, b) => {
    const g = x => sort.key === "amountUsd" ? x.amountUsd : sort.key === "block" ? x.block : sort.key === "confidence" ? x.confidence : new Date(x.ts).getTime();
    const [A, B] = [g(a), g(b)];
    return sort.dir === "asc" ? A - B : B - A;
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement(SortHeader, {
    label: "\uC2DC\uAC04",
    k: "ts",
    sort: sort
  }), /*#__PURE__*/React.createElement("th", null, "Tx"), /*#__PURE__*/React.createElement(SortHeader, {
    label: "\uBE14\uB85D",
    k: "block",
    sort: sort
  }), /*#__PURE__*/React.createElement("th", null, "\uC9C0\uBD88\uC790"), /*#__PURE__*/React.createElement("th", null, "\uC218\uC2E0\uCC98"), /*#__PURE__*/React.createElement("th", null, "\uC790\uC0B0"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "right"
    }
  }, "\uC218\uB7C9"), /*#__PURE__*/React.createElement(SortHeader, {
    label: "USD",
    k: "amountUsd",
    sort: sort,
    align: "right"
  }), /*#__PURE__*/React.createElement(SortHeader, {
    label: "\uC2E0\uB8B0\uB3C4",
    k: "confidence",
    sort: sort,
    align: "right"
  }))), /*#__PURE__*/React.createElement("tbody", null, rows.map(p => {
    const open = () => onRowClick(p);
    return /*#__PURE__*/React.createElement("tr", {
      key: p.id,
      className: `clickable ${activeId === p.id ? "active" : ""}`,
      role: "button",
      tabIndex: 0,
      "aria-label": `결제 상세 열기 ${fmt.hash(p.tx)}`,
      onClick: open,
      onKeyDown: e => {
        if (e.currentTarget !== e.target) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }
    }, /*#__PURE__*/React.createElement("td", {
      className: "td-muted",
      "data-tip": p.ts
    }, p.date), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(TxHashText, {
      value: p.tx
    })), /*#__PURE__*/React.createElement("td", {
      className: "td-num mono"
    }, fmt.block(p.block)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(AddressText, {
      value: p.payer
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(AddressText, {
      value: p.payTo
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "badge b-info"
    }, "USDC")), /*#__PURE__*/React.createElement("td", {
      className: "td-num mono"
    }, fmt.usdc(p.amount)), /*#__PURE__*/React.createElement("td", {
      className: "td-num"
    }, fmt.usd(p.amountUsd)), /*#__PURE__*/React.createElement("td", {
      className: "td-right"
    }, /*#__PURE__*/React.createElement(ConfidenceBadge, {
      score: p.confidence
    })));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "table-footer"
  }, /*#__PURE__*/React.createElement("span", null, fmt.num(rows.length), "\uAC74\uC758 \uACB0\uC81C"), /*#__PURE__*/React.createElement(Pagination, {
    page: 1,
    total: rows.length,
    pageSize: 20,
    onChange: () => {}
  })));
}
function PagePayments({
  onOpenPayment,
  selectedId
}) {
  const [filters, setFilters] = React.useState({
    payer: "",
    payTo: "",
    minUsd: "",
    maxUsd: "",
    from: "",
    to: ""
  });
  const rows = MOCK.payments.filter(p => {
    if (filters.payer && !p.payer.toLowerCase().includes(filters.payer.toLowerCase())) return false;
    if (filters.payTo && !p.payTo.toLowerCase().includes(filters.payTo.toLowerCase())) return false;
    if (filters.minUsd && p.amountUsd < parseFloat(filters.minUsd)) return false;
    if (filters.maxUsd && p.amountUsd > parseFloat(filters.maxUsd)) return false;
    if (filters.from && new Date(p.ts).getTime() < new Date(`${filters.from}T00:00:00Z`).getTime()) return false;
    if (filters.to && new Date(p.ts).getTime() > new Date(`${filters.to}T23:59:59Z`).getTime()) return false;
    return true;
  });
  const reset = () => setFilters({
    payer: "",
    payTo: "",
    minUsd: "",
    maxUsd: "",
    from: "",
    to: ""
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\uACB0\uC81C"), /*#__PURE__*/React.createElement("div", {
    className: "page-sub"
  }, fmt.num(rows.length), "\uAC74\uC758 x402 \uACB0\uC81C\uAC00 \uC778\uB371\uC2F1\uB418\uC5C8\uC2B5\uB2C8\uB2E4. \uD589\uC744 \uD074\uB9AD\uD558\uAC70\uB098 Enter\uB97C \uB204\uB974\uBA74 \uC2E0\uB8B0\uB3C4\uC640 \uC6D0\uBCF8 \uD2B8\uB79C\uC7AD\uC158\uC744 \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."))), /*#__PURE__*/React.createElement(FilterBar, {
    filters: filters,
    setFilters: setFilters
  }), rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC870\uAC74\uC5D0 \uB9DE\uB294 \uACB0\uC81C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uD544\uD130\uB97C \uCD08\uAE30\uD654\uD558\uAC70\uB098 \uC8FC\uC18C/\uAE08\uC561/\uB0A0\uC9DC \uBC94\uC704\uB97C \uB113\uD600\uBCF4\uC138\uC694. \uB370\uC774\uD130 \uC790\uCCB4\uAC00 \uC5C6\uB2E4\uBA74 \uBC31\uD544 \uB610\uB294 \uC2E4\uC2DC\uAC04 \uC6CC\uCEE4 \uC0C1\uD0DC\uB97C \uBA3C\uC800 \uD655\uC778\uD574\uC57C \uD569\uB2C8\uB2E4.",
    action: /*#__PURE__*/React.createElement("button", {
      className: "btn btn-sm",
      onClick: reset
    }, "\uD544\uD130 \uCD08\uAE30\uD654")
  })) : /*#__PURE__*/React.createElement(PaymentsTable, {
    payments: rows,
    activeId: selectedId,
    onRowClick: onOpenPayment
  }));
}
function PaymentDrawer({
  payment,
  onClose,
  variant
}) {
  const [detail, setDetail] = React.useState(payment);
  const [state, setState] = React.useState({
    loading: false,
    error: null
  });
  React.useEffect(() => {
    let alive = true;
    setDetail(payment);
    setState({
      loading: true,
      error: null
    });
    window.loadPaymentDetail(payment).then(next => {
      if (alive) setDetail(next || payment);
    }).catch(error => {
      if (alive) setState({
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }).finally(() => {
      if (alive) setState(current => ({
        ...current,
        loading: false
      }));
    });
    return () => {
      alive = false;
    };
  }, [payment?.id]);
  if (!payment) return null;
  const p = detail || payment;
  const relatedPayments = MOCK.payments.filter(item => item.payer === p.payer && item.id !== p.id).slice(0, 3);
  if (variant === "page") {
    return /*#__PURE__*/React.createElement("div", {
      className: "drawer-overlay",
      onClick: onClose
    }, /*#__PURE__*/React.createElement("div", {
      className: "detail-page-shell",
      onClick: e => e.stopPropagation()
    }, /*#__PURE__*/React.createElement("div", {
      className: "drawer-header"
    }, /*#__PURE__*/React.createElement("div", {
      className: "hstack"
    }, /*#__PURE__*/React.createElement("button", {
      className: "btn btn-sm btn-ghost btn-icon",
      onClick: onClose,
      "aria-label": "\uB2EB\uAE30"
    }, /*#__PURE__*/React.createElement(Icons.ChevronLeft, null)), /*#__PURE__*/React.createElement("span", {
      className: "drawer-title"
    }, "\uACB0\uC81C"), /*#__PURE__*/React.createElement("span", {
      className: "mono muted",
      style: {
        fontSize: 12
      }
    }, fmt.hash(p.tx))), /*#__PURE__*/React.createElement("button", {
      className: "btn btn-sm btn-ghost btn-icon",
      onClick: onClose,
      "aria-label": "\uB2EB\uAE30"
    }, /*#__PURE__*/React.createElement(Icons.X, null))), /*#__PURE__*/React.createElement("div", {
      className: "detail-page-body"
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(PaymentDetailBody, {
      p: p,
      loading: state.loading,
      error: state.error
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      className: "card"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card-header"
    }, /*#__PURE__*/React.createElement("div", {
      className: "card-title"
    }, "\uAD00\uB828 \uD65C\uB3D9")), /*#__PURE__*/React.createElement("div", {
      className: "card-body"
    }, /*#__PURE__*/React.createElement("div", {
      className: "muted",
      style: {
        fontSize: 12,
        marginBottom: 8
      }
    }, "\uAC19\uC740 \uC9C0\uBD88\uC790\uC758 \uB2E4\uB978 \uACB0\uC81C"), relatedPayments.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
      title: "\uAD00\uB828 \uACB0\uC81C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
      desc: "\uD604\uC7AC \uBAA9\uB85D\uC5D0\uB294 \uAC19\uC740 \uC9C0\uBD88\uC790\uC758 \uB2E4\uB978 \uACB0\uC81C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."
    }) : relatedPayments.map(item => /*#__PURE__*/React.createElement("div", {
      key: item.id,
      className: "hstack",
      style: {
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid var(--border-subtle)",
        fontSize: 12
      }
    }, /*#__PURE__*/React.createElement(TxHashText, {
      value: item.tx
    }), /*#__PURE__*/React.createElement("span", {
      className: "tnum"
    }, fmt.usd(item.amountUsd))))))))));
  }
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "drawer-overlay",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("aside", {
    className: "drawer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "drawer-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "drawer-title"
  }, "\uACB0\uC81C")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-ghost btn-icon",
    onClick: onClose,
    "aria-label": "\uB2EB\uAE30"
  }, /*#__PURE__*/React.createElement(Icons.X, null))), /*#__PURE__*/React.createElement("div", {
    className: "drawer-body"
  }, /*#__PURE__*/React.createElement(PaymentDetailBody, {
    p: p,
    loading: state.loading,
    error: state.error
  }))));
}
Object.assign(window, {
  PagePayments,
  PaymentDrawer,
  EvidenceBreakdown
});
