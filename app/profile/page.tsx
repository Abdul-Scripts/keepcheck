"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import InstallPrompt from "@/components/InstallPrompt";
import OnboardingForm from "@/components/OnboardingForm";
import PageTransition from "@/components/PageTransition";
import { useKeepCheckApp } from "@/hooks/useKeepCheckApp";
import { CheckRecord } from "@/types/check";
import { UserProfile } from "@/types/profile";

type BackupPayload = {
  version: 1;
  exportedAt: string;
  profile: UserProfile;
  checks: CheckRecord[];
};

function isValidStatus(value: unknown): value is "pending" | "cleared" {
  return value === "pending" || value === "cleared";
}

function isValidCheckRecord(value: unknown): value is CheckRecord {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<CheckRecord>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.checkNumber === "string" &&
    typeof candidate.recipient === "string" &&
    typeof candidate.amount === "string" &&
    typeof candidate.issueDate === "string" &&
    (candidate.memo === undefined || typeof candidate.memo === "string") &&
    (candidate.image === undefined || typeof candidate.image === "string") &&
    isValidStatus(candidate.status)
  );
}

function isValidProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UserProfile>;
  return (
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.businessName === "string" &&
    candidate.businessName.trim().length > 0
  );
}

function isValidBackupPayload(value: unknown): value is BackupPayload {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<BackupPayload>;
  return (
    candidate.version === 1 &&
    typeof candidate.exportedAt === "string" &&
    isValidProfile(candidate.profile) &&
    Array.isArray(candidate.checks) &&
    candidate.checks.every(isValidCheckRecord)
  );
}

function checkSignature(check: CheckRecord) {
  return [
    check.id,
    check.checkNumber,
    check.recipient,
    check.amount,
    check.issueDate,
  ].join("|");
}

function mergeChecks(existing: CheckRecord[], incoming: CheckRecord[]) {
  const seen = new Set(existing.map(checkSignature));
  const merged = [...existing];
  incoming.forEach((check) => {
    const signature = checkSignature(check);
    if (!seen.has(signature)) {
      merged.push(check);
      seen.add(signature);
    }
  });
  return merged;
}

export default function ProfilePage() {
  const router = useRouter();
  const {
    isReady,
    isStandalone,
    bootstrapComplete,
    launchNeedsBootstrap,
    profile,
    setProfile,
    checks,
    setChecks,
  } = useKeepCheckApp();

  useEffect(() => {
    if (!isReady || !isStandalone || !profile) return;
    if (!bootstrapComplete || launchNeedsBootstrap) {
      router.replace("/install/");
    }
  }, [isReady, isStandalone, profile, bootstrapComplete, launchNeedsBootstrap, router]);

  if (!isReady) return null;
  if (!isStandalone) return <InstallPrompt />;
  if (!profile) {
    return (
      <OnboardingForm
        onComplete={(nextProfile) => {
          setProfile(nextProfile);
          router.replace("/install/");
        }}
      />
    );
  }
  if (!bootstrapComplete || launchNeedsBootstrap) return null;

  return (
    <ProfileEditor
      profile={profile}
      checks={checks}
      onSaveProfile={setProfile}
      onImportProfile={setProfile}
      onImportChecks={setChecks}
    />
  );
}

type ProfileEditorProps = {
  profile: UserProfile;
  checks: CheckRecord[];
  onSaveProfile: (profile: UserProfile) => void;
  onImportProfile: (profile: UserProfile) => void;
  onImportChecks: (checks: CheckRecord[]) => void;
};

