"use client";

import CheckCard from "@/components/CheckCard";
import { CheckRecord } from "@/types/check";

type CheckListProps = {
  checks: CheckRecord[];
  onDelete: (id: string) => void;
};

export default function CheckList({ checks, onDelete }: CheckListProps) {
  return (
    <section>
      <h2>Saved Checks</h2>

      {checks.length === 0 ? (
        <p>No checks saved yet.</p>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {checks.map((check) => (
            <CheckCard key={check.id} check={check} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  );
}