// 에이전트, 서비스, 상호작용, 증거, 설정, 문서 페이지.

function PageAgents({
  onOpen
}) {
  const sort = useSort("spent");
  const rows = [...MOCK.agents].sort((a, b) => {
    const g = x => x[sort.key] ?? 0;
    return sort.dir === "asc" ? g(a) - g(b) : g(b) - g(a);
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\uC5D0\uC774\uC804\uD2B8"), /*#__PURE__*/React.createElement("div", {
    className: "page-sub"
  }, "\uACB0\uC81C \uC9C0\uBD88\uC790(payer) \uC8FC\uC18C ", fmt.num(rows.length), "\uAC1C\uB97C \uCD1D USDC \uC9C0\uCD9C \uAE30\uC900\uC73C\uB85C \uC815\uB82C\uD569\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    disabled: true,
    "data-tip": "CSV \uB0B4\uBCF4\uB0B4\uAE30\uB294 \uB2E4\uC74C \uB2E8\uACC4 API\uC5D0\uC11C \uC5F0\uACB0\uD560 \uC608\uC815\uC785\uB2C8\uB2E4."
  }, /*#__PURE__*/React.createElement(Icons.Download, {
    size: 12
  }), " ", /*#__PURE__*/React.createElement("span", null, "CSV"))), rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC5D0\uC774\uC804\uD2B8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uACB0\uC81C\uAC00 \uC778\uB371\uC2F1\uB418\uBA74 payer \uC8FC\uC18C\uAC00 \uC5D0\uC774\uC804\uD2B8\uB85C \uC9D1\uACC4\uB429\uB2C8\uB2E4."
  })) : /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\uC5D0\uC774\uC804\uD2B8"), /*#__PURE__*/React.createElement("th", null, "\uC885\uB958"), /*#__PURE__*/React.createElement(SortHeader, {
    label: "\uACB0\uC81C \uC218",
    k: "payments",
    sort: sort,
    align: "right"
  }), /*#__PURE__*/React.createElement(SortHeader, {
    label: "\uCD1D \uC9C0\uCD9C",
    k: "spent",
    sort: sort,
    align: "right"
  }), /*#__PURE__*/React.createElement(SortHeader, {
    label: "\uAC00\uC2A4",
    k: "gas",
    sort: sort,
    align: "right"
  }), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uC218\uC775"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uC21C ROI"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uC11C\uBE44\uC2A4"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uB9C8\uC9C0\uB9C9 \uBE14\uB85D"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(a => {
    const roi = a.revenue - a.spent - a.gas;
    return /*#__PURE__*/React.createElement("tr", {
      key: a.address,
      className: "clickable",
      onClick: () => onOpen(a)
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(AddressText, {
      value: a.address
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "badge"
    }, a.kind)), /*#__PURE__*/React.createElement("td", {
      className: "td-num"
    }, a.payments), /*#__PURE__*/React.createElement("td", {
      className: "td-num"
    }, fmt.usd(a.spent)), /*#__PURE__*/React.createElement("td", {
      className: "td-num"
    }, fmt.usd(a.gas)), /*#__PURE__*/React.createElement("td", {
      className: "td-num td-muted"
    }, fmt.usd(a.revenue)), /*#__PURE__*/React.createElement("td", {
      className: "td-num",
      style: {
        color: roi < 0 ? "var(--danger)" : "var(--success)"
      }
    }, fmt.usd(roi)), /*#__PURE__*/React.createElement("td", {
      className: "td-num"
    }, a.services), /*#__PURE__*/React.createElement("td", {
      className: "td-num mono"
    }, fmt.block(a.lastSeen)));
  })))));
}
function PageAgentDetail({
  agent,
  onBack,
  roiVariant
}) {
  const payments = MOCK.payments.filter(p => p.payer === agent.address);
  const interactions = MOCK.interactions.filter(i => i.agent === agent.address);
  const roi = agent.revenue - agent.spent - agent.gas;
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hstack",
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-ghost",
    onClick: onBack
  }, /*#__PURE__*/React.createElement(Icons.ChevronLeft, null), " ", /*#__PURE__*/React.createElement("span", null, "\uC5D0\uC774\uC804\uD2B8"))), /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontFamily: "var(--font-mono)",
      fontSize: 17,
      letterSpacing: "-0.01em"
    }
  }, agent.address), /*#__PURE__*/React.createElement("div", {
    className: "hstack mb-12",
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge"
  }, agent.kind), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 12
    }
  }, "\uCCAB \uBC1C\uACAC ", fmt.block(agent.firstSeen), " \xB7 \uB9C8\uC9C0\uB9C9 \uBC1C\uACAC ", fmt.block(agent.lastSeen)))), /*#__PURE__*/React.createElement("div", {
    className: "hstack"
  }, /*#__PURE__*/React.createElement("a", {
    className: "btn btn-sm",
    href: `https://basescan.org/address/${agent.address}`,
    target: "_blank",
    rel: "noopener noreferrer"
  }, /*#__PURE__*/React.createElement(Icons.External, {
    size: 12
  }), " ", /*#__PURE__*/React.createElement("span", null, "BaseScan")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm",
    onClick: () => copy(agent.address)
  }, /*#__PURE__*/React.createElement(Icons.Copy, {
    size: 12
  }), " ", /*#__PURE__*/React.createElement("span", null, "\uBCF5\uC0AC")))), /*#__PURE__*/React.createElement("div", {
    className: "kpi-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "\uACB0\uC81C \uC218"), /*#__PURE__*/React.createElement("span", {
    className: "val"
  }, agent.payments)), /*#__PURE__*/React.createElement("div", {
    className: "kpi-cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "\uCD1D \uC9C0\uCD9C"), /*#__PURE__*/React.createElement("span", {
    className: "val"
  }, fmt.usd(agent.spent))), /*#__PURE__*/React.createElement("div", {
    className: "kpi-cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "\uAC00\uC2A4"), /*#__PURE__*/React.createElement("span", {
    className: "val"
  }, fmt.usd(agent.gas))), /*#__PURE__*/React.createElement("div", {
    className: "kpi-cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "\uC218\uC775"), /*#__PURE__*/React.createElement("span", {
    className: "val"
  }, fmt.usd(agent.revenue))), /*#__PURE__*/React.createElement("div", {
    className: "kpi-cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "\uC21C ROI"), /*#__PURE__*/React.createElement("span", {
    className: "val",
    style: {
      color: roi < 0 ? "var(--danger)" : "var(--success)"
    }
  }, fmt.usd(roi))), /*#__PURE__*/React.createElement("div", {
    className: "kpi-cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "\uC11C\uBE44\uC2A4"), /*#__PURE__*/React.createElement("span", {
    className: "val"
  }, agent.services))), roiVariant === "multi" ? /*#__PURE__*/React.createElement("div", {
    className: "chart-grid-3"
  }, [{
    title: "일별 지출",
    color: "var(--chart-1)",
    acc: d => d.volume
  }, {
    title: "일별 가스",
    color: "var(--chart-4)",
    acc: d => d.gas
  }, {
    title: "일별 결제 수",
    color: "var(--chart-2)",
    acc: d => d.payments
  }].map(c => /*#__PURE__*/React.createElement("div", {
    className: "card",
    key: c.title
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, c.title)), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: MOCK.daily,
    accessor: c.acc,
    color: c.color,
    width: 340,
    height: 140
  }))))) : /*#__PURE__*/React.createElement("div", {
    className: "card mb-20"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "ROI \uD750\uB984"), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11.5
    }
  }, "\uC9C0\uCD9C \xB7 \uAC00\uC2A4 \xB7 \uC218\uC775")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: MOCK.daily,
    accessor: d => d.volume,
    color: "var(--chart-1)",
    width: 1100,
    height: 180
  }))), /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "\uC774 \uC5D0\uC774\uC804\uD2B8\uC758 \uACB0\uC81C"), payments.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uACB0\uC81C \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uD604\uC7AC \uB85C\uB4DC\uB41C \uCD5C\uADFC \uACB0\uC81C \uBAA9\uB85D \uC548\uC5D0\uB294 \uC774 \uC5D0\uC774\uC804\uD2B8\uC758 \uACB0\uC81C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."
  })) : /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\uC2DC\uAC04"), /*#__PURE__*/React.createElement("th", null, "Tx"), /*#__PURE__*/React.createElement("th", null, "\uC218\uC2E0\uCC98"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uC218\uB7C9"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "USD"))), /*#__PURE__*/React.createElement("tbody", null, payments.map(p => /*#__PURE__*/React.createElement("tr", {
    key: p.id
  }, /*#__PURE__*/React.createElement("td", {
    className: "td-muted"
  }, p.date), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(TxHashText, {
    value: p.tx
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(AddressText, {
    value: p.payTo
  })), /*#__PURE__*/React.createElement("td", {
    className: "td-num mono"
  }, fmt.usdc(p.amount)), /*#__PURE__*/React.createElement("td", {
    className: "td-num"
  }, fmt.usd(p.amountUsd))))))), /*#__PURE__*/React.createElement("div", {
    className: "sec-title"
  }, "\uCD5C\uADFC \uC0C1\uD638\uC791\uC6A9"), interactions.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC0C1\uD638\uC791\uC6A9 \uB0B4\uC5ED\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uC774 \uC5D0\uC774\uC804\uD2B8\uAC00 \uD638\uCD9C\uD55C \uD568\uC218/\uB300\uC0C1 \uCEE8\uD2B8\uB799\uD2B8\uAC00 \uC544\uC9C1 \uB85C\uB4DC\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4."
  })) : /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\uC2DC\uAC04"), /*#__PURE__*/React.createElement("th", null, "Tx"), /*#__PURE__*/React.createElement("th", null, "\uB300\uC0C1"), /*#__PURE__*/React.createElement("th", null, "\uC140\uB809\uD130"), /*#__PURE__*/React.createElement("th", null, "\uD568\uC218"))), /*#__PURE__*/React.createElement("tbody", null, interactions.map((i, idx) => /*#__PURE__*/React.createElement("tr", {
    key: idx
  }, /*#__PURE__*/React.createElement("td", {
    className: "td-muted"
  }, i.ts), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(TxHashText, {
    value: i.tx
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(AddressText, {
    value: i.target
  })), /*#__PURE__*/React.createElement("td", {
    className: "td-mono"
  }, i.selector), /*#__PURE__*/React.createElement("td", {
    className: "td-mono"
  }, i.fn)))))));
}
function PageServices() {
  const rows = [...MOCK.services].sort((a, b) => b.received - a.received);
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\uC11C\uBE44\uC2A4"), /*#__PURE__*/React.createElement("div", {
    className: "page-sub"
  }, "x402 \uC815\uC0B0\uC744 \uBC1B\uC740 pay_to \uC8FC\uC18C ", fmt.num(rows.length), "\uAC1C\uC785\uB2C8\uB2E4."))), rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC11C\uBE44\uC2A4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uACB0\uC81C \uC218\uC2E0\uCC98\uAC00 \uAC10\uC9C0\uB418\uBA74 \uC11C\uBE44\uC2A4\uBCC4 \uC218\uC2E0\uC561\uACFC \uC9C0\uBD88\uC790 \uC218\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4."
  })) : /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\uC11C\uBE44\uC2A4"), /*#__PURE__*/React.createElement("th", null, "\uC774\uB984"), /*#__PURE__*/React.createElement("th", null, "\uCE74\uD14C\uACE0\uB9AC"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uACB0\uC81C \uC218"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uC218\uC2E0\uC561"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uACE0\uC720 \uC9C0\uBD88\uC790"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uB9C8\uC9C0\uB9C9 \uBE14\uB85D"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(s => /*#__PURE__*/React.createElement("tr", {
    key: s.address
  }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(AddressText, {
    value: s.address
  })), /*#__PURE__*/React.createElement("td", null, s.name || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\uC774\uB984 \uC5C6\uC74C")), /*#__PURE__*/React.createElement("td", null, s.category || /*#__PURE__*/React.createElement("span", {
    className: "muted"
  }, "\uCE74\uD14C\uACE0\uB9AC \uC5C6\uC74C")), /*#__PURE__*/React.createElement("td", {
    className: "td-num"
  }, s.payments), /*#__PURE__*/React.createElement("td", {
    className: "td-num"
  }, fmt.usd(s.received)), /*#__PURE__*/React.createElement("td", {
    className: "td-num"
  }, s.payers), /*#__PURE__*/React.createElement("td", {
    className: "td-num mono"
  }, fmt.block(s.lastSeen))))))));
}
function PageInteractions() {
  const selectorMap = new Map();
  const targetMap = new Map();
  for (const item of MOCK.interactions) {
    const sel = item.selector || "unknown";
    const prev = selectorMap.get(sel) || {
      sel,
      fn: item.fn,
      n: 0
    };
    prev.n += 1;
    selectorMap.set(sel, prev);
    const target = item.target || "unknown";
    const current = targetMap.get(target) || {
      target,
      n: 0
    };
    current.n += 1;
    targetMap.set(target, current);
  }
  const selectors = [...selectorMap.values()].sort((a, b) => b.n - a.n);
  const targets = [...targetMap.values()].sort((a, b) => b.n - a.n).slice(0, 5);
  const maxSelector = Math.max(1, ...selectors.map(r => r.n));
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\uC0C1\uD638\uC791\uC6A9"), /*#__PURE__*/React.createElement("div", {
    className: "page-sub"
  }, "x402 \uC804\uC1A1\uACFC \uD568\uAED8 \uD638\uCD9C\uB41C \uD568\uC218 \uC140\uB809\uD130\uC640 \uB300\uC0C1 \uCEE8\uD2B8\uB799\uD2B8\uC785\uB2C8\uB2E4. \uD37C\uC2E4\uB9AC\uD14C\uC774\uD130 \uD328\uD134\uC744 \uD30C\uC545\uD558\uB294 \uB370 \uC0AC\uC6A9\uD569\uB2C8\uB2E4."))), /*#__PURE__*/React.createElement("div", {
    className: "chart-grid-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uC140\uB809\uD130 \uBD84\uD3EC")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, selectors.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC140\uB809\uD130 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uC0C1\uD638\uC791\uC6A9\uC774 \uC778\uB371\uC2F1\uB418\uBA74 \uD568\uC218 \uC140\uB809\uD130\uBCC4 \uD638\uCD9C \uC218\uAC00 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
  }) : selectors.map(r => /*#__PURE__*/React.createElement("div", {
    key: r.sel,
    className: "bar-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bar-label"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, r.sel), " ", /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11.5
    }
  }, "\xB7 ", r.fn)), /*#__PURE__*/React.createElement("div", {
    className: "bar-val tnum"
  }, r.n), /*#__PURE__*/React.createElement("div", {
    className: "bar-track",
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bar-fill",
    style: {
      width: `${r.n / maxSelector * 100}%`
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uB300\uC0C1 \uCEE8\uD2B8\uB799\uD2B8")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, targets.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uB300\uC0C1 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uD638\uCD9C \uB300\uC0C1 \uCEE8\uD2B8\uB799\uD2B8\uAC00 \uC544\uC9C1 \uC5C6\uC2B5\uB2C8\uB2E4."
  }) : targets.map(t => /*#__PURE__*/React.createElement("div", {
    className: "kv",
    key: t.target
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, t.target?.startsWith?.("0x") ? /*#__PURE__*/React.createElement(AddressText, {
    value: t.target
  }) : /*#__PURE__*/React.createElement("span", {
    className: "mono muted"
  }, t.target || "unknown")), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, fmt.num(t.n), "\uD68C \uD638\uCD9C")))))), MOCK.interactions.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC0C1\uD638\uC791\uC6A9 \uBAA9\uB85D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uACB0\uC81C \uD6C4\uBCF4\uB97C \uCC98\uB9AC\uD558\uBA74 \uAD00\uB828 transaction selector\uC640 target\uC774 \uC800\uC7A5\uB429\uB2C8\uB2E4."
  })) : /*#__PURE__*/React.createElement("div", {
    className: "table-wrap"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\uC2DC\uAC04"), /*#__PURE__*/React.createElement("th", null, "Tx"), /*#__PURE__*/React.createElement("th", null, "\uC5D0\uC774\uC804\uD2B8"), /*#__PURE__*/React.createElement("th", null, "\uB300\uC0C1"), /*#__PURE__*/React.createElement("th", null, "\uC140\uB809\uD130"), /*#__PURE__*/React.createElement("th", null, "\uD568\uC218"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uBE14\uB85D"))), /*#__PURE__*/React.createElement("tbody", null, MOCK.interactions.map((i, idx) => /*#__PURE__*/React.createElement("tr", {
    key: idx
  }, /*#__PURE__*/React.createElement("td", {
    className: "td-muted"
  }, i.ts), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(TxHashText, {
    value: i.tx
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(AddressText, {
    value: i.agent
  })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(AddressText, {
    value: i.target
  })), /*#__PURE__*/React.createElement("td", {
    className: "td-mono"
  }, i.selector), /*#__PURE__*/React.createElement("td", {
    className: "td-mono"
  }, i.fn), /*#__PURE__*/React.createElement("td", {
    className: "td-num mono"
  }, fmt.block(i.block))))))));
}
function PageEvidence({
  evidenceVariant
}) {
  const [filter, setFilter] = React.useState("all");
  const [selId, setSelId] = React.useState(null);
  const all = MOCK.evidence;
  const promotedCount = all.filter(e => e.promoted).length;
  const belowCount = all.length - promotedCount;
  const rows = all.filter(e => filter === "all" || (filter === "promoted" ? e.promoted : !e.promoted));
  React.useEffect(() => {
    if (rows.length > 0 && !rows.some(row => row.id === selId)) {
      setSelId(rows[0].id);
    }
  }, [filter, all.length]);
  const sel = rows.find(a => a.id === selId) || rows[0];
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\uD310\uBCC4 \uC99D\uAC70"), /*#__PURE__*/React.createElement("div", {
    className: "page-sub"
  }, "x402 \uD328\uD134\uACFC \uB9E4\uCE6D\uB41C \uBAA8\uB4E0 \uD6C4\uBCF4 \uB85C\uADF8\uC785\uB2C8\uB2E4. \uC2B9\uACA9 ", fmt.num(promotedCount), "\uAC74 \xB7 \uAE30\uC900 \uBBF8\uB2EC ", fmt.num(belowCount), "\uAC74.")), /*#__PURE__*/React.createElement("div", {
    className: "seg-tabs",
    role: "tablist",
    "aria-label": "\uC99D\uAC70 \uD544\uD130"
  }, [["all", "전체"], ["promoted", "승격됨"], ["below", "기준 미달"]].map(([id, label]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    type: "button",
    className: `seg-tab ${filter === id ? "active" : ""}`,
    onClick: () => setFilter(id)
  }, label)))), all.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uD310\uBCC4 \uC99D\uAC70\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uD544\uD130\uB9C1 \uB2E8\uACC4\uC5D0\uC11C x402 \uD6C4\uBCF4\uB97C \uCC3E\uC73C\uBA74 \uC2E0\uB8B0\uB3C4\uC640 \uC2B9\uACA9 \uC5EC\uBD80\uAC00 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
  })) : /*#__PURE__*/React.createElement("div", {
    className: "evidence-layout"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-wrap",
    style: {
      alignSelf: "start"
    }
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\uC2DC\uAC04"), /*#__PURE__*/React.createElement("th", null, "Tx"), /*#__PURE__*/React.createElement("th", null, "\uBC29\uC2DD"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uC2E0\uB8B0\uB3C4"), /*#__PURE__*/React.createElement("th", null, "\uC2B9\uACA9"))), /*#__PURE__*/React.createElement("tbody", null, rows.map(a => /*#__PURE__*/React.createElement("tr", {
    key: a.id,
    className: `clickable ${selId === a.id ? "active" : ""}`,
    onClick: () => setSelId(a.id)
  }, /*#__PURE__*/React.createElement("td", {
    className: "td-muted"
  }, a.date), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(TxHashText, {
    value: a.tx
  })), /*#__PURE__*/React.createElement("td", {
    className: "td-mono",
    style: {
      fontSize: 11.5
    }
  }, a.method), /*#__PURE__*/React.createElement("td", {
    className: "td-right"
  }, /*#__PURE__*/React.createElement(ConfidenceBadge, {
    score: a.confidence
  })), /*#__PURE__*/React.createElement("td", null, a.promoted ? /*#__PURE__*/React.createElement("span", {
    className: "badge b-success"
  }, /*#__PURE__*/React.createElement(Icons.Dot, null), " \uC608") : /*#__PURE__*/React.createElement("span", {
    className: "badge"
  }, /*#__PURE__*/React.createElement(Icons.Dot, null), " \uC544\uB2C8\uC624")))))), rows.length === 0 && /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC120\uD0DD\uD55C \uD544\uD130\uC758 \uC99D\uAC70\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uB2E4\uB978 \uD544\uD130\uB97C \uC120\uD0DD\uD574 \uD655\uC778\uD558\uC138\uC694."
  })), /*#__PURE__*/React.createElement("div", null, sel ? /*#__PURE__*/React.createElement("div", {
    className: "card evidence-sticky"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uC2E0\uB8B0\uB3C4 \uC0C1\uC138"), /*#__PURE__*/React.createElement("div", {
    className: "card-sub mono",
    style: {
      fontSize: 11
    }
  }, fmt.hash(sel.tx))), /*#__PURE__*/React.createElement(ConfidenceBadge, {
    score: sel.confidence
  })), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement(EvidenceBreakdown, {
    p: {
      method: sel.method,
      calldataMatches: sel.calldataMatches ?? true,
      txSuccess: sel.txSuccess ?? true,
      authorizationUsed: sel.authorizationUsed ?? false,
      facilitatorMatched: sel.facilitatorMatched ?? false,
      confidence: sel.confidence
    },
    variant: evidenceVariant
  }), !sel.promoted && /*#__PURE__*/React.createElement("div", {
    className: "alert-banner warn",
    style: {
      marginTop: 14,
      marginBottom: 0
    }
  }, /*#__PURE__*/React.createElement(Icons.Info, null), /*#__PURE__*/React.createElement("span", {
    className: "desc"
  }, "\uC2E0\uB8B0\uB3C4 ", sel.confidence, "\uC810\uC740 \uC2B9\uACA9 \uAE30\uC900 ", MOCK.settings.confidenceThreshold, "\uC810\uBCF4\uB2E4 \uB0AE\uC544 payment\uB85C \uC2B9\uACA9\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4.")))) : /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC120\uD0DD\uB41C \uC99D\uAC70\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uC67C\uCABD \uBAA9\uB85D\uC5D0\uC11C \uC99D\uAC70\uB97C \uC120\uD0DD\uD558\uC138\uC694."
  })))));
}
function PageSettings() {
  const s = MOCK.settings;
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\uC124\uC815"), /*#__PURE__*/React.createElement("div", {
    className: "page-sub"
  }, "\uB7F0\uD0C0\uC784 \uC124\uC815 \uC694\uC57D\uC785\uB2C8\uB2E4. \uBE44\uBC00\uAC12\uC740 \uB9C8\uC2A4\uD0B9\uB418\uBA70 \uC2E4\uC81C \uC218\uC815\uC740 \uD658\uACBD \uBCC0\uC218\uB85C \uD569\uB2C8\uB2E4."))), /*#__PURE__*/React.createElement("div", {
    className: "chart-grid-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uCCB4\uC778")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uB124\uD2B8\uC6CC\uD06C"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, s.chain)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uCCB4\uC778 ID"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, s.chainId)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "RPC \uD638\uC2A4\uD2B8"), /*#__PURE__*/React.createElement("span", {
    className: "v mono"
  }, s.rpcHost)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "RPC \uD0A4"), /*#__PURE__*/React.createElement("span", {
    className: "v mono muted"
  }, s.rpcKeyMasked ? "****" : "—")), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uBCF4\uC870 RPC"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, s.fallbackRpcCount)))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uD310\uBCC4")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uC2E0\uB8B0\uB3C4 \uAE30\uC900"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, s.confidenceThreshold)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uD37C\uC2E4\uB9AC\uD14C\uC774\uD130 \uD544\uD130"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, s.facilitatorFilterMode)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Finality \uC9C0\uC5F0"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, s.finalityLag, " \uBE14\uB85D")), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uCD5C\uB300 \uB9AC\uC624\uADF8 \uAE4A\uC774"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, s.maxReorgDepth))))), /*#__PURE__*/React.createElement("div", {
    className: "chart-grid-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uB808\uC9C0\uC2A4\uD2B8\uB9AC")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uB4F1\uB85D \uC790\uC0B0"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, s.knownAssetsCount)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uB4F1\uB85D \uD37C\uC2E4\uB9AC\uD14C\uC774\uD130"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, s.knownFacilitatorsCount)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uB4F1\uB85D \uD504\uB85D\uC2DC"), /*#__PURE__*/React.createElement("span", {
    className: "v tnum"
  }, s.knownProxiesCount)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uD37C\uC2E4\uB9AC\uD14C\uC774\uD130 \uC18C\uC2A4"), /*#__PURE__*/React.createElement("span", {
    className: "v mono",
    style: {
      fontSize: 11.5
    }
  }, s.facilitatorSourceUrl)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uC18C\uC2A4 \uC0AC\uC6A9"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, /*#__PURE__*/React.createElement("span", {
    className: "badge b-success"
  }, /*#__PURE__*/React.createElement(Icons.Dot, null), " \uC608"))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uC778\uD504\uB77C")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "\uB370\uC774\uD130\uBCA0\uC774\uC2A4"), /*#__PURE__*/React.createElement("span", {
    className: "v mono muted"
  }, s.dbUrlMasked)), /*#__PURE__*/React.createElement("div", {
    className: "kv"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Redis"), /*#__PURE__*/React.createElement("span", {
    className: "v mono muted"
  }, s.redisUrlMasked)), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 11.5,
      marginTop: 8
    }
  }, "\uC5F0\uACB0 \uBB38\uC790\uC5F4\uC740 \uB9C8\uC2A4\uD0B9\uB429\uB2C8\uB2E4. ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "DATABASE_URL"), ", ", /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "REDIS_URL"), " \uD658\uACBD \uBCC0\uC218\uB85C \uBCC0\uACBD\uD569\uB2C8\uB2E4.")))));
}
function PageDocs() {
  const docs = [["전체 설계 문서", "x402 인덱서가 어떤 로직으로 결제를 찾고 저장하는지 설명합니다.", "/docs/final.md"], ["초보자용 로직 가이드", "블록체인/개발 지식이 없어도 전체 흐름을 학습할 수 있게 풀어쓴 문서입니다.", "/docs/INDEXER_LOGIC_GUIDE.md"], ["코드 흐름 분석", "파일과 함수 기준으로 인덱싱 파이프라인을 따라갑니다.", "/docs/CODEBASE_FLOW_ANALYSIS.md"], ["UI 요구사항", "현재 콘솔 화면을 만들 때 참고한 데이터 시각화/UX 요구사항입니다.", "/docs/UI_REQUIREMENTS.md"]];
  return /*#__PURE__*/React.createElement("div", {
    className: "page",
    style: {
      maxWidth: 780
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\uBB38\uC11C"), /*#__PURE__*/React.createElement("div", {
    className: "page-sub"
  }, "\uD559\uC2B5 \uBB38\uC11C\uC640 \uC124\uACC4 \uCC38\uACE0 \uC790\uB8CC\uC785\uB2C8\uB2E4."))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body vstack",
    style: {
      gap: 10
    }
  }, docs.map(([t, d, href]) => /*#__PURE__*/React.createElement("a", {
    key: t,
    href: href,
    className: "hstack",
    style: {
      padding: "10px 12px",
      borderRadius: 6,
      border: "1px solid var(--border-subtle)",
      background: "var(--surface)"
    },
    target: "_blank",
    rel: "noopener noreferrer"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "strong",
    style: {
      fontSize: 13
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    className: "muted",
    style: {
      fontSize: 12
    }
  }, d)), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      color: "var(--text-3)"
    }
  }, /*#__PURE__*/React.createElement(Icons.External, null)))))));
}
Object.assign(window, {
  PageAgents,
  PageAgentDetail,
  PageServices,
  PageInteractions,
  PageEvidence,
  PageSettings,
  PageDocs
});
