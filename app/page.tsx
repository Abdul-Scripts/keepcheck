"use client";

import { useEffect, useState } from "react";
import CheckForm from "@/components/CheckForm";
import CheckList from "@/components/CheckList";
import { CheckRecord } from "@/types/check";

const STORAGE_KEY = "keepcheck-records";

export default function Page() {
  const [checks, setChecks] = useState<CheckRecord[]>(() => {
    if (typeof window === "undefined") return [];

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    try {
      return JSON.parse(saved) as CheckRecord[];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
  }, [checks]);

  function addCheck(check: CheckRecord) {
    if (checks.some((c) => c.checkNumber === check.checkNumber)) {
      alert("This check number already exists.");
      return;
    }

    setChecks((prev) => [check, ...prev]);
  }

  function deleteCheck(id: string) {
    setChecks((prev) => prev.filter((check) => check.id !== id));
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
      <h1>KeepCheck</h1>
      <p>Track and store your issued business checks locally.</p>

      <CheckForm onAddCheck={addCheck} />
      <CheckList checks={checks} onDelete={deleteCheck} />
    </main>
  );
}