import { ImageResponse } from "next/og";
import { getDestination } from "@/lib/catalog/destinations";

export const alt = "Cheap flights on SkyScout";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function DestinationOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const d = getDestination((await params).slug);
  const from = d?.art.from ?? "#93c5fd";
  const to = d?.art.to ?? "#1e3a8a";
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
          background: `linear-gradient(160deg, ${to} 0%, ${from} 100%)`,
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, fontWeight: 700 }}>SkyScout</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 30, opacity: 0.9, textTransform: "uppercase", letterSpacing: 6 }}>{d?.country ?? "Destination"}</div>
          <div style={{ fontSize: 120, fontWeight: 800, letterSpacing: -4, lineHeight: 1.05 }}>{d?.city ?? "Explore"}</div>
          <div style={{ fontSize: 38, opacity: 0.95, marginTop: 12 }}>{d ? `${d.tagline} · Cheap flights & travel guide` : "Cheap flights"}</div>
        </div>
      </div>
    ),
    size,
  );
}
