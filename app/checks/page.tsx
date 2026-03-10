"use client";

import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import CheckCard from "@/components/CheckCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import InstallPrompt from "@/components/InstallPrompt";
import OnboardingForm from "@/components/OnboardingForm";
import PageTransition from "@/components/PageTransition";
import { useKeepCheckApp } from "@/hooks/useKeepCheckApp";
import { CheckRecord } from "@/types/check";

export default function AllChecksPage() {
  const router = useRouter();
  const EDIT_CLOSE_MS = 210;
  const DELETE_ANIMATION_MS = 260;
  const {
    isReady,
    isStandalone,
    bootstrapComplete,
    checks,
    setChecks,
    profile,
    setProfile,
  } = useKeepCheckApp();
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "cleared"
  >("all");
  const [monthYearFilter, setMonthYearFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [checkNumberFilter, setCheckNumberFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [closingEditId, setClosingEditId] = useState<string | null>(null);
  const [deletingEditId, setDeletingEditId] = useState<string | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [editImage, setEditImage] = useState<string>("");
  const [isEditCameraOpen, setIsEditCameraOpen] = useState(false);
  const [editCameraError, setEditCameraError] = useState("");
  const [editDateDigits, setEditDateDigits] = useState("");
  const [editAmountDigits, setEditAmountDigits] = useState("");
  const [isEditDateFocused, setIsEditDateFocused] = useState(false);
  const [isEditAmountFocused, setIsEditAmountFocused] = useState(false);
  const [showEditRecipientSuggestions, setShowEditRecipientSuggestions] =
    useState(false);
  const [showEditCheckNumberSuggestion, setShowEditCheckNumberSuggestion] =
    useState(false);
  const editCloseTimerRef = useRef<number | null>(null);
  const deleteTimerRef = useRef<number | null>(null);
  const editRecipientBlurTimerRef = useRef<number | null>(null);
  const editCheckNumberBlurTimerRef = useRef<number | null>(null);
  const editVideoRef = useRef<HTMLVideoElement>(null);
  const editStreamRef = useRef<MediaStream | null>(null);
  const [editForm, setEditForm] = useState({
    checkNumber: "",
    recipient: "",
    amount: "",
    issueDate: "",
    memo: "",
    status: "pending" as "pending" | "cleared",
  });
  const existingRecipients = useMemo(
    () =>
      Array.from(
        new Set(
          checks
            .map((check) => check.recipient.trim())
            .filter((recipient) => recipient.length > 0)
        )
      ),
    [checks]
  );
  const suggestedCheckNumber = useMemo(() => {
    const latestNumber = checks.find((check) => /^\d+$/.test(check.checkNumber));
    if (!latestNumber) return "";
    return String(Number(latestNumber.checkNumber) + 1);
  }, [checks]);
  const editRecipientSuggestions = existingRecipients
    .filter((company) =>
      company.toLowerCase().startsWith(editForm.recipient.trim().toLowerCase())
    )
    .slice(0, 6);
  const normalizedSuggestedCheckNumber = suggestedCheckNumber.replace(/\D/g, "");
  const shouldShowEditCheckNumberSuggestion =
    showEditCheckNumberSuggestion &&
    normalizedSuggestedCheckNumber.length > 0 &&
    editForm.checkNumber !== normalizedSuggestedCheckNumber &&
    (editForm.checkNumber.length === 0 ||
      normalizedSuggestedCheckNumber.startsWith(editForm.checkNumber));
  const monthYearOptions = useMemo(() => {
    const unique = new Map<string, string>();
    checks.forEach((check) => {
      const parsed = new Date(`${check.issueDate}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      if (!unique.has(key)) {
        unique.set(
          key,
          parsed.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
        );
      }
    });

    return Array.from(unique.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([value, label]) => ({ value, label }));
  }, [checks]);

  function issueDateToDigits(issueDate: string) {
    const [year, month, day] = issueDate.split("-");
    if (!year || !month || !day) return "";
    return `${month}${day}${year}`;
  }

  function amountToDigits(amount: string) {
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) return "";
    return String(Math.round(numeric * 100));
  }

  function deleteCheck(id: string) {
    setChecks((prev) => prev.filter((check) => check.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setClosingEditId(null);
      setDeletingEditId(null);
    }
  }

  function startEdit(check: CheckRecord) {
    if (editCloseTimerRef.current) {
      window.clearTimeout(editCloseTimerRef.current);
      editCloseTimerRef.current = null;
    }
    if (deleteTimerRef.current) {
      window.clearTimeout(deleteTimerRef.current);
      deleteTimerRef.current = null;
    }
    setClosingEditId(null);
    setDeletingEditId(null);
    setEditingId(check.id);
    setEditForm({
      checkNumber: check.checkNumber,
      recipient: check.recipient,
      amount: check.amount,
      issueDate: check.issueDate,
      memo: check.memo ?? "",
      status: check.status,
    });
    setEditDateDigits(issueDateToDigits(check.issueDate));
    setEditAmountDigits(amountToDigits(check.amount));
    setIsEditDateFocused(false);
    setIsEditAmountFocused(false);
    setShowEditRecipientSuggestions(false);
    setShowEditCheckNumberSuggestion(false);
    setEditImage(check.image ?? "");
    setEditCameraError("");
  }

  function handleEditChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (name === "checkNumber") {
      setEditForm((prev) => ({ ...prev, checkNumber: value.replace(/\D/g, "") }));
      return;
    }

    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleEditRecipientChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setEditForm((prev) => ({ ...prev, recipient: value }));
    setShowEditRecipientSuggestions(true);
  }

  function handleEditRecipientFocus() {
    if (editRecipientBlurTimerRef.current) {
      window.clearTimeout(editRecipientBlurTimerRef.current);
      editRecipientBlurTimerRef.current = null;
    }
    setShowEditRecipientSuggestions(true);
  }

  function handleEditRecipientBlur() {
    editRecipientBlurTimerRef.current = window.setTimeout(() => {
      setShowEditRecipientSuggestions(false);
      editRecipientBlurTimerRef.current = null;
    }, 120);
  }

  function selectEditRecipient(recipient: string) {
    setEditForm((prev) => ({ ...prev, recipient }));
    setShowEditRecipientSuggestions(false);
  }

  function handleEditCheckNumberChange(e: ChangeEvent<HTMLInputElement>) {
    const nextValue = e.target.value.replace(/\D/g, "");
    setEditForm((prev) => ({ ...prev, checkNumber: nextValue }));
    setShowEditCheckNumberSuggestion(true);
  }

  function handleEditCheckNumberFocus() {
    if (editCheckNumberBlurTimerRef.current) {
      window.clearTimeout(editCheckNumberBlurTimerRef.current);
      editCheckNumberBlurTimerRef.current = null;
    }
    setShowEditCheckNumberSuggestion(true);
  }

  function handleEditCheckNumberBlur() {
    editCheckNumberBlurTimerRef.current = window.setTimeout(() => {
      setShowEditCheckNumberSuggestion(false);
      editCheckNumberBlurTimerRef.current = null;
    }, 120);
  }

  function selectEditCheckNumber(value: string) {
    setEditForm((prev) => ({ ...prev, checkNumber: value }));
    setShowEditCheckNumberSuggestion(false);
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

  function handleEditDateTextChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    setEditDateDigits(digits);
    setEditForm((prev) => ({ ...prev, issueDate: parseIsoFromDigits(digits) }));
  }

  function handleEditDateKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace" && e.key !== "Delete") return;
    if (editDateDigits.length === 0) return;

    e.preventDefault();
    const nextDigits = editDateDigits.slice(0, -1);
    setEditDateDigits(nextDigits);
    setEditForm((prev) => ({ ...prev, issueDate: parseIsoFromDigits(nextDigits) }));
  }

  function handleEditPickerChange(e: ChangeEvent<HTMLInputElement>) {
    const isoDate = e.target.value;
    setEditForm((prev) => ({ ...prev, issueDate: isoDate }));
    if (!isoDate) {
      setEditDateDigits("");
      return;
    }

    const [year, month, day] = isoDate.split("-");
    if (!year || !month || !day) return;
    setEditDateDigits(`${month}${day}${year}`);
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

  function handleEditAmountChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    setEditAmountDigits(digits);
    setEditForm((prev) => ({
      ...prev,
      amount: digits ? (Number(digits) / 100).toFixed(2) : "",
    }));
  }

  function handleEditAmountKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Backspace" && e.key !== "Delete") return;
    if (editAmountDigits.length === 0) return;

    e.preventDefault();
    const nextDigits = editAmountDigits.slice(0, -1);
    setEditAmountDigits(nextDigits);
    setEditForm((prev) => ({
      ...prev,
      amount: nextDigits ? (Number(nextDigits) / 100).toFixed(2) : "",
    }));
  }

  function cancelEdit() {
    if (deletingEditId) return;
    if (isEditCameraOpen) {
      stopEditCamera();
    }
    closeEditPanel();
  }

  function closeEditPanel() {
    if (!editingId) return;
    if (isEditCameraOpen) {
      stopEditCamera();
    }

    const idToClose = editingId;
    setClosingEditId(idToClose);
    editCloseTimerRef.current = window.setTimeout(() => {
      setEditingId(null);
      setClosingEditId(null);
      editCloseTimerRef.current = null;
    }, EDIT_CLOSE_MS);
  }

  function deleteFromEdit() {
    if (!editingId || deletingEditId) return;
    setIsDeleteConfirmOpen(true);
  }

  async function startEditCamera() {
    setEditCameraError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setEditCameraError(
        "Camera is not available in this browser. Please check permissions."
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      editStreamRef.current = stream;
      setIsEditCameraOpen(true);

      if (editVideoRef.current) {
        editVideoRef.current.srcObject = stream;
        await editVideoRef.current.play();
      }
    } catch {
      setEditCameraError("Camera access failed. Please allow camera permissions.");
      setIsEditCameraOpen(false);
    }
  }

  function stopEditCamera() {
    if (editStreamRef.current) {
      editStreamRef.current.getTracks().forEach((track) => track.stop());
      editStreamRef.current = null;
    }
    if (editVideoRef.current) {
      editVideoRef.current.srcObject = null;
    }
    setIsEditCameraOpen(false);
  }

  function captureEditFromCamera() {
    const video = editVideoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    setEditImage(canvas.toDataURL("image/jpeg", 0.9));
    stopEditCamera();
  }

  function confirmDeleteFromEdit() {
    if (!editingId) return;
    const idToDelete = editingId;

    setIsDeleteConfirmOpen(false);
    setDeletingEditId(idToDelete);
    setClosingEditId(null);
    if (editCloseTimerRef.current) {
      window.clearTimeout(editCloseTimerRef.current);
      editCloseTimerRef.current = null;
    }

    deleteTimerRef.current = window.setTimeout(() => {
      deleteCheck(idToDelete);
      deleteTimerRef.current = null;
    }, DELETE_ANIMATION_MS);
  }

  function cancelDeleteFromEdit() {
    setIsDeleteConfirmOpen(false);
  }

  function saveEdit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;
    if (!editForm.issueDate) {
      alert("Please enter a valid issue date.");
      return;
    }

    const duplicate = checks.some(
      (check) =>
        check.id !== editingId && check.checkNumber === editForm.checkNumber
    );
    if (duplicate) {
      alert("This check number already exists.");
      return;
    }

    setChecks((prev) =>
      prev.map((check) =>
        check.id === editingId
          ? {
              ...check,
              checkNumber: editForm.checkNumber.trim(),
              recipient: editForm.recipient.trim(),
              amount: editForm.amount.trim(),
              issueDate: editForm.issueDate,
              memo: editForm.memo.trim(),
              status: editForm.status,
              image: editImage,
            }
          : check
      )
    );
    closeEditPanel();
  }

  const filteredChecks = checks.filter((check) => {
    const statusMatches =
      statusFilter === "all" || check.status === statusFilter;
    if (!statusMatches) return false;

    if (monthYearFilter !== "all") {
      const parsed = new Date(`${check.issueDate}T00:00:00`);
      if (Number.isNaN(parsed.getTime())) return false;
      const checkMonthKey = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      if (checkMonthKey !== monthYearFilter) return false;
    }

    if (companyFilter.trim().length > 0) {
      const normalizedCompanyFilter = companyFilter.trim().toLowerCase();
      if (!check.recipient.toLowerCase().includes(normalizedCompanyFilter)) {
        return false;
      }
    }

    if (checkNumberFilter.trim().length > 0) {
      const normalizedCheckNumberFilter = checkNumberFilter.replace(/\D/g, "");
      if (
        normalizedCheckNumberFilter.length > 0 &&
        !check.checkNumber.includes(normalizedCheckNumberFilter)
      ) {
        return false;
      }
    }

    return true;
  });

  useEffect(() => {
    return () => {
      if (editCloseTimerRef.current) {
        window.clearTimeout(editCloseTimerRef.current);
      }
      if (deleteTimerRef.current) {
        window.clearTimeout(deleteTimerRef.current);
      }
      if (editRecipientBlurTimerRef.current) {
        window.clearTimeout(editRecipientBlurTimerRef.current);
      }
      if (editCheckNumberBlurTimerRef.current) {
        window.clearTimeout(editCheckNumberBlurTimerRef.current);
      }
      if (editStreamRef.current) {
        editStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const body = document.body;
    if (isEditCameraOpen) {
      body.classList.add("camera-capture-open");
    } else {
      body.classList.remove("camera-capture-open");
    }

    return () => {
      body.classList.remove("camera-capture-open");
    };
  }, [isEditCameraOpen]);

  useEffect(() => {
    if (!isReady || !isStandalone || !profile) return;
    if (!bootstrapComplete) {
      router.replace("/install/");
    }
  }, [isReady, isStandalone, profile, bootstrapComplete, router]);

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
  if (!bootstrapComplete) return null;

  return (
    <main style={screenStyle}>
      <PageTransition>
        <section style={contentStyle}>
          <div style={titleRowStyle}>
            <h1 style={titleStyle}>Saved Checks</h1>
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              style={filterToggleButtonStyle}
              aria-label="Toggle filters"
              aria-expanded={showFilters}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" style={filterIconStyle}>
                <path d="M4 6h16" />
                <path d="M7 12h10" />
                <path d="M10 18h4" />
              </svg>
            </button>
          </div>
          <p style={subtitleStyle}>View and manage every saved check record.</p>
          <div
            style={{
              ...filterWrapStyle,
              ...(showFilters
                ? filterWrapOpenStyle
                : filterWrapClosedStyle),
            }}
            aria-hidden={!showFilters}
          >
            <div style={filterGridStyle}>
              <div style={filterRowDualStyle}>
                <div style={filterFieldStyle}>
                  <label htmlFor="status-filter" style={filterLabelStyle}>
                    Filter by status
                  </label>
                  <select
                    id="status-filter"
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(
                        e.target.value as "all" | "pending" | "cleared"
                      )
                    }
                    style={filterSelectStyle}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="cleared">Cleared</option>
                  </select>
                </div>

                <div style={filterFieldStyle}>
                  <label htmlFor="month-year-filter" style={filterLabelStyle}>
                    Filter by month/year
                  </label>
                  <select
                    id="month-year-filter"
                    value={monthYearFilter}
                    onChange={(e) => setMonthYearFilter(e.target.value)}
                    style={filterSelectStyle}
                  >
                    <option value="all">All</option>
                    {monthYearOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={filterRowDualStyle}>
                <div style={filterFieldStyle}>
                  <label htmlFor="company-filter" style={filterLabelStyle}>
                    Company
                  </label>
                  <input
                    id="company-filter"
                    type="text"
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    placeholder="Search company"
                    style={filterInputStyle}
                  />
                </div>

                <div style={filterFieldStyle}>
                  <label htmlFor="check-number-filter" style={filterLabelStyle}>
                    Check number
                  </label>
                  <input
                    id="check-number-filter"
                    type="text"
                    inputMode="numeric"
                    value={checkNumberFilter}
                    onChange={(e) =>
                      setCheckNumberFilter(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="Search check number"
                    style={filterInputStyle}
                  />
                </div>
              </div>
            </div>
          </div>
          {filteredChecks.length === 0 ? (
            <div style={emptyStateWrapStyle}>
              <p style={emptyStyle}>No checks saved yet.</p>
            </div>
          ) : (
            <div style={listStyle}>
              {filteredChecks.map((check) => {
                const isEditingCard = editingId === check.id;
                const isClosingCard = closingEditId === check.id;
                const isDeletingCard = deletingEditId === check.id;

                return isEditingCard || isClosingCard || isDeletingCard ? (
                  <form
                    key={check.id}
                    onSubmit={saveEdit}
                    style={{
                      ...editCardStyle,
                      ...(isDeletingCard
                        ? editCardDeletingStyle
                        : isClosingCard
                          ? editCardClosingStyle
                          : editCardOpeningStyle),
                    }}
                  >
                    <p style={editTitleStyle}>Edit Check</p>

                    <div style={editFieldWrapStyle}>
                      <label style={editLabelStyle}>Company</label>
                      <div style={editRecipientFieldWrapStyle}>
                        <input
                          name="recipient"
                          value={editForm.recipient}
                          onChange={handleEditRecipientChange}
                          onFocus={handleEditRecipientFocus}
                          onBlur={handleEditRecipientBlur}
                          placeholder="Company"
                          autoComplete="off"
                          style={editInputStyle}
                          required
                        />
                        {showEditRecipientSuggestions &&
                        editForm.recipient.trim().length > 0 &&
                        editRecipientSuggestions.length > 0 ? (
                          <div style={editDropdownStyle}>
                            {editRecipientSuggestions.map((company) => (
                              <button
                                key={company}
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  selectEditRecipient(company);
                                }}
                                style={editSuggestionButtonStyle}
                              >
                                {company}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div style={editRowStyle}>
                      <div style={editFieldWrapStyle}>
                        <label style={editLabelStyle}>Date</label>
                        <div style={editDateFieldWrapStyle}>
                          <input
                            name="issueDateText"
                            type="text"
                            inputMode="numeric"
                            value={
                              !isEditDateFocused && editDateDigits.length === 0
                                ? ""
                                : getMaskedDateValue(editDateDigits)
                            }
                            placeholder="Issue Date"
                            onChange={handleEditDateTextChange}
                            onKeyDown={handleEditDateKeyDown}
                            onFocus={() => setIsEditDateFocused(true)}
                            onBlur={() => setIsEditDateFocused(false)}
                            aria-label="Issue Date"
                            style={editDateTextInputStyle}
                            required
                          />
                          <div aria-label="Open calendar" style={editCalendarButtonStyle}>
                            <svg
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                              style={editCalendarIconStyle}
                            >
                              <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
                              <path d="M3.5 9.5h17" />
                              <path d="M8 3.8v3.4" />
                              <path d="M16 3.8v3.4" />
                              <rect x="7.4" y="12.2" width="3" height="3" rx="0.6" />
                            </svg>
                            <input
                              type="date"
                              value={editForm.issueDate}
                              onChange={handleEditPickerChange}
                              tabIndex={-1}
                              style={editCalendarPickerInputStyle}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={editFieldWrapStyle}>
                        <label style={editLabelStyle}>Amount</label>
                        <input
                          name="amount"
                          type="text"
                          inputMode="numeric"
                          value={
                            !isEditAmountFocused && editAmountDigits.length === 0
                              ? ""
                              : formatCurrencyFromDigits(editAmountDigits || "0")
                          }
                          onChange={handleEditAmountChange}
                          onKeyDown={handleEditAmountKeyDown}
                          onFocus={() => setIsEditAmountFocused(true)}
                          onBlur={() => setIsEditAmountFocused(false)}
                          placeholder="Amount"
                          style={editInputStyle}
                          required
                        />
                      </div>
                    </div>

                    <div style={editRowStyle}>
                      <div style={editFieldWrapStyle}>
                        <label style={editLabelStyle}>Check Number</label>
                        <div style={editCheckNumberFieldWrapStyle}>
                          <input
                            name="checkNumber"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={editForm.checkNumber}
                            onChange={handleEditCheckNumberChange}
                            onFocus={handleEditCheckNumberFocus}
                            onBlur={handleEditCheckNumberBlur}
                            placeholder="Check Number"
                            autoComplete="off"
                            style={editInputStyle}
                            required
                          />
                          {shouldShowEditCheckNumberSuggestion ? (
                            <div style={editDropdownStyle}>
                              <button
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  selectEditCheckNumber(normalizedSuggestedCheckNumber);
                                }}
                                style={editSuggestionButtonStyle}
                              >
                                {normalizedSuggestedCheckNumber}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <div style={editFieldWrapStyle}>
                        <label style={editLabelStyle}>Status</label>
                        <select
                          name="status"
                          value={editForm.status}
                          onChange={handleEditChange}
                          style={editInputStyle}
                        >
                          <option value="pending">Pending</option>
                          <option value="cleared">Cleared</option>
                        </select>
                      </div>
                    </div>

                    <div style={editFieldWrapStyle}>
                      <label style={editLabelStyle}>Memo</label>
                      <textarea
                        name="memo"
                        value={editForm.memo}
                        onChange={handleEditChange}
                        placeholder="Memo / Notes"
                        rows={3}
                        style={editTextAreaStyle}
                      />
                    </div>

                    <div style={editCameraBlockStyle}>
                      <label style={editLabelStyle}>Photo</label>
                      <button
                        type="button"
                        onClick={startEditCamera}
                        style={{
                          ...editCameraButtonStyle,
                          opacity: isDeletingCard ? 0.55 : 1,
                          cursor: isDeletingCard ? "not-allowed" : "pointer",
                        }}
                        disabled={isDeletingCard}
                      >
                        Retake Photo
                      </button>
                      {editCameraError ? (
                        <p style={editCameraErrorStyle}>{editCameraError}</p>
                      ) : null}
                      {editImage ? (
                        <img
                          src={editImage}
                          alt={`Check ${editForm.checkNumber} preview`}
                          style={editImagePreviewStyle}
                        />
                      ) : null}
                    </div>

                    <div style={editActionsStyle}>
                      <button
                        type="button"
                        onClick={deleteFromEdit}
                        style={{
                          ...deleteFromEditButtonStyle,
                          opacity: isDeletingCard ? 0.55 : 1,
                          cursor: isDeletingCard ? "not-allowed" : "pointer",
                        }}
                        disabled={isDeletingCard}
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        style={{
                          ...cancelButtonStyle,
                          opacity: isDeletingCard ? 0.55 : 1,
                          cursor: isDeletingCard ? "not-allowed" : "pointer",
                        }}
                        disabled={isDeletingCard}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        style={{
                          ...saveButtonStyle,
                          opacity: isDeletingCard ? 0.55 : 1,
                          cursor: isDeletingCard ? "not-allowed" : "pointer",
                        }}
                        disabled={isDeletingCard}
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <CheckCard
                    key={check.id}
                    check={check}
                    onEdit={startEdit}
                    signatureName={profile.name}
                  />
                );
              })}
            </div>
          )}
        </section>
      </PageTransition>
      <ConfirmDialog
        open={isDeleteConfirmOpen}
        title="Delete Check?"
        message="This action cannot be undone. Do you want to permanently delete this check?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteFromEdit}
        onCancel={cancelDeleteFromEdit}
      />
      {isEditCameraOpen ? (
        <div style={cameraOverlayStyle}>
          <video
            ref={editVideoRef}
            playsInline
            muted
            style={cameraFullVideoStyle}
          />

          <div style={cameraHudStyle}>
            <p style={cameraTitleStyle}>Align the check in the dotted frame</p>

            <div style={checkGuideFrameStyle}>
              <div style={checkGuideInnerStyle} />
            </div>

            <div style={cameraActionsStyle}>
              <button
                type="button"
                onClick={captureEditFromCamera}
                style={captureButtonStyle}
              >
                Capture
              </button>
              <button
                type="button"
                onClick={stopEditCamera}
                style={cancelCameraStyle}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <BottomNav />
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
  minHeight: "calc(100dvh - 1rem)",
  padding: "1.25rem 1.25rem 12rem 1.25rem",
  borderRadius: 24,
  background:
    "radial-gradient(circle at 15% 20%, rgba(251, 191, 36, 0.22), transparent 40%), radial-gradient(circle at 85% 15%, rgba(16, 185, 129, 0.2), transparent 35%), linear-gradient(155deg, #dbeafe 0%, #c7d2fe 35%, #bfdbfe 65%, #e2e8f0 100%)",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontSize: "2.2rem",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
};

const titleRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
};

const filterToggleButtonStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  border: "1px solid #93C5FD",
  borderRadius: 12,
  background: "rgba(15, 23, 42, 0.96)",
  color: "#FFFFFF",
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};

const filterIconStyle: React.CSSProperties = {
  width: 18,
  height: 18,
  stroke: "currentColor",
  fill: "none",
  strokeWidth: 2.1,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const subtitleStyle: React.CSSProperties = {
  margin: "0.4rem 0 0.7rem 0",
  color: "#334155",
};

const filterGridStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.7rem",
};

const filterRowDualStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.7rem",
};

const filterFieldStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.4rem",
  padding: "0.7rem 0.75rem",
  borderRadius: 12,
  border: "1px solid rgba(147, 197, 253, 0.7)",
  background: "rgba(255,255,255,0.72)",
};

const filterWrapStyle: React.CSSProperties = {
  overflow: "hidden",
  transition:
    "max-height 280ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease, transform 280ms cubic-bezier(0.16, 1, 0.3, 1), margin-bottom 280ms cubic-bezier(0.16, 1, 0.3, 1)",
  transformOrigin: "top center",
};

const filterWrapOpenStyle: React.CSSProperties = {
  maxHeight: 320,
  opacity: 1,
  transform: "translateY(0)",
  marginBottom: "0.85rem",
  pointerEvents: "auto",
};

const filterWrapClosedStyle: React.CSSProperties = {
  maxHeight: 0,
  opacity: 0,
  transform: "translateY(-8px)",
  marginBottom: 0,
  pointerEvents: "none",
};

const filterLabelStyle: React.CSSProperties = {
  color: "#1E293B",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.9rem",
};

const filterSelectStyle: React.CSSProperties = {
  border: "1px solid #93C5FD",
  borderRadius: 10,
  padding: "0.46rem 0.62rem",
  background: "#fff",
  color: "#0F172A",
  fontSize: "0.9rem",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

const filterInputStyle: React.CSSProperties = {
  border: "1px solid #93C5FD",
  borderRadius: 10,
  padding: "0.46rem 0.62rem",
  background: "#fff",
  color: "#0F172A",
  fontSize: "0.9rem",
  width: "100%",
  minWidth: 0,
  boxSizing: "border-box",
};

const editCardStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.72rem",
  marginBottom: 0,
  padding: "0.95rem",
  borderRadius: 14,
  border: "1px solid rgba(147, 197, 253, 0.8)",
  background: "rgba(255,255,255,0.84)",
  boxShadow: "0 10px 24px rgba(15, 23, 42, 0.08)",
  transformOrigin: "top center",
  willChange: "transform, opacity",
};

const editCardOpeningStyle: React.CSSProperties = {
  animation:
    "keepcheckEditPanelExpand 300ms cubic-bezier(0.16, 1, 0.3, 1)",
};

const editCardClosingStyle: React.CSSProperties = {
  animation:
    "keepcheckEditPanelShrink 210ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
  pointerEvents: "none",
};

const editCardDeletingStyle: React.CSSProperties = {
  animation: "keepcheckEditDeleteOut 260ms ease forwards",
  pointerEvents: "none",
};

const editTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1.03rem",
};

const editRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "0.65rem",
};

const editFieldWrapStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.35rem",
  minWidth: 0,
};

const editLabelStyle: React.CSSProperties = {
  margin: 0,
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.8rem",
  lineHeight: 1.1,
};

const editRecipientFieldWrapStyle: React.CSSProperties = {
  position: "relative",
};

const editCheckNumberFieldWrapStyle: React.CSSProperties = {
  position: "relative",
};

const editInputStyle: React.CSSProperties = {
  border: "1px solid #93C5FD",
  borderRadius: 10,
  padding: "0.62rem 0.72rem",
  fontSize: "0.9rem",
  color: "#0F172A",
  background: "#fff",
  width: "100%",
  boxSizing: "border-box",
  minWidth: 0,
};

const editTextAreaStyle: React.CSSProperties = {
  ...editInputStyle,
  resize: "vertical",
  minHeight: 86,
};

const editDateTextInputStyle: React.CSSProperties = {
  ...editInputStyle,
  paddingRight: "2.85rem",
};

const editDateFieldWrapStyle: React.CSSProperties = {
  position: "relative",
};

const editCalendarButtonStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  right: "0.55rem",
  transform: "translateY(-50%)",
  width: "1.95rem",
  height: "1.95rem",
  border: "1px solid rgba(147, 197, 253, 0.8)",
  borderRadius: 8,
  background: "rgba(255,255,255,0.96)",
  display: "grid",
  placeItems: "center",
  overflow: "hidden",
  pointerEvents: "none",
};

const editCalendarIconStyle: React.CSSProperties = {
  width: "1.04rem",
  height: "1.04rem",
  stroke: "#0F172A",
  fill: "none",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const editCalendarPickerInputStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  opacity: 0,
  cursor: "pointer",
  pointerEvents: "auto",
};

const editDropdownStyle: React.CSSProperties = {
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

const editSuggestionButtonStyle: React.CSSProperties = {
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

const editCameraBlockStyle: React.CSSProperties = {
  display: "grid",
  gap: "0.55rem",
};

const editCameraButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.8)",
  borderRadius: 10,
  padding: "0.58rem 0.85rem",
  background: "rgba(255,255,255,0.9)",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.85rem",
  cursor: "pointer",
  justifySelf: "start",
};

const editCameraErrorStyle: React.CSSProperties = {
  margin: 0,
  color: "#B91C1C",
  fontSize: "0.8rem",
};

const editImagePreviewStyle: React.CSSProperties = {
  width: "min(100%, 280px)",
  borderRadius: 10,
  border: "1px solid #93C5FD",
};

const editActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.55rem",
  justifyContent: "flex-end",
};

const cancelButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(147, 197, 253, 0.8)",
  borderRadius: 10,
  padding: "0.55rem 0.85rem",
  background: "rgba(255,255,255,0.9)",
  color: "#1E3A8A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const saveButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  padding: "0.58rem 0.9rem",
  background: "linear-gradient(135deg, #0F172A, #1E3A8A)",
  color: "#F8FAFC",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.85rem",
  cursor: "pointer",
};

const listStyle: React.CSSProperties = {
  display: "grid",
  gap: "1rem",
};

const emptyStyle: React.CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.98rem",
};

const emptyStateWrapStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  minHeight: "45vh",
};

const deleteFromEditButtonStyle: React.CSSProperties = {
  border: "1px solid rgba(239, 68, 68, 0.6)",
  borderRadius: 10,
  padding: "0.55rem 0.85rem",
  background: "rgba(254, 242, 242, 0.92)",
  color: "#B91C1C",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.85rem",
  cursor: "pointer",
  marginRight: "auto",
};

const cameraOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 1500,
  background: "#020617",
  overflow: "hidden",
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
  padding: "1.25rem 1rem 2rem",
  pointerEvents: "none",
};

const cameraTitleStyle: React.CSSProperties = {
  margin: 0,
  color: "#F8FAFC",
  textAlign: "center",
  textShadow: "0 2px 8px rgba(0,0,0,0.45)",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "1rem",
  pointerEvents: "none",
};

const checkGuideFrameStyle: React.CSSProperties = {
  alignSelf: "center",
  justifySelf: "center",
  width: "min(90vw, 540px)",
  aspectRatio: "2.4 / 1",
  borderRadius: 18,
  border: "2px dashed rgba(255,255,255,0.82)",
  boxShadow:
    "0 0 0 9999px rgba(2, 6, 23, 0.25), inset 0 0 0 1px rgba(255,255,255,0.14)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const checkGuideInnerStyle: React.CSSProperties = {
  width: "88%",
  height: "72%",
  borderRadius: 12,
  border: "1px dashed rgba(255,255,255,0.44)",
};

const cameraActionsStyle: React.CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  justifyContent: "center",
  pointerEvents: "auto",
};

const captureButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 999,
  padding: "0.82rem 1.25rem",
  background: "linear-gradient(135deg, #1E3A8A, #2563EB)",
  color: "#F8FAFC",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.95rem",
  cursor: "pointer",
  boxShadow: "0 10px 24px rgba(30, 58, 138, 0.4)",
};

const cancelCameraStyle: React.CSSProperties = {
  border: "1px solid rgba(191, 219, 254, 0.85)",
  borderRadius: 999,
  padding: "0.82rem 1.15rem",
  background: "rgba(255,255,255,0.9)",
  color: "#0F172A",
  fontFamily: "OdinRoundedBold, Arial Rounded MT Bold, sans-serif",
  fontSize: "0.95rem",
  cursor: "pointer",
};
