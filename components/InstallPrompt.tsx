"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function InstallPrompt() {
  const [isIOS] = useState(() => {
    if (typeof window === "undefined") return false;

    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream
    );
  });

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [step, setStep] = useState<"intro" | "ios-guide">("intro");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  function goToIosGuide() {
    setIsClosing(true);

    window.setTimeout(() => {
      setStep("ios-guide");
      setIsClosing(false);
    }, 260);
  }

  const isIntro = step === "intro";

  return (
    <div style={screenStyle}>
      <div
        style={{
          ...backdropStyle,
          animation: isClosing
            ? "fadeOut 0.26s ease forwards"
            : "fadeIn 0.35s ease-out",
        }}
      />

      {isIntro ? (
        <div
          style={{
            ...cardStyle,
            animation: isClosing
              ? "modalOut 0.26s ease forwards"
              : "modalIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          <div style={iconStyle}>✓</div>

          <h1 style={titleStyle}>Install KeepCheck</h1>

          <p style={textStyle}>
            KeepCheck must be added to your Home Screen before you continue.
          </p>

          {deferredPrompt ? (
            <button onClick={handleInstallClick} style={primaryButtonStyle}>
              Install App
            </button>
          ) : isIOS ? (
            <button onClick={goToIosGuide} style={primaryButtonStyle}>
              Show Me How
            </button>
          ) : (
            <p style={textStyle}>
              Open this in a supported browser that allows installation.
            </p>
          )}
        </div>
      ) : (
        <div
          style={{
            ...guideOverlayStyle,
            animation: isClosing
              ? "fadeOut 0.26s ease forwards"
              : "fadeIn 0.35s ease-out",
          }}
        >
          <div style={guideTextBoxStyle}>
            <p style={guideTextStyle}>
              Tap the Share button{" "}
              <img
                src="/ios-share-icon.svg"
                alt="Share"
                style={inlineIconStyle}
              />{" "}
              in Safari, then choose &apos;Add to Home Screen&apos;{" "}
              <img
                src="/plus-square.svg"
                alt="Add to Home Screen"
                style={inlineIconStyle}
              />
            </p>
          </div>

          <div style={arrowContainerStyle}>
            <div style={arrowShaftStyle} />
            <div style={arrowHeadStyle} />
          </div>

          <div style={bottomInstructionStyle}>
            <p style={bottomTextStyle}>
              After installing, open KeepCheck from your Home Screen to
              continue.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const screenStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const backdropStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0, 0, 0, 0.55)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
};

const cardStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "min(92vw, 480px)",
  margin: "1rem",
  padding: "2rem 1.5rem",
  borderRadius: "24px",
  background: "#ffffff",
  boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
  textAlign: "center",
  opacity: 1,
  transform: "translateY(0) scale(1)",
};

const iconStyle: React.CSSProperties = {
  width: "72px",
  height: "72px",
  margin: "0 auto 1rem auto",
  borderRadius: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "2rem",
  fontWeight: 700,
  background: "linear-gradient(135deg, #111827, #374151)",
  color: "#fff",
};

const titleStyle: React.CSSProperties = {
  margin: "0 0 0.75rem 0",
  fontSize: "1.8rem",
  fontWeight: 700,
  color: "#111827",
};

const textStyle: React.CSSProperties = {
  margin: "0 0 1.25rem 0",
  lineHeight: 1.6,
  color: "#4b5563",
  fontSize: "1rem",
};

const primaryButtonStyle: React.CSSProperties = {
  width: "100%",
  border: "none",
  borderRadius: "14px",
  padding: "0.95rem 1rem",
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  background: "#111827",
  color: "#fff",
};

const guideOverlayStyle: React.CSSProperties = {
  position: "relative",
  zIndex: 2,
  width: "100%",
  height: "100%",
};

const guideTextBoxStyle: React.CSSProperties = {
  position: "absolute",
  top: "6rem",
  left: "50%",
  transform: "translateX(-50%)",
  width: "min(88vw, 420px)",
  padding: "1rem 1.1rem",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.96)",
  boxShadow: "0 12px 30px rgba(0,0,0,0.16)",
  textAlign: "center",
};

const guideTextStyle: React.CSSProperties = {
  margin: 0,
  lineHeight: 1.6,
  color: "#111827",
  fontSize: "1rem",
};

const arrowContainerStyle: React.CSSProperties = {
  position: "absolute",
  bottom: "3rem",
  left: "50%",
  transform: "translateX(-50%)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  animation: "floatArrow 1.6s ease-in-out infinite",
};

const arrowShaftStyle: React.CSSProperties = {
  width: "4px",
  height: "80px",
  background: "#ffffff",
  borderRadius: "999px",
};

const arrowHeadStyle: React.CSSProperties = {
  width: 0,
  height: 0,
  left: "50%",
  borderLeft: "12px solid transparent",
  borderRight: "12px solid transparent",
  borderTop: "18px solid #ffffff",
  marginTop: "-2px",
};

const bottomInstructionStyle: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  bottom: "18rem",
  transform: "translateX(-50%)",
  width: "min(88vw, 420px)",
  display: "grid",
  gap: "0.9rem",
};

const bottomTextStyle: React.CSSProperties = {
  margin: 0,
  textAlign: "center",
  color: "#ffffff",
  lineHeight: 1.5,
  fontSize: "0.98rem",
};

const inlineIconStyle: React.CSSProperties = {
  display: "inline-block",
  width: "1.15rem",
  height: "1.15rem",
  verticalAlign: "-0.15em",
};