"use client";

import { useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import { CheckRecord } from "@/types/check";

type CheckCardProps = {
  check: CheckRecord;
  onEdit: (check: CheckRecord) => void;
  signatureName?: string;
};

export default function CheckCard({
  check,
  onEdit,
  signatureName = "KeepCheck",
}: CheckCardProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);
  const statusIsCleared = check.status === "cleared";
  const displayDate = formatUsDate(check.issueDate);
  const displayAmount = formatCurrency(check.amount);
  const displayAmountWords = amountToWords(check.amount);

  return (
    <>
      <article style={cardStyle}>
        <div style={checkBodyStyle}>
          <div style={checkTopRowStyle}>
            <p style={recipientStyle}>{check.recipient}</p>
            <p style={dateStyle}>{displayDate}</p>
          </div>

          <div style={checkMiddleRowStyle}>
            <p style={amountWordsStyle}>{displayAmountWords}</p>
            <p style={amountNumericStyle}>{displayAmount}</p>
          </div>

          <div style={checkBottomRowStyle}>
            <p style={checkNumberStyle}>Check #{check.checkNumber}</p>

            <div style={signatureWrapStyle}>
              <p style={signatureTextStyle}>{signatureName}</p>
              <span style={signatureLineStyle} />
            </div>
          </div>
        </div>

        <div style={infoBlockStyle}>
          <div style={metaRowStyle}>
            <span
              style={{
                ...statusStyle,
                ...(statusIsCleared ? clearedStatusStyle : pendingStatusStyle),
              }}
            >
              {statusIsCleared ? "Cleared" : "Pending"}
            </span>
            <p style={memoStyle}>
              <strong>Memo:</strong> {check.memo || "—"}
            </p>
          </div>

          {check.image ? (
            <div style={imageDetailsStyle}>
              <button
                type="button"
                onClick={() => setIsImageOpen((prev) => !prev)}
                style={imageToggleButtonStyle}
                aria-expanded={isImageOpen}
                aria-controls={`check-image-${check.id}`}
              >
                <span>Check Image</span>
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  style={{
                    ...dropdownIconStyle,
                    transform: isImageOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <path d="M7 10l5 5 5-5" />
                </svg>
              </button>

              <div
                id={`check-image-${check.id}`}
                style={{
                  ...imagePanelStyle,
                  maxHeight: isImageOpen ? 380 : 0,
                  opacity: isImageOpen ? 1 : 0,
                  marginTop: isImageOpen ? "0.6rem" : 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsImagePreviewOpen(true)}
                  style={imagePreviewButtonStyle}
                  aria-label={`Open image preview for check ${check.checkNumber}`}
                >
                  <img
                    src={check.image}
                    alt={`Check ${check.checkNumber}`}
                    style={imageStyle}
                  />
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div style={actionRowStyle}>
          <button type="button" onClick={() => onEdit(check)} style={editButtonStyle}>
            Edit
          </button>
        </div>
      </article>

      {check.image && isImagePreviewOpen ? (
        <ImageLightbox
          open={isImagePreviewOpen}
          src={check.image}
          alt={`Check ${check.checkNumber} enlarged preview`}
          onClose={() => setIsImagePreviewOpen(false)}
        />
      ) : null}
    </>
  );
}

function formatUsDate(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${month}/${day}/${year}`;
}

function formatCurrency(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount)) return "$0.00";

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function amountToWords(value: string) {
  const amount = Number(value);
  if (Number.isNaN(amount) || amount < 0) return "Zero dollars";

  const dollars = Math.floor(amount);
  const cents = Math.round((amount - dollars) * 100);

  const dollarsWords = numberToWords(dollars);
  if (cents === 0) return `${capitalize(dollarsWords)} dollars only`;

  const centsWords = numberToWords(cents);
  return `${capitalize(dollarsWords)} dollars and ${centsWords} cents`;
}

function numberToWords(num: number): string {
  if (num === 0) return "zero";

  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
  ];
  const teens = [
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];
  const scales = ["", "thousand", "million", "billion"];

  function chunkToWords(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    const parts: string[] = [];

    if (hundred > 0) {
      parts.push(`${ones[hundred]} hundred`);
    }

    if (remainder >= 10 && remainder < 20) {
      parts.push(teens[remainder - 10]);
    } else {
      const ten = Math.floor(remainder / 10);
      const one = remainder % 10;
      if (ten > 0) parts.push(tens[ten]);
      if (one > 0) parts.push(ones[one]);
    }

    return parts.join(" ");
  }

  let remaining = num;
  let scaleIndex = 0;
  const words: string[] = [];

  while (remaining > 0) {
    const chunk = remaining % 1000;
    if (chunk > 0) {
      const chunkWords = chunkToWords(chunk);
      const scale = scales[scaleIndex];
      words.unshift(scale ? `${chunkWords} ${scale}` : chunkWords);
    }
    remaining = Math.floor(remaining / 1000);
    scaleIndex += 1;
  }

  return words.join(" ");
}

function capitalize(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const cardStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.7)",
  borderRadius: 18,
  padding: "0.9rem",
  background: "rgba(255,255,255,0.84)",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
};

const checkBodyStyle: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid rgba(59, 130, 246, 0.38)",
  background:
    "linear-gradient(160deg, rgba(239,246,255,0.98) 0%, rgba(219,234,254,0.96) 55%, rgba(191,219,254,0.9) 100%)",
  boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.45)",
  padding: "0.85rem 0.9rem",
  display: "grid",
  gap: "0.78rem",
};

const checkTopRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "0.8rem",
  alignItems: "baseline",
  borderBottom: "1px dashed rgba(30, 58, 138, 0.22)",
  paddingBottom: "0.45rem",
};

const recipientStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1.08rem",
  letterSpacing: "0.2px",
};

const dateStyle: React.CSSProperties = {
  margin: 0,
  color: "#1E3A8A",
  fontSize: "0.92rem",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
};

const checkMiddleRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr auto",
  gap: "0.8rem",
  alignItems: "start",
};

const amountWordsStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontSize: "0.82rem",
  lineHeight: 1.35,
  fontStyle: "italic",
};

const amountNumericStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1.1rem",
  whiteSpace: "nowrap",
};

const checkBottomRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "0.9rem",
  alignItems: "end",
};

const checkNumberStyle: React.CSSProperties = {
  margin: 0,
  color: "#1E293B",
  fontSize: "0.86rem",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  whiteSpace: "nowrap",
};

const signatureWrapStyle: React.CSSProperties = {
  display: "grid",
  justifyItems: "end",
};

const signatureTextStyle: React.CSSProperties = {
  margin: 0,
  color: "#1E3A8A",
  fontFamily: "cursive",
  fontSize: "1rem",
  lineHeight: 1.1,
};

const signatureLineStyle: React.CSSProperties = {
  width: "min(100%, 230px)",
  borderTop: "1px solid rgba(15, 23, 42, 0.45)",
  marginTop: "0.2rem",
};

const infoBlockStyle: React.CSSProperties = {
  marginTop: "0.72rem",
  display: "grid",
  gap: "0.65rem",
};

const metaRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: "0.65rem",
  alignItems: "center",
};

const statusStyle: React.CSSProperties = {
  borderRadius: 999,
  padding: "0.28rem 0.62rem",
  fontSize: "0.78rem",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  letterSpacing: "0.2px",
};

const pendingStatusStyle: React.CSSProperties = {
  background: "rgba(251, 191, 36, 0.2)",
  color: "#92400E",
};

const clearedStatusStyle: React.CSSProperties = {
  background: "rgba(16, 185, 129, 0.2)",
  color: "#065F46",
};

const memoStyle: React.CSSProperties = {
  margin: 0,
  color: "#334155",
  fontSize: "0.9rem",
  minWidth: 0,
};

const imageDetailsStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.8)",
  borderRadius: 10,
  background: "rgba(255,255,255,0.8)",
  padding: "0.45rem 0.55rem",
};

const imageToggleButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.55rem",
  cursor: "pointer",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.84rem",
  textAlign: "left",
};

const dropdownIconStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  flexShrink: 0,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  transition: "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
};

const imagePanelStyle: React.CSSProperties = {
  overflow: "hidden",
  transition:
    "max-height 260ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 220ms ease, margin-top 220ms ease",
};

const imageStyle: React.CSSProperties = {
  width: "min(100%, 340px)",
  borderRadius: 12,
  border: "1px solid #93C5FD",
  display: "block",
};

const imagePreviewButtonStyle: React.CSSProperties = {
  border: "none",
  background: "transparent",
  padding: 0,
  cursor: "zoom-in",
  borderRadius: 12,
};

const actionRowStyle: React.CSSProperties = {
  marginTop: "0.8rem",
  display: "flex",
  gap: "0.5rem",
};

const editButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.8)",
  borderRadius: 10,
  padding: "0.5rem 0.8rem",
  background: "rgba(255, 255, 255, 0.92)",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.85rem",
  cursor: "pointer",
};
