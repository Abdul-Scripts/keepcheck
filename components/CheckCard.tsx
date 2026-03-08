"use client";

import { CheckRecord } from "@/types/check";

type CheckCardProps = {
  check: CheckRecord;
  onDelete: (id: string) => void;
};

export default function CheckCard({ check, onDelete }: CheckCardProps) {
  return (
    <article
      style={{
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: "1rem",
      }}
    >
      <p>
        <strong>Check #:</strong> {check.checkNumber}
      </p>
      <p>
        <strong>Recipient:</strong> {check.recipient}
      </p>
      <p>
        <strong>Amount:</strong> ${check.amount}
      </p>
      <p>
        <strong>Date:</strong> {check.issueDate}
      </p>
      <p>
        <strong>Memo:</strong> {check.memo || "—"}
      </p>

      {check.image && (
        <img
          src={check.image}
          alt={`Check ${check.checkNumber}`}
          style={{
            width: 220,
            marginTop: "0.75rem",
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
      )}

      <div style={{ marginTop: "1rem" }}>
        <button onClick={() => onDelete(check.id)}>Delete</button>
      </div>
    </article>
  );
}