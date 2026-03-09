import { ImageResponse } from "next/og";

export const alt = "BillBook – Invoicing & Billing Management";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e3a5f 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Logo mark */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "40px" }}>
        <div
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "18px",
            background: "#3b82f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: "36px", fontWeight: "800", color: "white" }}>B</span>
        </div>
        <span
          style={{ fontSize: "44px", fontWeight: "700", color: "white", letterSpacing: "-1px" }}
        >
          BillBook
        </span>
      </div>

      {/* Headline */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: "60px",
          fontWeight: "700",
          color: "white",
          lineHeight: 1.1,
          marginBottom: "28px",
          letterSpacing: "-1px",
        }}
      >
        <span>Make billing feel</span>
        <span style={{ color: "#60a5fa" }}>effortless.</span>
      </div>

      {/* Subtext */}
      <div style={{ fontSize: "26px", color: "#94a3b8", maxWidth: "800px" }}>
        GST-ready invoicing, compliance exports &amp; audit trails — all in one platform.
      </div>

      {/* Badges */}
      <div style={{ display: "flex", gap: "16px", marginTop: "40px" }}>
        {["Free to start", "GST-ready", "Audit logs", "Mobile-friendly"].map((badge) => (
          <div
            key={badge}
            style={{
              background: "rgba(59, 130, 246, 0.15)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "100px",
              padding: "8px 20px",
              fontSize: "18px",
              color: "#93c5fd",
            }}
          >
            {badge}
          </div>
        ))}
      </div>
    </div>,
    { ...size },
  );
}
