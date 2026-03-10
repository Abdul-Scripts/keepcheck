"use client";

import {
  ChangeEvent,
  useEffect,
  KeyboardEvent,
  SyntheticEvent,
  useRef,
  useState,
} from "react";
import { CheckRecord } from "@/types/check";
import { generateId } from "@/utils/id";

type CheckFormProps = {
  onAddCheck: (check: CheckRecord) => void;
  existingRecipients?: string[];
  suggestedCheckNumber?: string;
};

export default function CheckForm({
  onAddCheck,
  existingRecipients = [],
  suggestedCheckNumber = "",
}: CheckFormProps) {
  const [form, setForm] = useState({
    checkNumber: "",
    recipient: "",
    amount: "",
    issueDate: "",
    memo: "",
  });

  const [image, setImage] = useState<string>("");
  const [dateDigits, setDateDigits] = useState("");
  const [amountDigits, setAmountDigits] = useState("");
  const [isDateFocused, setIsDateFocused] = useState(false);
  const [isAmountFocused, setIsAmountFocused] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const [showRecipientSuggestions, setShowRecipientSuggestions] = useState(false);
  const [showCheckNumberSuggestion, setShowCheckNumberSuggestion] = useState(false);
  const recipientBlurTimerRef = useRef<number | null>(null);
  const checkNumberBlurTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const normalizedRecipients = Array.from(
    new Set(
      existingRecipients
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    )
  );
  const recipientSuggestions = normalizedRecipients
    .filter((company) =>
      company.toLowerCase().startsWith(form.recipient.trim().toLowerCase())
    )
    .slice(0, 6);
  const normalizedSuggestedCheckNumber = suggestedCheckNumber.replace(/\D/g, "");
  const shouldShowCheckNumberSuggestion =
    showCheckNumberSuggestion &&
    normalizedSuggestedCheckNumber.length > 0 &&
    form.checkNumber !== normalizedSuggestedCheckNumber &&
    (form.checkNumber.length === 0 ||
      normalizedSuggestedCheckNumber.startsWith(form.checkNumber));

  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    if (name === "checkNumber") {
      setForm((prev) => ({ ...prev, checkNumber: value.replace(/\D/g, "") }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleRecipientChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, recipient: value }));
    setShowRecipientSuggestions(true);
  }

  function handleRecipientFocus() {
    if (recipientBlurTimerRef.current) {
      window.clearTimeout(recipientBlurTimerRef.current);
      recipientBlurTimerRef.current = null;
    }
    setShowRecipientSuggestions(true);
  }

  function handleRecipientBlur() {
    recipientBlurTimerRef.current = window.setTimeout(() => {
      setShowRecipientSuggestions(false);
      recipientBlurTimerRef.current = null;
    }, 120);
  }

  function selectRecipient(recipient: string) {
    setForm((prev) => ({ ...prev, recipient }));
    setShowRecipientSuggestions(false);
  }

  function handleCheckNumberChange(e: ChangeEvent<HTMLInputElement>) {
    const nextValue = e.target.value.replace(/\D/g, "");
    setForm((prev) => ({ ...prev, checkNumber: nextValue }));
    setShowCheckNumberSuggestion(true);
  }

  function handleCheckNumberFocus() {
    if (checkNumberBlurTimerRef.current) {
      window.clearTimeout(checkNumberBlurTimerRef.current);
      checkNumberBlurTimerRef.current = null;
    }
    setShowCheckNumberSuggestion(true);
  }

  function handleCheckNumberBlur() {
    checkNumberBlurTimerRef.current = window.setTimeout(() => {
      setShowCheckNumberSuggestion(false);
      checkNumberBlurTimerRef.current = null;
    }, 120);
  }

  function selectCheckNumber(value: string) {
    setForm((prev) => ({ ...prev, checkNumber: value }));
    setShowCheckNumberSuggestion(false);
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;
      setIsCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setCameraError("Camera access failed. Please allow camera permissions.");
      setIsCameraOpen(false);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  }

  function captureFromCamera() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    setImage(canvas.toDataURL("image/jpeg", 0.9));
    stopCamera();
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recipientBlurTimerRef.current) {
        window.clearTimeout(recipientBlurTimerRef.current);
      }
      if (checkNumberBlurTimerRef.current) {
        window.clearTimeout(checkNumberBlurTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const body = document.body;
    if (isCameraOpen) {
      body.classList.add("camera-capture-open");
    } else {
      body.classList.remove("camera-capture-open");
    }

    return () => {
      body.classList.remove("camera-capture-open");
    };
  }, [isCameraOpen]);

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.issueDate) {
      alert("Please enter a valid issue date.");
      return;
    }

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
    setDateDigits("");
    setAmountDigits("");
    setIsAmountFocused(false);
    setImage("");
    setCameraError("");
    stopCamera();
  }

  function getMaskedDateValue(digits: string) {
    const mask = ["M", "M", "/", "D", "D", "/", "Y", "Y", "Y", "Y"];
    const slots = [0, 1, 3, 4, 6, 7, 8, 9];

    digits.split("").forEach((digit, i) => {
      if (slots[i] !== undefined) {
        mask[slots[i]] = digit;
      }
    });

    return mask.join("");
  }

  function parseIsoFromDigits(digits: string) {
    if (digits.length !== 8) return "";

    const month = Number(digits.slice(0, 2));
    const day = Number(digits.slice(2, 4));
    const year = Number(digits.slice(4, 8));

    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
      return "";
    }

    const asDate = new Date(year, month - 1, day);
    if (
      asDate.getFullYear() !== year ||
      asDate.getMonth() !== month - 1 ||
      asDate.getDate() !== day
    ) {
      return "";
    }

    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function handleDateTextChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    setDateDigits(digits);
    setForm((prev) => ({ ...prev, issueDate: parseIsoFromDigits(digits) }));
  }

  function formatCurrencyFromDigits(digits: string) {
    if (!digits) return "";
    const numeric = Number(digits) / 100;
    return numeric.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function handleAmountChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    setAmountDigits(digits);
    setForm((prev) => ({
      ...prev,
      amount: digits ? (Number(digits) / 100).toFixed(2) : "",
    }));
  }

  function handleAmountKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace" && e.key !== "Delete") return;
    if (amountDigits.length === 0) return;

    e.preventDefault();
    const nextDigits = amountDigits.slice(0, -1);
    setAmountDigits(nextDigits);
    setForm((prev) => ({
      ...prev,
      amount: nextDigits ? (Number(nextDigits) / 100).toFixed(2) : "",
    }));
  }

  function handleDateKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace" && e.key !== "Delete") return;
    if (dateDigits.length === 0) return;

    e.preventDefault();
    const nextDigits =
      e.key === "Delete"
        ? dateDigits.slice(0, -1)
        : dateDigits.slice(0, -1);

    setDateDigits(nextDigits);
    setForm((prev) => ({ ...prev, issueDate: parseIsoFromDigits(nextDigits) }));
  }

  function handlePickerChange(e: ChangeEvent<HTMLInputElement>) {
    const isoDate = e.target.value;
    setForm((prev) => ({ ...prev, issueDate: isoDate }));
    if (!isoDate) {
      setDateDigits("");
      return;
    }

    const [year, month, day] = isoDate.split("-");
    if (!year || !month || !day) return;
    setDateDigits(`${month}${day}${year}`);
  }

  return (
    <>
      <form onSubmit={handleSubmit} style={formStyle}>
      <div style={recipientFieldWrapStyle}>
        <input
          name="recipient"
          placeholder="Company"
          value={form.recipient}
          onChange={handleRecipientChange}
          onFocus={handleRecipientFocus}
          onBlur={handleRecipientBlur}
          autoComplete="off"
          style={inputStyle}
          required
        />

        {showRecipientSuggestions &&
        form.recipient.trim().length > 0 &&
        recipientSuggestions.length > 0 ? (
          <div style={recipientDropdownStyle}>
            {recipientSuggestions.map((company) => (
              <button
                key={company}
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectRecipient(company);
                }}
                style={recipientSuggestionButtonStyle}
              >
                {company}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div style={rowFieldsStyle}>
        <div style={checkNumberFieldWrapStyle}>
          <input
            name="checkNumber"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Check Number"
            value={form.checkNumber}
            onChange={handleCheckNumberChange}
            onFocus={handleCheckNumberFocus}
            onBlur={handleCheckNumberBlur}
            autoComplete="off"
            style={inputStyle}
            required
          />

          {shouldShowCheckNumberSuggestion ? (
            <div style={checkNumberDropdownStyle}>
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectCheckNumber(normalizedSuggestedCheckNumber);
                }}
                style={checkNumberSuggestionButtonStyle}
              >
                {normalizedSuggestedCheckNumber}
              </button>
            </div>
          ) : null}
        </div>

        <input
          name="amount"
          type="text"
          inputMode="numeric"
          placeholder="Amount"
          value={
            !isAmountFocused && amountDigits.length === 0
              ? ""
              : formatCurrencyFromDigits(amountDigits || "0")
          }
          onChange={handleAmountChange}
          onKeyDown={handleAmountKeyDown}
          onFocus={() => setIsAmountFocused(true)}
          onBlur={() => setIsAmountFocused(false)}
          style={inputStyle}
          required
        />
      </div>

      <div style={dateFieldWrapStyle}>
        <input
          name="issueDateText"
          type="text"
          inputMode="numeric"
          value={
            !isDateFocused && dateDigits.length === 0
              ? ""
              : getMaskedDateValue(dateDigits)
          }
          placeholder="Issue Date"
          onChange={handleDateTextChange}
          onKeyDown={handleDateKeyDown}
          onFocus={() => setIsDateFocused(true)}
          onBlur={() => setIsDateFocused(false)}
          aria-label="Issue Date"
          style={dateTextInputStyle}
        />
        <div aria-label="Open calendar" style={calendarButtonStyle}>
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={calendarIconStyle}
          >
            <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
            <path d="M3.5 9.5h17" />
            <path d="M8 3.8v3.4" />
            <path d="M16 3.8v3.4" />
            <rect x="7.4" y="12.2" width="3" height="3" rx="0.6" />
          </svg>
          <input
            type="date"
            value={form.issueDate}
            onChange={handlePickerChange}
            tabIndex={-1}
            style={calendarPickerInputStyle}
          />
        </div>
      </div>

      <textarea
        name="memo"
        placeholder="Memo / Notes"
        value={form.memo}
        onChange={handleChange}
        rows={4}
        style={textAreaStyle}
      />

      <div style={uploadLabelStyle}>
        <span style={uploadLabelTextStyle}>Attach Check Image (Optional)</span>
        <button type="button" onClick={startCamera} style={cameraButtonStyle}>
          Open Camera
        </button>
        {cameraError ? <p style={cameraErrorStyle}>{cameraError}</p> : null}
      </div>

      {image && (
        <img
          src={image}
          alt="Check preview"
          style={previewStyle}
        />
      )}

      <button type="submit" style={saveButtonStyle}>
        Save Check
      </button>
      </form>

      {isCameraOpen ? (
        <div style={cameraOverlayStyle}>
          <video ref={videoRef} playsInline muted style={cameraFullVideoStyle} />

          <div style={cameraHudStyle}>
            <p style={cameraTitleStyle}>Align the check in the dotted frame</p>

            <div style={checkGuideFrameStyle}>
              <div style={checkGuideInnerStyle} />
            </div>

            <div style={cameraActionsStyle}>
              <button
                type="button"
                onClick={captureFromCamera}
                style={captureButtonStyle}
              >
                Capture
              </button>
              <button type="button" onClick={stopCamera} style={cancelCameraStyle}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const formStyle: React.CSSProperties = {
  width: "100%",
  display: "grid",
  gap: "0.9rem",
  marginTop: "1.25rem",
  marginBottom: "1.8rem",
  padding: "1.05rem",
  border: "1px solid rgba(147, 197, 253, 0.7)",
  borderRadius: 16,
  background: "rgba(255, 255, 255, 0.78)",
  boxShadow: "0 12px 28px rgba(15, 23, 42, 0.08)",
};

const rowFieldsStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.75rem",
};

const checkNumberFieldWrapStyle: React.CSSProperties = {
  position: "relative",
};

const recipientFieldWrapStyle: React.CSSProperties = {
  position: "relative",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  border: "1px solid #93C5FD",
  borderRadius: 12,
  padding: "0.8rem 0.85rem",
  background: "#FFFFFF",
  color: "#0F172A",
  fontSize: "1rem",
};

const recipientDropdownStyle: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: "calc(100% + 0.3rem)",
  zIndex: 30,
  borderRadius: 12,
  border: "1px solid rgba(147, 197, 253, 0.9)",
  background: "rgba(255,255,255,0.98)",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
  overflow: "hidden",
};

const recipientSuggestionButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderBottom: "1px solid rgba(226, 232, 240, 0.9)",
  background: "transparent",
  color: "#0F172A",
  textAlign: "left",
  padding: "0.7rem 0.85rem",
  fontSize: "0.94rem",
  cursor: "pointer",
};

const checkNumberDropdownStyle: React.CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  top: "calc(100% + 0.3rem)",
  zIndex: 30,
  borderRadius: 12,
  border: "1px solid rgba(147, 197, 253, 0.9)",
  background: "rgba(255,255,255,0.98)",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.14)",
  overflow: "hidden",
};

const checkNumberSuggestionButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  background: "transparent",
  color: "#0F172A",
  textAlign: "left",
  padding: "0.7rem 0.85rem",
  fontSize: "0.94rem",
  cursor: "pointer",
};

const dateInputStyle: React.CSSProperties = {
  ...inputStyle,
  maxWidth: "100%",
  display: "block",
  WebkitAppearance: "none",
  appearance: "none",
};

const dateFieldWrapStyle: React.CSSProperties = {
  position: "relative",
};

const dateTextInputStyle: React.CSSProperties = {
  ...dateInputStyle,
  paddingRight: "2.8rem",
};

const calendarButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: "0.45rem",
  transform: "translateY(-50%)",
  border: "none",
  background: "transparent",
  width: "2rem",
  height: "2rem",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const calendarIconStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  stroke: "#0F172A",
  fill: "none",
  strokeWidth: 1.9,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  opacity: 0.95,
};

const calendarPickerInputStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: 0,
  width: "100%",
  height: "100%",
  cursor: "pointer",
  border: "none",
  WebkitAppearance: "none",
  appearance: "none",
};

const textAreaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: "vertical",
};

const uploadLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.4rem",
  padding: "0.65rem 0.75rem",
  border: "1px dashed #93C5FD",
  borderRadius: 12,
  background: "rgba(239, 246, 255, 0.7)",
};

