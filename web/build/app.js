const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "comfortable",
  "accent": "terracotta",
  "dashboardLayout": "cards",
  "paymentDetail": "drawer",
  "evidenceViz": "checklist",
  "agentRoi": "multi",
  "opsAlertStyle": "banner"
} /*EDITMODE-END*/;
function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const updateTweak = React.useCallback(patch => {
    Object.entries(patch).forEach(([key, value]) => setTweak(key, value));
  }, [setTweak]);
  const [page, setPage] = React.useState("dashboard");
  const [selectedPayment, setSelectedPayment] = React.useState(null);
  const [selectedAgent, setSelectedAgent] = React.useState(null);
  const [data, setData] = React.useState(window.EMPTY_DATA);
  const [loadState, setLoadState] = React.useState({
    loading: true,
    error: null
  });
  React.useEffect(() => {
    document.body.dataset.theme = tweaks.theme;
    document.body.dataset.density = tweaks.density;
    document.body.dataset.accent = tweaks.accent;
  }, [tweaks.theme, tweaks.density, tweaks.accent]);
  const refreshData = React.useCallback(async () => {
    setLoadState({
      loading: true,
      error: null
    });
    try {
      const next = await window.loadLiveData();
      setData(next);
      setLoadState({
        loading: false,
        error: null
      });
    } catch (error) {
      setData({
        ...window.EMPTY_DATA,
        meta: {
          ...window.EMPTY_DATA.meta,
          error: error instanceof Error ? error.message : String(error)
        }
      });
      setLoadState({
        loading: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, []);
  React.useEffect(() => {
    void refreshData();
  }, [refreshData]);
  const openPayment = p => setSelectedPayment(p);
  const closePayment = () => setSelectedPayment(null);
  const nav = id => {
    setSelectedAgent(null);
    setPage(id);
  };
  window.MOCK = data;
  const opsHealth = data.meta?.opsHealth || "worker_attention";
  let crumb = null;
  let content;
  if (page === "dashboard") content = /*#__PURE__*/React.createElement(PageDashboard, {
    layoutVariant: tweaks.dashboardLayout,
    onNavigate: nav,
    onOpenPayment: openPayment,
    loadState: loadState
  });else if (page === "payments") content = /*#__PURE__*/React.createElement(PagePayments, {
    onOpenPayment: openPayment,
    selectedId: selectedPayment?.id
  });else if (page === "agents") {
    if (selectedAgent) {
      crumb = "에이전트 / " + fmt.addr(selectedAgent.address);
      content = /*#__PURE__*/React.createElement(PageAgentDetail, {
        agent: selectedAgent,
        roiVariant: tweaks.agentRoi,
        onBack: () => setSelectedAgent(null)
      });
    } else content = /*#__PURE__*/React.createElement(PageAgents, {
      onOpen: a => setSelectedAgent(a)
    });
  } else if (page === "services") content = /*#__PURE__*/React.createElement(PageServices, null);else if (page === "interactions") content = /*#__PURE__*/React.createElement(PageInteractions, null);else if (page === "evidence") content = /*#__PURE__*/React.createElement(PageEvidence, {
    evidenceVariant: tweaks.evidenceViz
  });else if (page === "operations") content = /*#__PURE__*/React.createElement(PageOperations, {
    alertStyle: tweaks.opsAlertStyle,
    alertVariant: opsHealth,
    onRefresh: refreshData
  });else if (page === "settings") content = /*#__PURE__*/React.createElement(PageSettings, null);else if (page === "docs") content = /*#__PURE__*/React.createElement(PageDocs, null);
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement(Sidebar, {
    page: page,
    setPage: nav,
    opsHealth: opsHealth
  }), /*#__PURE__*/React.createElement(TopBar, {
    page: page,
    crumb: crumb,
    onNav: nav,
    onRefresh: refreshData,
    loading: loadState.loading
  }), /*#__PURE__*/React.createElement("main", {
    className: "main"
  }, content), selectedPayment && /*#__PURE__*/React.createElement(PaymentDrawer, {
    payment: selectedPayment,
    onClose: closePayment,
    variant: tweaks.paymentDetail
  }), /*#__PURE__*/React.createElement(TweaksPanel, {
    title: "\uD654\uBA74 \uC870\uC815",
    defaultPosition: {
      right: 20,
      bottom: 20
    }
  }, /*#__PURE__*/React.createElement(TweakSection, {
    label: "\uD654\uBA74"
  }, /*#__PURE__*/React.createElement(TweakRadio, {
    label: "\uD14C\uB9C8",
    value: tweaks.theme,
    options: [{
      value: "dark",
      label: "다크"
    }, {
      value: "light",
      label: "라이트"
    }],
    onChange: v => updateTweak({
      theme: v
    })
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "\uBC00\uB3C4",
    value: tweaks.density,
    options: [{
      value: "comfortable",
      label: "기본"
    }, {
      value: "compact",
      label: "촘촘"
    }],
    onChange: v => updateTweak({
      density: v
    })
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "\uAC15\uC870\uC0C9",
    value: tweaks.accent,
    options: [{
      value: "terracotta",
      label: "테라코타"
    }, {
      value: "blue",
      label: "Base 블루"
    }, {
      value: "neutral",
      label: "중립"
    }],
    onChange: v => updateTweak({
      accent: v
    })
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "\uC6B4\uC601 \uD45C\uC2DC"
  }, /*#__PURE__*/React.createElement(TweakRadio, {
    label: "\uACBD\uACE0 \uBC29\uC2DD",
    value: tweaks.opsAlertStyle,
    options: [{
      value: "banner",
      label: "배너"
    }, {
      value: "pills",
      label: "필"
    }, {
      value: "sidebar",
      label: "사이드"
    }],
    onChange: v => updateTweak({
      opsAlertStyle: v
    })
  })), /*#__PURE__*/React.createElement(TweakSection, {
    label: "\uBCC0\uD615"
  }, /*#__PURE__*/React.createElement(TweakRadio, {
    label: "\uB300\uC2DC\uBCF4\uB4DC",
    value: tweaks.dashboardLayout,
    options: [{
      value: "cards",
      label: "카드"
    }, {
      value: "row",
      label: "한 줄"
    }],
    onChange: v => updateTweak({
      dashboardLayout: v
    })
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "\uACB0\uC81C \uC0C1\uC138",
    value: tweaks.paymentDetail,
    options: [{
      value: "drawer",
      label: "드로어"
    }, {
      value: "page",
      label: "전체"
    }],
    onChange: v => updateTweak({
      paymentDetail: v
    })
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "\uC99D\uAC70 \uD45C\uC2DC",
    value: tweaks.evidenceViz,
    options: [{
      value: "checklist",
      label: "체크"
    }, {
      value: "bar",
      label: "바"
    }, {
      value: "radar",
      label: "레이더"
    }],
    onChange: v => updateTweak({
      evidenceViz: v
    })
  }), /*#__PURE__*/React.createElement(TweakRadio, {
    label: "\uC5D0\uC774\uC804\uD2B8 ROI",
    value: tweaks.agentRoi,
    options: [{
      value: "single",
      label: "단일"
    }, {
      value: "multi",
      label: "복수"
    }],
    onChange: v => updateTweak({
      agentRoi: v
    })
  }))));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