function ProfileEditor({
  profile,
  checks,
  onSaveProfile,
  onImportProfile,
  onImportChecks,
}: ProfileEditorProps) {
  const [name, setName] = useState(() => profile.name);
  const [businessName, setBusinessName] = useState(() => profile.businessName);
  const [saved, setSaved] = useState(false);
  const [transferNotice, setTransferNotice] = useState("");
  const [pendingImport, setPendingImport] = useState<BackupPayload | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    onSaveProfile({
      name: name.trim(),
      businessName: businessName.trim(),
    });
    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 1400);
  }

  function clearTransferNoticeLater() {
    window.setTimeout(() => {
      setTransferNotice("");
    }, 2200);
  }

  function handleExport() {
    const payload: BackupPayload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile: {
        name: profile.name,
        businessName: profile.businessName,
      },
      checks,
    };
    const datePart = new Date().toISOString().slice(0, 10);
    const fileName = `keepcheck-backup-${datePart}.json`;
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
    };

    if (
      typeof nav.share === "function" &&
      typeof File !== "undefined"
    ) {
      const file = new File([blob], fileName, { type: "application/json" });
      const shareData: ShareData = {
        files: [file],
        title: "KeepCheck Backup",
      };

      if (!nav.canShare || nav.canShare(shareData)) {
        void nav
          .share(shareData)
          .then(() => {
            setTransferNotice("Backup ready. Choose Save to Files.");
            clearTransferNoticeLater();
          })
          .catch(() => {
            // User cancelled or share failed; keep silent fallback behavior.
          });
        return;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    setTransferNotice("Backup exported.");
    clearTransferNoticeLater();
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleImportChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!isValidBackupPayload(parsed)) {
        setTransferNotice("Invalid backup file.");
        clearTransferNoticeLater();
        e.target.value = "";
        return;
      }
      setPendingImport(parsed);
    } catch {
      setTransferNotice("Import failed. Please use a valid JSON backup file.");
      clearTransferNoticeLater();
    } finally {
      e.target.value = "";
    }
  }

  function applyImportReplace() {
    if (!pendingImport) return;
    onImportProfile(pendingImport.profile);
    onImportChecks(pendingImport.checks);
    setName(pendingImport.profile.name);
    setBusinessName(pendingImport.profile.businessName);
    setTransferNotice("Backup imported (replaced current data).");
    clearTransferNoticeLater();
    setPendingImport(null);
  }

  function applyImportMerge() {
    if (!pendingImport) return;
    const mergedChecks = mergeChecks(checks, pendingImport.checks);
    onImportChecks(mergedChecks);
    setTransferNotice("Backup imported (added on top).");
    clearTransferNoticeLater();
    setPendingImport(null);
  }

  return (
    <main style={screenStyle}>
      <PageTransition>
        <section style={contentStyle}>
          <h1 style={titleStyle}>Profile</h1>
          <p style={subtitleStyle}>Update your name and business details.</p>

          <form onSubmit={handleSubmit} style={formStyle}>
            <label style={labelStyle}>
              Your Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
              />
            </label>

            <label style={labelStyle}>
              Business Name
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                style={inputStyle}
              />
            </label>

            <button type="submit" style={buttonStyle}>
              Save Profile
            </button>

            {saved && <p style={savedStyle}>Profile updated.</p>}
          </form>

          <section style={transferCardStyle}>
            <h2 style={transferTitleStyle}>Data Backup</h2>
            <p style={transferSubtitleStyle}>
              Export or import your local profile and check records.
            </p>

            <div style={transferActionsStyle}>
              <button type="button" onClick={handleExport} style={secondaryButtonStyle}>
                Export Data
              </button>
              <button type="button" onClick={handleImportClick} style={buttonStyle}>
                Import Data
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportChange}
                style={hiddenInputStyle}
              />
            </div>

            {transferNotice ? <p style={transferNoticeStyle}>{transferNotice}</p> : null}
          </section>

          <p style={creditStyle}>made with ♥️ by abdul</p>
        </section>
      </PageTransition>
      <BottomNav />
      <div
        style={{
          ...importChoiceOverlayStyle,
          opacity: pendingImport ? 1 : 0,
          pointerEvents: pendingImport ? "auto" : "none",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Import options"
        aria-hidden={!pendingImport}
      >
        <div
          style={{
            ...importChoiceCardStyle,
            opacity: pendingImport ? 1 : 0,
            transform: pendingImport
              ? "translateY(0) scale(1)"
              : "translateY(10px) scale(0.98)",
          }}
        >
          <h2 style={importChoiceTitleStyle}>Import Backup</h2>
          <p style={importChoiceMessageStyle}>
            Choose how to apply this backup file.
          </p>

          <div style={importChoiceActionsStyle}>
            <button
              type="button"
              onClick={() => setPendingImport(null)}
              style={importCancelStyle}
            >
              Cancel
            </button>
            <button type="button" onClick={applyImportMerge} style={importMergeStyle}>
              Add on top
            </button>
            <button
              type="button"
              onClick={applyImportReplace}
              style={importReplaceStyle}
            >
              Replace current data
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

const screenStyle: React.CSSProperties = {
  minHeight: "100dvh",
  width: "100%",
};

const contentStyle: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  marginTop: "1rem",
  marginBottom: 0,
  minHeight: "calc(100dvh - 1rem)",
  padding: "1.25rem 1.25rem 12rem 1.25rem",
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  borderBottomLeftRadius: 0,
  borderBottomRightRadius: 0,
  background:
    "radial-gradient(circle at 15% 20%, rgba(251, 191, 36, 0.22), transparent 40%), radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.2), transparent 35%), linear-gradient(155deg, #dbeafe 0%, #c7d2fe 35%, #bfdbfe 65%, #e2e8f0 100%)",
  boxSizing: "border-box",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontSize: "2.2rem",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
};

const subtitleStyle: React.CSSProperties = {
  margin: "0.4rem 0 1rem 0",
  color: "#334155",
};

const formStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.9rem",
  padding: "1rem",
  borderRadius: 14,
  border: "1px solid rgba(147, 197, 253, 0.7)",
  background: "rgba(255,255,255,0.76)",
};

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.35rem",
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.95rem",
};

