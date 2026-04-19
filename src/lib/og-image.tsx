export const OG_SIZE = {
  width: 1200,
  height: 630,
} as const;

export const OG_ALT =
  "a11ymind AI social preview showing accessibility monitoring, CI checks, and AI fixes.";

export function MarketingOgCard() {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        position: "relative",
        background:
          "radial-gradient(circle at top left, rgba(14,165,233,0.28), transparent 34%), radial-gradient(circle at top right, rgba(168,85,247,0.18), transparent 26%), linear-gradient(180deg, #0b0f14 0%, #111827 100%)",
        color: "#f8fafc",
        padding: "56px",
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "20px",
          borderRadius: "28px",
          border: "1px solid rgba(148,163,184,0.12)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "22px", maxWidth: "760px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              fontSize: "22px",
              color: "#93c5fd",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "999px",
                background: "#22d3ee",
                boxShadow: "0 0 18px rgba(34,211,238,0.8)",
              }}
            />
            a11ymind AI
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              fontWeight: 700,
              letterSpacing: "-0.045em",
              lineHeight: 1.03,
              fontSize: "68px",
            }}
          >
            <div>Catch accessibility risks</div>
            <div style={{ color: "#7dd3fc" }}>before they turn into regressions.</div>
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: "760px",
              fontSize: "28px",
              lineHeight: 1.35,
              color: "#cbd5e1",
            }}
          >
            Scan live pages, monitor saved sites, generate AI fixes, and share reports teams can actually act on.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "32px" }}>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", maxWidth: "650px" }}>
            {[
              "Accessibility monitoring",
              "CI checks",
              "AI fixes",
              "Client-ready reports",
            ].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 18px",
                  borderRadius: "999px",
                  border: "1px solid rgba(148,163,184,0.22)",
                  background: "rgba(15,23,42,0.65)",
                  color: "#e2e8f0",
                  fontSize: "22px",
                }}
              >
                {label}
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "300px",
              minHeight: "188px",
              borderRadius: "24px",
              border: "1px solid rgba(148,163,184,0.18)",
              background: "rgba(15,23,42,0.82)",
              padding: "22px",
            }}
          >
            <div style={{ fontSize: "16px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.16em" }}>
              Report preview
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginTop: "16px" }}>
              <div style={{ fontSize: "64px", fontWeight: 700, color: "#f8fafc" }}>84</div>
              <div style={{ fontSize: "20px", color: "#94a3b8" }}>/ 100</div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <MetricPill color="#ef4444" label="3 critical" />
              <MetricPill color="#f59e0b" label="5 serious" />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <MetricPill color="#22c55e" label="+12 score" />
              <MetricPill color="#22d3ee" label="AI fixes ready" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricPill({ color, label }: { color: string; label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "9px 12px",
        borderRadius: "999px",
        background: "rgba(2,6,23,0.55)",
        border: "1px solid rgba(148,163,184,0.14)",
        fontSize: "16px",
        color: "#e2e8f0",
      }}
    >
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "999px",
          background: color,
        }}
      />
      {label}
    </div>
  );
}
