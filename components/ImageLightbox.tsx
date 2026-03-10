"use client";

import { useEffect } from "react";

type ImageLightboxProps = {
  open: boolean;
  src: string;
  alt: string;
  onClose: () => void;
};

export default function ImageLightbox({
  open,
  src,
  alt,
  onClose,
}: ImageLightboxProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={overlayStyle}
      onClick={onClose}
    >
      <button type="button" onClick={onClose} style={backButtonStyle}>
        Back
      </button>
      <div style={imageViewportStyle}>
        <img
          src={src}
          alt={alt}
          style={imageStyle}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2200,
  background: "rgba(2, 6, 23, 0.76)",
  display: "grid",
  placeItems: "center",
  padding: "1rem",
  boxSizing: "border-box",
};

const backButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "max(0.85rem, env(safe-area-inset-top))",
  left: "0.85rem",
  zIndex: 2,
  border: "1px solid rgba(191, 219, 254, 0.65)",
  borderRadius: 999,
  padding: "0.42rem 0.88rem",
  background: "rgba(255, 255, 255, 0.95)",
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.84rem",
  cursor: "pointer",
};

const imageViewportStyle: React.CSSProperties = {
  width: "min(100%, 1080px)",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  overflow: "visible",
  padding:
    "calc(max(3.2rem, env(safe-area-inset-top)) + 0.35rem) max(0.8rem, env(safe-area-inset-right)) max(1rem, env(safe-area-inset-bottom)) max(0.8rem, env(safe-area-inset-left))",
  boxSizing: "border-box",
};

const imageStyle: React.CSSProperties = {
  display: "block",
  width: "auto",
  height: "auto",
  maxWidth: "100%",
  maxHeight: "100%",
  objectFit: "contain",
  borderRadius: 14,
  border: "1.5px solid rgba(147, 197, 253, 0.9)",
  boxShadow: "0 14px 28px rgba(30, 58, 138, 0.22)",
  userSelect: "none",
};
