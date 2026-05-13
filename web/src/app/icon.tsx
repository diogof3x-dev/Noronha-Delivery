import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FF6B35",
          borderRadius: "16px",
        }}
      >
        <svg viewBox="0 0 24 24" width="40" height="40" fill="white">
          <circle cx="17.5" cy="6.2" r="2.1" opacity="0.95" />
          <path d="M3.4 17.5 L8.9 6.8 L14.4 17.5 Z" />
          <path d="M10.5 17.5 L15 9.6 L19.5 17.5 Z" opacity="0.7" />
          <path
            d="M2 19.6 Q5 18.4 8.5 19.6 T15.5 19.6 T22 19.6"
            stroke="white"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
            opacity="0.95"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
