import { ImageResponse } from "next/og";

export const alt = "SkyScout — Find flights worth flying for.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #eef2ff 0%, #f7f8fb 55%, #ffe9e1 100%)",
          color: "#0b1324",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "linear-gradient(135deg,#3b63ff,#1530b8)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", padding: 12 }}>
            <div style={{ width: 18, height: 18, borderRadius: 999, background: "#ff6a3d" }} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 700 }}>SkyScout</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 88, fontWeight: 700, letterSpacing: -3, lineHeight: 1 }}>Find flights worth flying for.</div>
          <div style={{ fontSize: 34, color: "#5d6679", marginTop: 24 }}>Unusually cheap fares and unexpected destinations from your airport.</div>
        </div>
      </div>
    ),
    size,
  );
}
