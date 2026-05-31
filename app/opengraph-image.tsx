import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Varsio - Student Platform for University of Toronto";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#002A5C",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              background: "#F0B429",
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "38px",
              fontWeight: 900,
              color: "#002A5C",
            }}
          >
            V
          </div>
          <div style={{ color: "white", fontSize: "56px", fontWeight: 900, letterSpacing: "-2px" }}>
            Varsio
          </div>
        </div>

        <div
          style={{
            color: "rgba(255,255,255,0.95)",
            fontSize: "32px",
            fontWeight: 700,
            textAlign: "center",
            maxWidth: "860px",
            lineHeight: 1.3,
            marginBottom: "28px",
          }}
        >
          The student platform for University of Toronto
        </div>

        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          {["Course Matcher", "AI Study Sessions", "Course Chat", "Student Tools"].map((label) => (
            <div
              key={label}
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.75)",
                fontSize: "18px",
                fontWeight: 600,
                padding: "10px 20px",
                borderRadius: "100px",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "36px",
            color: "rgba(255,255,255,0.35)",
            fontSize: "16px",
            fontWeight: 500,
          }}
        >
          varsio.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