const inputStyle: React.CSSProperties = {
  border: "1px solid #93C5FD",
  borderRadius: 11,
  padding: "0.72rem 0.85rem",
  fontSize: "1rem",
  color: "#0F172A",
  background: "#FFFFFF",
};

const buttonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 11,
  padding: "0.78rem 0.95rem",
  color: "#F8FAFC",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.98rem",
  background: "linear-gradient(135deg, #0F172A, #1E3A8A)",
  cursor: "pointer",
};

const savedStyle: React.CSSProperties = {
  margin: 0,
  color: "#1D4ED8",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
};

const transferCardStyle: React.CSSProperties = {
  marginTop: "1rem",
  display: "grid",
  gap: "0.72rem",
  padding: "1rem",
  borderRadius: 14,
  border: "1px solid rgba(147, 197, 253, 0.7)",
  background: "rgba(255,255,255,0.76)",
};

const transferTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1.1rem",
};

const transferSubtitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#334155",
  fontSize: "0.92rem",
};

const transferActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.6rem",
  flexWrap: "wrap",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.9)",
  borderRadius: 11,
  padding: "0.78rem 0.95rem",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.95rem",
  background: "rgba(255,255,255,0.9)",
  cursor: "pointer",
};

const hiddenInputStyle: React.CSSProperties = {
  display: "none",
};

const transferNoticeStyle: React.CSSProperties = {
  margin: 0,
  color: "#1D4ED8",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.92rem",
};

const creditStyle: React.CSSProperties = {
  margin: "1.5rem 0 0.2rem 0",
  textAlign: "center",
  color: "#334155",
  opacity: 0.72,
  fontSize: "0.85rem",
  letterSpacing: "0.2px",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
};

const importChoiceOverlayStyle: React.CSSProperties = {
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

const importChoiceCardStyle: React.CSSProperties = {
  width: "min(92vw, 460px)",
  borderRadius: 16,
  border: "1px solid rgba(147, 197, 253, 0.8)",
  background: "rgba(255,255,255,0.98)",
  boxShadow: "0 20px 42px rgba(15, 23, 42, 0.22)",
  padding: "1rem",
  transition: "opacity 220ms ease, transform 220ms ease",
};

const importChoiceTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1.15rem",
};

const importChoiceMessageStyle: React.CSSProperties = {
  margin: "0.55rem 0 0 0",
  color: "#334155",
  lineHeight: 1.45,
};

const importChoiceActionsStyle: React.CSSProperties = {
  marginTop: "1rem",
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "flex-end",
  gap: "0.5rem",
};

const importCancelStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.8)",
  borderRadius: 10,
  padding: "0.54rem 0.85rem",
  background: "rgba(255,255,255,0.9)",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const importMergeStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.8)",
  borderRadius: 10,
  padding: "0.54rem 0.85rem",
  background: "rgba(219, 234, 254, 0.9)",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const importReplaceStyle: React.CSSProperties = {
  border: "1px solid rgba(239, 68, 68, 0.62)",
  borderRadius: 10,
  padding: "0.54rem 0.85rem",
  background: "rgba(254, 242, 242, 0.95)",
  color: "#B91C1C",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.85rem",
  cursor: "pointer",
};
