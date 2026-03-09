"use client";

type DashboardSummaryProps = {
  pendingCount: number;
  pendingAmount: number;
};

export default function DashboardSummary({
  pendingCount,
  pendingAmount,
}: DashboardSummaryProps) {
  return (
    <section
      style={{
        display: "grid",
        gap: "1rem",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        marginTop: "1.5rem",
        marginBottom: "2rem",
      }}
    >
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: "1rem",
          background: "#fff",
        }}
      >
        <p style={{ margin: 0, color: "#666" }}>Checks Yet to Clear</p>
        <h2 style={{ margin: "0.5rem 0 0 0" }}>{pendingCount}</h2>
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 16,
          padding: "1rem",
          background: "#fff",
        }}
      >
        <p style={{ margin: 0, color: "#666" }}>Pending Amount</p>
        <h2 style={{ margin: "0.5rem 0 0 0" }}>
          ${pendingAmount.toFixed(2)}
        </h2>
      </div>
    </section>
  );
}