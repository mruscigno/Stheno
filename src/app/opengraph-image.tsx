import { ImageResponse } from "next/og";
export const alt = "STHENO Fitness — Your fitness. Handled.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", background: "#080909", color: "#f7f3e9", padding: "68px 76px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 520, height: 520, borderRadius: 520, background: "#caa25225", right: -90, top: -170, display: "flex" }} />
      <div style={{ position: "absolute", width: 470, height: 470, border: "2px solid #d5ae5b55", borderRadius: 470, right: -10, bottom: -290, display: "flex" }} />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 58, height: 58, border: "2px solid #d7b66e", color: "#e5c67f", fontFamily: "serif", fontSize: 38 }}>S</div>
          <div style={{ display: "flex", flexDirection: "column", letterSpacing: 7, fontWeight: 800, fontSize: 22 }}>STHENO<span style={{ color: "#e5c67f", fontSize: 10, letterSpacing: 8 }}>FITNESS</span></div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "serif", fontSize: 88, lineHeight: 0.95, letterSpacing: -4 }}><div style={{ display: "flex" }}>YOUR FITNESS.</div><div style={{ display: "flex", color: "#e1bd6d" }}>HANDLED.</div></div>
          <div style={{ marginTop: 34, fontSize: 24, color: "#c5c4bd", letterSpacing: 1 }}>Personalized training · nutrition · coaching</div>
        </div>
      </div>
    </div>, { ...size },
  );
}
