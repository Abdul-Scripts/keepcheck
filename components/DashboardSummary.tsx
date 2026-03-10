"use client";

import { assetPath } from "@/lib/assetPath";

type DashboardSummaryProps = {
  pendingCount: number;
  clearedCount: number;
  pendingAmount: number;
};

export default function DashboardSummary({
  pendingCount,
  clearedCount,
  pendingAmount,
}: DashboardSummaryProps) {
  const formattedPendingAmount = pendingAmount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const cardStyle: React.CSSProperties = {
    position: "relative",
    border: "1px solid rgba(147, 197, 253, 0.7)",
    borderRadius: 20,
    padding: "1.4rem 1.25rem",
    background: "#fff",
    boxShadow: "0 10px 24px rgba(15, 23, 42, 0.12)",
  };

  const labelStyle: React.CSSProperties = {
    margin: 0,
    color: "#334155",
    fontSize: "0.92rem",
    fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
    letterSpacing: "0.4px",
  };

  const valueStyle: React.CSSProperties = {
    margin: "0.7rem 0 0 0",
    color: "#0f172a",
    fontSize: "3.3rem",
    lineHeight: 1,
    fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  };

  const pendingCardStyle: React.CSSProperties = {
    ...cardStyle,
    paddingBottom: "2.6rem",
    overflow: "visible",
  };

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.1rem",
        marginTop: "1.5rem",
        marginBottom: "2rem",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: "1.1rem",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        <div style={cardStyle}>
          <p style={labelStyle}>Pending Checks</p>
          <h2 style={valueStyle}>{pendingCount}</h2>
        </div>

        <div style={cardStyle}>
          <p style={labelStyle}>Cleared Checks</p>
          <h2 style={valueStyle}>{clearedCount}</h2>
        </div>
      </div>

      <div style={pendingCardStyle}>
        <p style={labelStyle}>Pending Amount</p>
        <h2 style={valueStyle}>{formattedPendingAmount}</h2>
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: -28,
            bottom: -32,
            width: 111,
            height: 78,
            opacity: 0.95,
            pointerEvents: "none",
          }}
        >
          <svg viewBox="0 0 84 56" width="100%" height="100%">
            <ellipse cx="50" cy="28" rx="15" ry="5.6" fill="#C98E0B" />
            <rect x="35" y="20" width="30" height="8" rx="2" fill="#C98E0B" />
            <ellipse cx="50" cy="20" rx="15" ry="5.6" fill="#F2C24D" />

            <ellipse cx="28" cy="34" rx="18" ry="6.5" fill="#D99D18" />
            <rect x="10" y="25" width="36" height="10" rx="2" fill="#D99D18" />
            <ellipse cx="28" cy="25" rx="18" ry="6.5" fill="#FFD25E" />
          </svg>
        </div>
        <img
          src={assetPath("/cash.png")}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            right: -16,
            bottom: -24,
            width: 104,
            height: "auto",
            opacity: 0.95,
            pointerEvents: "none",
            userSelect: "none",
          }}
        />
      </div>
    </section>
  );
}
