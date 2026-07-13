import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  const size = 512;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage:
            "linear-gradient(135deg, #1e3a8a 0%, #7c3aed 55%, #9d174d 100%)",
        }}
      >
        <div
          style={{
            fontFamily: "monospace",
            fontWeight: 700,
            fontSize: size * 0.15,
            letterSpacing: size * 0.01,
            color: "#fbbf24",
          }}
        >
          TOP 100
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