const uploadLabelTextStyle: React.CSSProperties = {
  color: "#334155",
  fontSize: "0.93rem",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
};

const cameraButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.7)",
  borderRadius: 10,
  padding: "0.6rem 0.85rem",
  background: "rgba(255,255,255,0.84)",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.9rem",
  letterSpacing: "0.3px",
  cursor: "pointer",
};

const cameraOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1200,
  background: "#0B1220",
};

const cameraFullVideoStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const cameraHudStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  padding:
    "calc(env(safe-area-inset-top) + 1rem) 1rem calc(env(safe-area-inset-bottom) + 1.1rem) 1rem",
  boxSizing: "border-box",
  background:
    "linear-gradient(180deg, rgba(15,23,42,0.55) 0%, rgba(15,23,42,0.1) 30%, rgba(15,23,42,0.1) 70%, rgba(15,23,42,0.6) 100%)",
};

const cameraTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#E2E8F0",
  textAlign: "center",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1.04rem",
  letterSpacing: "0.3px",
};

const checkGuideFrameStyle: React.CSSProperties = {
  alignSelf: "center",
  justifySelf: "center",
  width: "min(92vw, 720px)",
  aspectRatio: "3 / 1.25",
  borderRadius: 16,
  border: "2px dashed rgba(219, 234, 254, 0.95)",
  boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.28)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const checkGuideInnerStyle: React.CSSProperties = {
  width: "94%",
  height: "82%",
  borderRadius: 12,
  border: "1.5px dashed rgba(191, 219, 254, 0.7)",
};

const cameraActionsStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "0.5rem",
};

const captureButtonStyle: React.CSSProperties = {
  ...cameraButtonStyle,
};

const cancelCameraStyle: React.CSSProperties = {
  border: "1px solid #93C5FD",
  borderRadius: 10,
  padding: "0.6rem 0.85rem",
  background: "#FFFFFF",
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.9rem",
  cursor: "pointer",
};

const cameraErrorStyle: React.CSSProperties = {
  margin: 0,
  color: "#B91C1C",
  fontSize: "0.82rem",
};

const previewStyle: React.CSSProperties = {
  width: "min(100%, 320px)",
  borderRadius: 12,
  border: "1px solid #93C5FD",
};

const saveButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 12,
  padding: "0.9rem 1rem",
  background: "linear-gradient(135deg, #0F172A, #1E3A8A)",
  color: "#F8FAFC",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1rem",
  letterSpacing: "0.3px",
  cursor: "pointer",
};
