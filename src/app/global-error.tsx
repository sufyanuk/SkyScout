"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#f7f8fb", color: "#0b1324" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 28 }}>SkyScout is temporarily unavailable</h1>
          <p style={{ color: "#5d6679" }}>Please try again in a moment.</p>
          <button onClick={reset} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 999, border: 0, background: "#2348f0", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
