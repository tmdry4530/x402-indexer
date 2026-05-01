const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "density": "comfortable",
  "accent": "terracotta",
  "dashboardLayout": "cards",
  "paymentDetail": "drawer",
  "evidenceViz": "checklist",
  "agentRoi": "multi",
  "opsAlertStyle": "banner"
}/*EDITMODE-END*/;

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const updateTweak = React.useCallback((patch) => {
    Object.entries(patch).forEach(([key, value]) => setTweak(key, value));
  }, [setTweak]);
  const [page, setPage] = React.useState("dashboard");
  const [selectedPayment, setSelectedPayment] = React.useState(null);
  const [selectedAgent, setSelectedAgent] = React.useState(null);
  const [data, setData] = React.useState(window.EMPTY_DATA);
  const [loadState, setLoadState] = React.useState({ loading: true, error: null });

  React.useEffect(() => {
    document.body.dataset.theme = tweaks.theme;
    document.body.dataset.density = tweaks.density;
    document.body.dataset.accent = tweaks.accent;
  }, [tweaks.theme, tweaks.density, tweaks.accent]);

  const refreshData = React.useCallback(async () => {
    setLoadState({ loading: true, error: null });
    try {
      const next = await window.loadLiveData();
      setData(next);
      setLoadState({ loading: false, error: null });
    } catch (error) {
      setData({
        ...window.EMPTY_DATA,
        meta: {
          ...window.EMPTY_DATA.meta,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      setLoadState({ loading: false, error: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  React.useEffect(() => {
    void refreshData();
  }, [refreshData]);

  const openPayment = (p) => setSelectedPayment(p);
  const closePayment = () => setSelectedPayment(null);

  const nav = (id) => {
    setSelectedAgent(null);
    setPage(id);
  };

  window.MOCK = data;
  const opsHealth = data.meta?.opsHealth || "worker_attention";

  let crumb = null;
  let content;
  if (page === "dashboard") content = <PageDashboard layoutVariant={tweaks.dashboardLayout} onNavigate={nav} onOpenPayment={openPayment} loadState={loadState}/>;
  else if (page === "payments") content = <PagePayments onOpenPayment={openPayment} selectedId={selectedPayment?.id}/>;
  else if (page === "agents") {
    if (selectedAgent) { crumb = "에이전트 / " + fmt.addr(selectedAgent.address); content = <PageAgentDetail agent={selectedAgent} roiVariant={tweaks.agentRoi} onBack={() => setSelectedAgent(null)}/>; }
    else content = <PageAgents onOpen={(a) => setSelectedAgent(a)}/>;
  }
  else if (page === "services") content = <PageServices/>;
  else if (page === "interactions") content = <PageInteractions/>;
  else if (page === "evidence") content = <PageEvidence evidenceVariant={tweaks.evidenceViz}/>;
  else if (page === "operations") content = <PageOperations alertStyle={tweaks.opsAlertStyle} alertVariant={opsHealth} onRefresh={refreshData}/>;
  else if (page === "settings") content = <PageSettings/>;
  else if (page === "docs") content = <PageDocs/>;

  return (
    <div className="app">
      <Sidebar page={page} setPage={nav} opsHealth={opsHealth}/>
      <TopBar page={page} crumb={crumb} onNav={nav} onRefresh={refreshData} loading={loadState.loading}/>
      <main className="main">{content}</main>

      {selectedPayment && <PaymentDrawer payment={selectedPayment} onClose={closePayment} variant={tweaks.paymentDetail}/>}

      <TweaksPanel title="화면 조정" defaultPosition={{right: 20, bottom: 20}}>
        <TweakSection label="화면">
          <TweakRadio label="테마" value={tweaks.theme} options={[{value: "dark", label: "다크"}, {value: "light", label: "라이트"}]} onChange={v => updateTweak({theme: v})}/>
          <TweakRadio label="밀도" value={tweaks.density} options={[{value: "comfortable", label: "기본"}, {value: "compact", label: "촘촘"}]} onChange={v => updateTweak({density: v})}/>
          <TweakRadio label="강조색" value={tweaks.accent} options={[{value: "terracotta", label: "테라코타"}, {value: "blue", label: "Base 블루"}, {value: "neutral", label: "중립"}]} onChange={v => updateTweak({accent: v})}/>
        </TweakSection>
        <TweakSection label="운영 표시">
          <TweakRadio label="경고 방식" value={tweaks.opsAlertStyle} options={[{value: "banner", label: "배너"}, {value: "pills", label: "필"}, {value: "sidebar", label: "사이드"}]} onChange={v => updateTweak({opsAlertStyle: v})}/>
        </TweakSection>
        <TweakSection label="변형">
          <TweakRadio label="대시보드" value={tweaks.dashboardLayout} options={[{value: "cards", label: "카드"}, {value: "row", label: "한 줄"}]} onChange={v => updateTweak({dashboardLayout: v})}/>
          <TweakRadio label="결제 상세" value={tweaks.paymentDetail} options={[{value: "drawer", label: "드로어"}, {value: "page", label: "전체"}]} onChange={v => updateTweak({paymentDetail: v})}/>
          <TweakRadio label="증거 표시" value={tweaks.evidenceViz} options={[{value: "checklist", label: "체크"}, {value: "bar", label: "바"}, {value: "radar", label: "레이더"}]} onChange={v => updateTweak({evidenceViz: v})}/>
          <TweakRadio label="에이전트 ROI" value={tweaks.agentRoi} options={[{value: "single", label: "단일"}, {value: "multi", label: "복수"}]} onChange={v => updateTweak({agentRoi: v})}/>
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
