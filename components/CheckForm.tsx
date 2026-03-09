"use client";

import { ChangeEvent, SyntheticEvent, useState } from "react";
import { CheckRecord } from "@/types/check";
import { generateId } from "@/utils/id";

type CheckFormProps = {
  onAddCheck: (check: CheckRecord) => void;
};

export default function CheckForm({ onAddCheck }: CheckFormProps) {
  const [form, setForm] = useState({
    checkNumber: "",
    recipient: "",
    amount: "",
    issueDate: "",
    memo: "",
  });

  const [image, setImage] = useState<string>("");

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    const newCheck: CheckRecord = {
      id: generateId(),
      checkNumber: form.checkNumber,
      recipient: form.recipient,
      amount: form.amount,
      issueDate: form.issueDate,
      memo: form.memo,
      image,
      status: "pending",
    };

    onAddCheck(newCheck);

    setForm({
      checkNumber: "",
      recipient: "",
      amount: "",
      issueDate: "",
      memo: "",
    });
    setImage("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "grid",
        gap: "0.75rem",
        marginTop: "1.5rem",
        marginBottom: "2rem",
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: 12,
      }}
    >
      <input
        name="checkNumber"
        placeholder="Check Number"
        value={form.checkNumber}
        onChange={handleChange}
        required
      />

      <input
        name="recipient"
        placeholder="Company"
        value={form.recipient}
        onChange={handleChange}
        required
      />

      <input
        name="amount"
        type="number"
        step="0.01"
        placeholder="Amount"
        value={form.amount}
        onChange={handleChange}
        required
      />

      <input
        name="issueDate"
        type="date"
        value={form.issueDate}
        onChange={handleChange}
        required
      />

      <textarea
        name="memo"
        placeholder="Memo / Notes"
        value={form.memo}
        onChange={handleChange}
        rows={4}
      />

      <input type="file" accept="image/*" onChange={handleImageChange} />

      {image && (
        <img
          src={image}
          alt="Check preview"
          style={{
            width: 220,
            borderRadius: 8,
            border: "1px solid #ccc",
          }}
        />
      )}

      <button type="submit">Save Check</button>
    </form>
  );
}