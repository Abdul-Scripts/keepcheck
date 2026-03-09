
"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { UserProfile } from "@/types/profile";

type OnboardingFormProps = {
  onComplete: (profile: UserProfile) => void;
};

export default function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [form, setForm] = useState({
    name: "",
    businessName: "",
  });

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    onComplete({
      name: form.name.trim(),
      businessName: form.businessName.trim(),
    });
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "min(100%, 480px)",
          display: "grid",
          gap: "1rem",
          padding: "2rem",
          border: "1px solid #ddd",
          borderRadius: 20,
          background: "#fff",
          boxShadow: "0 12px 32px rgba(0,0,0,0.08)",
        }}
      >
        <div>
          <h1 style={{ marginBottom: "0.5rem" }}>Welcome to KeepCheck</h1>
          <p style={{ margin: 0, color: "#666" }}>
            Let’s set up your workspace.
          </p>
        </div>

        <input
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          required
        />

        <input
          name="businessName"
          placeholder="Business Name"
          value={form.businessName}
          onChange={handleChange}
          required
        />

        <button type="submit">Continue</button>
      </form>
    </main>
  );
}