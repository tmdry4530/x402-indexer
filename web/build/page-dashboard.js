// 대시보드 페이지 — 실제 API에서 읽은 결제/증거/운영 요약을 한 화면에 보여준다.

function PageDashboard({
  layoutVariant,
  onNavigate,
  onOpenPayment,
  loadState = {
    loading: false,
    error: null
  }
}) {
  const ov = MOCK.overview;
  const cards = [{
    label: "인덱싱된 결제",
    value: fmt.num(ov.payments_count),
    delta: `${fmt.num(ov.evidence_count)}개 후보 중 승격`,
    deltaCls: "",
    spark: MOCK.daily.map(d => d.payments)
  }, {
    label: "총 결제액",
    value: fmt.usd(ov.total_volume_usd),
    delta: "USDC 정산 금액 합계",
    deltaCls: "",
    spark: MOCK.daily.map(d => d.volume)
  }, {
    label: "가스 비용",
    value: fmt.usd(ov.total_gas_usd),
    delta: `순 ROI ${fmt.usd(ov.net_roi_usd)}`,
    deltaCls: ov.net_roi_usd < 0 ? "down" : "up",
    spark: MOCK.daily.map(d => d.gas)
  }, {
    label: "활성 에이전트",
    value: fmt.num(ov.agents_count),
    delta: `${fmt.num(ov.services_count)}개 서비스로 결제`,
    deltaCls: "",
    spark: null
  }, {
    label: "증거 승격률",
    value: Math.round(ov.promotion_rate * 100) + "%",
    delta: `${fmt.num(ov.payments_count)} / ${fmt.num(ov.evidence_count)} 승격`,
    deltaCls: "",
    spark: null
  }, {
    label: "최신 인덱싱 블록",
    value: fmt.block(ov.latest_indexed_block),
    delta: MOCK.sync.lastCheckpointAgo ? `체크포인트 ${MOCK.sync.lastCheckpointAgo}` : "체크포인트 없음",
    deltaCls: "",
    spark: null
  }];
  const topAgents = [...MOCK.agents].sort((a, b) => b.spent - a.spent).slice(0, 5);
  const topServices = [...MOCK.services].sort((a, b) => b.received - a.received).slice(0, 5);
  const topSvcMax = Math.max(1, ...topServices.map(s => s.received));
  const topAgMax = Math.max(1, ...topAgents.map(a => a.spent));
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    className: "page-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "page-title"
  }, "\uB300\uC2DC\uBCF4\uB4DC"), /*#__PURE__*/React.createElement("div", {
    className: "page-sub"
  }, "Base \uBA54\uC778\uB137\uC5D0\uC11C \uAC10\uC9C0\uD55C x402 \uACB0\uC81C \uD65C\uB3D9\uACFC \uC778\uB371\uC11C \uC0C1\uD0DC\uB97C \uD55C\uB208\uC5D0 \uBD05\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("div", {
    className: "hstack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "seg-tabs",
    "aria-label": "\uC870\uD68C \uAE30\uAC04"
  }, ["24시간", "7일", "14일", "30일"].map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: `seg-tab ${i === 2 ? "active" : ""}`
  }, t))))), loadState.loading && /*#__PURE__*/React.createElement("div", {
    className: "alert-banner info"
  }, /*#__PURE__*/React.createElement(Icons.Info, null), /*#__PURE__*/React.createElement("span", {
    className: "desc"
  }, "API\uC5D0\uC11C \uCD5C\uC2E0 \uC778\uB371\uC2F1 \uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4.")), loadState.error && /*#__PURE__*/React.createElement("div", {
    className: "alert-banner err"
  }, /*#__PURE__*/React.createElement(Icons.Alert, null), /*#__PURE__*/React.createElement("span", {
    className: "desc"
  }, "\uB370\uC774\uD130\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4: ", loadState.error)), layoutVariant === "row" ? /*#__PURE__*/React.createElement("div", {
    className: "kpi-row"
  }, cards.map(c => /*#__PURE__*/React.createElement("div", {
    className: "kpi-cell",
    key: c.label
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, c.label), /*#__PURE__*/React.createElement("span", {
    className: "val"
  }, c.value), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11
    }
  }, c.delta)))) : /*#__PURE__*/React.createElement("div", {
    className: "kpi-grid kpi-grid-dashboard"
  }, cards.map(c => /*#__PURE__*/React.createElement("div", {
    className: "kpi",
    key: c.label
  }, /*#__PURE__*/React.createElement("div", {
    className: "kpi-label"
  }, c.label, c.spark && /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto"
    }
  }, /*#__PURE__*/React.createElement(Spark, {
    data: c.spark,
    color: "var(--chart-1)"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "kpi-value"
  }, c.value), /*#__PURE__*/React.createElement("div", {
    className: `kpi-delta ${c.deltaCls}`
  }, c.delta)))), /*#__PURE__*/React.createElement("div", {
    className: "chart-grid-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uC77C\uBCC4 \uACB0\uC81C \uAE08\uC561"), /*#__PURE__*/React.createElement("div", {
    className: "card-sub"
  }, "\uC77C\uC790\uBCC4 USDC \uC815\uC0B0\uC561\uC785\uB2C8\uB2E4. \uB370\uC774\uD130\uAC00 \uC5C6\uC73C\uBA74 \uBE48 \uADF8\uB798\uD504\uB97C \uD45C\uC2DC\uD569\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("span", {
    className: "badge"
  }, "USD")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement(LineChart, {
    data: MOCK.daily,
    accessor: d => d.volume,
    width: 680,
    height: 180
  }))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uC77C\uBCC4 \uACB0\uC81C \uC218"), /*#__PURE__*/React.createElement("div", {
    className: "card-sub"
  }, "\uB0A0\uC9DC\uBCC4 \uC2B9\uACA9\uB41C payment \uAC1C\uC218"))), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement(BarChart, {
    data: MOCK.daily,
    accessor: d => d.payments,
    width: 340,
    height: 180
  })))), /*#__PURE__*/React.createElement("div", {
    className: "chart-grid-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uC9C0\uCD9C \uC0C1\uC704 \uC5D0\uC774\uC804\uD2B8"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-ghost",
    onClick: () => onNavigate("agents")
  }, "\uC804\uCCB4 \uBCF4\uAE30 ", /*#__PURE__*/React.createElement(Icons.ArrowRight, null))), /*#__PURE__*/React.createElement("div", {
    className: "card-body",
    style: {
      paddingTop: 6
    }
  }, topAgents.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC5D0\uC774\uC804\uD2B8 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uACB0\uC81C\uAC00 \uC2B9\uACA9\uB418\uBA74 payer \uC8FC\uC18C\uBCC4 \uC9D1\uACC4\uAC00 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
  }) : topAgents.map(a => /*#__PURE__*/React.createElement("div", {
    key: a.address,
    className: "bar-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bar-label"
  }, /*#__PURE__*/React.createElement(AddressText, {
    value: a.address
  }), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11
    }
  }, "\xB7 ", a.kind)), /*#__PURE__*/React.createElement("div", {
    className: "bar-val tnum"
  }, fmt.usd(a.spent)), /*#__PURE__*/React.createElement("div", {
    className: "bar-track",
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bar-fill",
    style: {
      width: `${a.spent / topAgMax * 100}%`
    }
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uC218\uC2E0 \uC0C1\uC704 \uC11C\uBE44\uC2A4"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-ghost",
    onClick: () => onNavigate("services")
  }, "\uC804\uCCB4 \uBCF4\uAE30 ", /*#__PURE__*/React.createElement(Icons.ArrowRight, null))), /*#__PURE__*/React.createElement("div", {
    className: "card-body",
    style: {
      paddingTop: 6
    }
  }, topServices.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC11C\uBE44\uC2A4 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "pay_to \uC8FC\uC18C\uB85C \uACB0\uC81C\uAC00 \uB4E4\uC5B4\uC624\uBA74 \uC11C\uBE44\uC2A4\uBCC4 \uC218\uC2E0\uC561\uC744 \uC9D1\uACC4\uD569\uB2C8\uB2E4."
  }) : topServices.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.address,
    className: "bar-row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bar-label"
  }, /*#__PURE__*/React.createElement(AddressText, {
    value: s.address
  }), /*#__PURE__*/React.createElement("span", {
    className: "muted",
    style: {
      fontSize: 11
    }
  }, "\xB7 ", s.name || "이름 없음")), /*#__PURE__*/React.createElement("div", {
    className: "bar-val tnum"
  }, fmt.usd(s.received)), /*#__PURE__*/React.createElement("div", {
    className: "bar-track",
    style: {
      gridColumn: "1 / -1"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "bar-fill",
    style: {
      width: `${s.received / topSvcMax * 100}%`,
      background: "var(--chart-2)"
    }
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "card-title"
  }, "\uCD5C\uADFC \uACB0\uC81C"), /*#__PURE__*/React.createElement("div", {
    className: "card-sub"
  }, "\uAC00\uC7A5 \uCD5C\uADFC\uC5D0 \uC2B9\uACA9\uB41C x402 payment\uC785\uB2C8\uB2E4. \uD589\uC744 \uD074\uB9AD\uD558\uAC70\uB098 Enter\uB85C \uC0C1\uC138\uB97C \uC5FD\uB2C8\uB2E4.")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-ghost",
    onClick: () => onNavigate("payments")
  }, "\uC804\uCCB4 \uBCF4\uAE30 ", /*#__PURE__*/React.createElement(Icons.ArrowRight, null))), MOCK.payments.length === 0 ? /*#__PURE__*/React.createElement(EmptyState, {
    title: "\uC544\uC9C1 \uC2B9\uACA9\uB41C \uACB0\uC81C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4",
    desc: "\uBC31\uD544 \uB610\uB294 \uC2E4\uC2DC\uAC04 \uC6CC\uCEE4\uAC00 x402 \uD6C4\uBCF4\uB97C \uCC3E\uC544 \uC2E0\uB8B0\uB3C4 \uAE30\uC900\uC744 \uB118\uAE30\uBA74 \uC5EC\uAE30\uC5D0 \uD45C\uC2DC\uB429\uB2C8\uB2E4."
  }) : /*#__PURE__*/React.createElement("div", {
    className: "table-wrap table-wrap-flat"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "\uC2DC\uAC04"), /*#__PURE__*/React.createElement("th", null, "Tx"), /*#__PURE__*/React.createElement("th", null, "\uC9C0\uBD88\uC790"), /*#__PURE__*/React.createElement("th", null, "\uC218\uC2E0\uCC98"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uC218\uB7C9"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "USD"), /*#__PURE__*/React.createElement("th", {
    className: "td-right"
  }, "\uC2E0\uB8B0\uB3C4"))), /*#__PURE__*/React.createElement("tbody", null, MOCK.payments.slice(0, 5).map(p => {
    const open = () => onOpenPayment(p);
    return /*#__PURE__*/React.createElement("tr", {
      key: p.id,
      className: "clickable",
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
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(AddressText, {
      value: p.payer
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(AddressText, {
      value: p.payTo
    })), /*#__PURE__*/React.createElement("td", {
      className: "td-num mono"
    }, fmt.usdc(p.amount)), /*#__PURE__*/React.createElement("td", {
      className: "td-num"
    }, fmt.usd(p.amountUsd)), /*#__PURE__*/React.createElement("td", {
      className: "td-right"
    }, /*#__PURE__*/React.createElement(ConfidenceBadge, {
      score: p.confidence
    })));
  }))))));
}
Object.assign(window, {
  PageDashboard
});
