"use client";

import CheckCard from "@/components/CheckCard";
import { CheckRecord } from "@/types/check";

type CheckListProps = {
  checks: CheckRecord[];
  onEdit: (check: CheckRecord) => void;
};

export default function CheckList({ checks, onEdit }: CheckListProps) {
  return (
    <section style={sectionStyle}>
      {checks.length === 0 ? (
        <p style={emptyStyle}>No checks saved yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {checks.map((check) => (
            <CheckCard key={check.id} check={check} onEdit={onEdit} />
          ))}
        </div>
      )}
    </section>
  );
}

const sectionStyle: React.CSSProperties = {
  marginTop: "0.2rem",
};

const emptyStyle: React.CSSProperties = {
  margin: "0.4rem 0 0 0",
  color: "#475569",
  fontSize: "0.98rem",
};
