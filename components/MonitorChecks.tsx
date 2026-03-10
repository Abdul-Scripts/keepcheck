"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckRecord } from "@/types/check";

type MonitorChecksProps = {
  checks: CheckRecord[];
  onMarkCleared: (id: string) => void;
};

function toLocalMidnight(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatAmount(amount: string) {
  const num = Number(amount);
  if (Number.isNaN(num)) return "$0.00";

  return num.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value: string) {
  const parsed = toLocalMidnight(value);
  if (!parsed) return value;
  return parsed.toLocaleDateString("en-US");
}

export default function MonitorChecks({
  checks,
  onMarkCleared,
}: MonitorChecksProps) {
  const router = useRouter();
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [dismissingIds, setDismissingIds] = useState<string[]>([]);
  const timeoutRefs = useRef<number[]>([]);

  const now = new Date();
  const currentMonthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).getTime();

  const pendingChecks = checks
    .filter((check) => {
      if (check.status === "cleared") return false;
      const issueDate = toLocalMidnight(check.issueDate);
      if (!issueDate) return false;
      return issueDate.getTime() >= currentMonthStart;
    })
    .sort((a, b) => {
      const dateA = toLocalMidnight(a.issueDate);
      const dateB = toLocalMidnight(b.issueDate);
      if (!dateA || !dateB) return 0;
      return dateA.getTime() - dateB.getTime();
    });

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach((id) => window.clearTimeout(id));
      timeoutRefs.current = [];
    };
  }, []);

  function handleClearClick(id: string) {
    if (dismissingIds.includes(id) || checkedIds.includes(id)) return;

    setCheckedIds((prev) => [...prev, id]);

    const startDismissId = window.setTimeout(() => {
      setDismissingIds((prev) => [...prev, id]);
    }, 170);

    const clearId = window.setTimeout(() => {
      onMarkCleared(id);
      setCheckedIds((prev) => prev.filter((currentId) => currentId !== id));
      setDismissingIds((prev) => prev.filter((currentId) => currentId !== id));
      timeoutRefs.current = timeoutRefs.current.filter(
        (x) => x !== startDismissId && x !== clearId
      );
    }, 430);

    timeoutRefs.current.push(startDismissId, clearId);
  }

  return (
    <section style={sectionStyle}>
      <h2 style={headingStyle}>Pending Checks</h2>

      {pendingChecks.length === 0 ? (
        <p style={emptyNoteStyle}>No pending checks.</p>
      ) : (
        <>
          <p style={subtextStyle}>Have any of these checks cleared?</p>

          <div style={listStyle}>
            {pendingChecks.map((check) => (
              <article
                key={check.id}
                style={{
                  ...rowStyle,
                  ...(dismissingIds.includes(check.id) ? rowDismissingStyle : null),
                }}
              >
                <div style={rowMainStyle}>
                  <p style={companyStyle}>{check.recipient}</p>
                  <p style={metaStyle}>
                    {formatAmount(check.amount)} • {formatDate(check.issueDate)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleClearClick(check.id)}
                  disabled={
                    dismissingIds.includes(check.id) || checkedIds.includes(check.id)
                  }
                  style={clearCheckboxButtonStyle}
                  aria-label={`Mark check for ${check.recipient} as cleared`}
                  title="Mark as cleared"
                >
                  <span
                    style={{
                      ...clearCheckboxInnerStyle,
                      ...(checkedIds.includes(check.id)
                        ? clearCheckboxInnerCheckedStyle
                        : null),
                    }}
                    aria-hidden="true"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      style={{
                        ...clearCheckboxCheckStyle,
                        ...(checkedIds.includes(check.id)
                          ? clearCheckboxCheckVisibleStyle
                          : null),
                      }}
                    >
                      <path d="M6 12.5l4 4 8-9" />
                    </svg>
                  </span>
                </button>
              </article>
            ))}
          </div>
        </>
      )}

      <div style={viewAllWrapStyle}>
        <button
          type="button"
          onClick={() => router.push("/checks/")}
          style={viewAllButtonStyle}
        >
          View All Checks
        </button>
      </div>
    </section>
  );
}

const sectionStyle: React.CSSProperties = {
  marginTop: "0.25rem",
  marginBottom: "1.6rem",
};

const headingStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "2rem",
  letterSpacing: "0.6px",
};

const subtextStyle: React.CSSProperties = {
  margin: "0.45rem 0 0.95rem 0",
  color: "#334155",
  fontSize: "1rem",
};

const emptyNoteStyle: React.CSSProperties = {
  margin: "3.3rem 0 2.6rem 0",
  color: "#334155",
  fontSize: "1rem",
  textAlign: "center",
  opacity: 0.72,
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.7rem",
};

const viewAllWrapStyle: React.CSSProperties = {
  marginTop: "1.9rem",
  display: "flex",
  justifyContent: "center",
};

const viewAllButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.7)",
  borderRadius: 11,
  padding: "0.62rem 1rem",
  background: "rgba(255,255,255,0.84)",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.92rem",
  letterSpacing: "0.3px",
  cursor: "pointer",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.8rem",
  padding: "0.8rem 0.9rem",
  borderRadius: 14,
  border: "1px solid #BFDBFE",
  background: "rgba(255,255,255,0.78)",
  transition: "opacity 240ms ease, transform 240ms ease, max-height 240ms ease, margin 240ms ease, padding 240ms ease",
  transformOrigin: "center",
  maxHeight: 140,
};

const rowDismissingStyle: React.CSSProperties = {
  opacity: 0,
  transform: "translateX(12px) scale(0.98)",
  maxHeight: 0,
  marginTop: 0,
  marginBottom: 0,
  paddingTop: 0,
  paddingBottom: 0,
  overflow: "hidden",
};

const rowMainStyle: React.CSSProperties = {
  minWidth: 0,
};

const companyStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1.08rem",
  letterSpacing: "0.2px",
};

const metaStyle: React.CSSProperties = {
  margin: "0.15rem 0 0 0",
  color: "#475569",
  fontSize: "0.95rem",
};

const clearCheckboxButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  border: "none",
  background: "transparent",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const clearCheckboxInnerStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: 6,
  border: "2px solid #1E3A8A",
  background: "rgba(255,255,255,0.85)",
  boxSizing: "border-box",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 180ms ease, border-color 180ms ease",
};

const clearCheckboxInnerCheckedStyle: React.CSSProperties = {
  background: "rgba(191, 219, 254, 0.85)",
  borderColor: "#1E3A8A",
};

const clearCheckboxCheckStyle: React.CSSProperties = {
  width: 13,
  height: 13,
  stroke: "#1E3A8A",
  fill: "none",
  strokeWidth: 2.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  opacity: 0,
  transform: "scale(0.7)",
  transition: "opacity 170ms ease, transform 170ms ease",
};

const clearCheckboxCheckVisibleStyle: React.CSSProperties = {
  opacity: 1,
  transform: "scale(1)",
};
