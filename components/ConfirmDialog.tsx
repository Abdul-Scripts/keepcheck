"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      style={{
        ...overlayStyle,
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      aria-hidden={!open}
    >
      <div
        style={{
          ...cardStyle,
          opacity: open ? 1 : 0,
          transform: open ? "translateY(0) scale(1)" : "translateY(10px) scale(0.98)",
        }}
      >
        <h2 style={titleStyle}>{title}</h2>
        <p style={messageStyle}>{message}</p>
        <div style={actionsStyle}>
          <button type="button" onClick={onCancel} style={cancelStyle}>
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} style={confirmStyle}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1300,
  background: "rgba(15, 23, 42, 0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  transition: "opacity 220ms ease",
};

const cardStyle: React.CSSProperties = {
  width: "min(92vw, 420px)",
  borderRadius: 16,
  border: "1px solid rgba(147, 197, 253, 0.8)",
  background: "rgba(255,255,255,0.98)",
  boxShadow: "0 20px 42px rgba(15, 23, 42, 0.22)",
  padding: "1rem",
  transition: "opacity 220ms ease, transform 220ms ease",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1.15rem",
};

const messageStyle: React.CSSProperties = {
  margin: "0.55rem 0 0 0",
  color: "#334155",
  lineHeight: 1.45,
};

const actionsStyle: React.CSSProperties = {
  marginTop: "1rem",
  display: "flex",
  justifyContent: "flex-end",
  gap: "0.5rem",
};

const cancelStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.8)",
  borderRadius: 10,
  padding: "0.54rem 0.85rem",
  background: "rgba(255,255,255,0.9)",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const confirmStyle: React.CSSProperties = {
  border: "1px solid rgba(239, 68, 68, 0.62)",
  borderRadius: 10,
  padding: "0.54rem 0.85rem",
  background: "rgba(254, 242, 242, 0.95)",
  color: "#B91C1C",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.85rem",
  cursor: "pointer",
};
