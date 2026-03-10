
"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { UserProfile } from "@/types/profile";

type OnboardingFormProps = {
  onComplete: (profile: UserProfile) => void;
};

export default function OnboardingForm({ onComplete }: OnboardingFormProps) {
  const [form, setForm] = useState({
    name: "",
    businessName: "",
  });

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscrollBehavior = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscrollBehavior;
    };
  }, []);

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
    <main style={screenStyle}>
      <form onSubmit={handleSubmit} style={cardStyle}>
        <div>
          <h1 style={headingStyle}>
            Welcome to <span style={keepCheckWordStyle}>KeepCheck</span>
          </h1>
          <p style={subtextStyle}>
            Let’s set up your workspace.
          </p>
        </div>

        <input
          name="name"
          placeholder="Your Name"
          value={form.name}
          onChange={handleChange}
          style={inputStyle}
          required
        />

        <input
          name="businessName"
          placeholder="Business Name"
          value={form.businessName}
          onChange={handleChange}
          style={inputStyle}
          required
        />

        <button type="submit" style={buttonStyle}>Continue</button>
      </form>
    </main>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: "100dvh",
  width: "100%",
  boxSizing: "border-box",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "2rem",
  background: "transparent",
};

const cardStyle: React.CSSProperties = {
  width: "min(100%, 500px)",
  display: "grid",
  gap: "1rem",
  padding: "2rem",
  transform: "translateY(-5vh)",
  border: "1px solid rgba(15, 23, 42, 0.12)",
  borderRadius: 24,
  background: "rgba(255, 255, 255, 0.92)",
  boxShadow: "0 20px 46px rgba(15, 23, 42, 0.16)",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
};

const headingStyle: React.CSSProperties = {
  margin: "0 0 0.5rem 0",
  color: "#60A5FA",
  fontSize: "1.75rem",
  fontWeight: 800,
  lineHeight: 1.2,
};

const keepCheckWordStyle: React.CSSProperties = {
  color: "#0F172A",
  fontSize: "2.35rem",
  letterSpacing: "0.4px",
};

const subtextStyle: React.CSSProperties = {
  margin: 0,
  color: "#334155",
  lineHeight: 1.5,
  fontSize: "1rem",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #94A3B8",
  borderRadius: 12,
  padding: "0.85rem 0.95rem",
  background: "#ffffff",
  color: "#0F172A",
  fontSize: "1rem",
  fontWeight: 500,
  outline: "none",
};

const buttonStyle: React.CSSProperties = {
  marginTop: "0.25rem",
  border: "none",
  borderRadius: 12,
  padding: "0.9rem 1rem",
  background: "linear-gradient(135deg, #0F172A, #1E293B)",
  color: "#F8FAFC",
  fontSize: "1rem",
  fontWeight: 700,
  cursor: "pointer",
};
