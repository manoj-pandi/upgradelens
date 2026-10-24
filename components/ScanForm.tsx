"use client";

// The form on the Home page: a repo URL and an optional folder.
// It checks the input in the browser first, then asks the server to scan and opens the report.
import { useRef, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, LockIcon, SpinnerIcon } from "./Icons";
import { folderSchema, repoUrlSchema, scanRequestSchema, type ScanField } from "@/lib/validation";

type FieldErrors = Partial<Record<ScanField, string>>;

// Shared input styles, plus one set for "looks fine" and one for "has an error".
const inputBase =
  "h-12 w-full rounded-[10px] border bg-surface px-3.5 font-mono text-[15px] text-foreground " +
  "placeholder:text-muted focus:outline-none focus:ring-2 disabled:bg-subtle";
const inputOk = "border-line-strong focus:border-foreground focus:ring-foreground/10";
const inputBad = "border-danger focus:border-danger focus:ring-danger/15";

// Validate one field on its own (used when the user leaves the field).
// Returns the error message, or undefined when the value is fine.
const validateField = (field: ScanField, value: string): string | undefined => {
  const schema = field === "url" ? repoUrlSchema : folderSchema;
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0].message;
};

const ScanForm = () => {
  const router = useRouter();
  // Refs let us move keyboard focus to the first field with a problem
  const urlRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState({ url: "", folder: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState(""); // errors from the server
  const [loading, setLoading] = useState(false);

  // Save what the user typed, and clear that field's error as soon as they start fixing it.
  const handleChange = (field: ScanField, value: string) => {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // Check a field when the user leaves it.
  const handleBlur = (field: ScanField) => {
    // Don't nag about an empty URL just because they clicked away
    if (field === "url" && !values.url.trim()) return;
    setErrors((e) => ({ ...e, [field]: validateField(field, values[field]) }));
  };

  // Validate everything, call the scan API, and go to the report page.
  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // stop the browser from reloading the page
    setFormError("");

    // Same schema as the server, so users see mistakes instantly
    const parsed = scanRequestSchema.safeParse(values);
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as ScanField;
        next[field] ??= issue.message; // keep the first message per field
      }
      setErrors(next);
      (next.url ? urlRef : folderRef).current?.focus(); // move focus to the first problem
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data), // cleaned values, e.g. "src" → "src/"
      });
      // If the server sent something that isn't JSON, fall back to an empty object
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Scan failed. Please try again.");
      router.push(`/report/${data.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Scan failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate // we show our own clear messages instead of the browser's popups
      aria-busy={loading}
      className="flex w-full max-w-190 flex-col gap-3.5 rounded-2xl border border-line bg-surface p-5"
    >
      <div className="flex flex-wrap gap-3">
        {/* Repo URL field (takes most of the row) */}
        <div className="flex min-w-0 flex-[999_1_360px] flex-col gap-1.5">
          <label htmlFor="repo" className="text-sm font-semibold">GitHub repo URL</label>
          <input
            ref={urlRef}
            id="repo"
            name="url"
            type="url"
            inputMode="url"
            autoComplete="url"
            spellCheck={false}
            required
            placeholder="https://github.com/owner/repo"
            value={values.url}
            onChange={(e) => handleChange("url", e.target.value)}
            onBlur={() => handleBlur("url")}
            aria-invalid={Boolean(errors.url)}
            aria-describedby={errors.url ? "repo-error" : undefined}
            className={`${inputBase} ${errors.url ? inputBad : inputOk}`}
            disabled={loading}
          />
          {errors.url && (
            <p id="repo-error" className="text-sm font-medium text-danger">{errors.url}</p>
          )}
        </div>

        {/* Optional folder field */}
        <div className="flex min-w-0 flex-[1_1_180px] flex-col gap-1.5">
          <label htmlFor="folder" className="text-sm font-semibold">
            Folder <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            ref={folderRef}
            id="folder"
            name="folder"
            spellCheck={false}
            placeholder="src/"
            value={values.folder}
            onChange={(e) => handleChange("folder", e.target.value)}
            onBlur={() => handleBlur("folder")}
            aria-invalid={Boolean(errors.folder)}
            aria-describedby={errors.folder ? "folder-error" : "folder-hint"}
            className={`${inputBase} ${errors.folder ? inputBad : inputOk}`}
            disabled={loading}
          />
          {/* Show the error if there is one, otherwise a helpful hint */}
          {errors.folder ? (
            <p id="folder-error" className="text-sm font-medium text-danger">{errors.folder}</p>
          ) : (
            <p id="folder-hint" className="text-sm text-muted">Leave empty to scan the whole repo.</p>
          )}
        </div>
      </div>

      {/* role="alert" makes screen readers announce server errors right away */}
      {formError && (
        <p role="alert" className="text-sm font-medium text-danger">{formError}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-muted">
          <LockIcon />
          Public repos only. Your code is parsed, never run.
        </span>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-primary px-5.5 font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-70"
        >
          {loading ? (
            <>
              <SpinnerIcon />
              Scanning…
            </>
          ) : (
            <>
              Scan repo
              <ArrowRightIcon />
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ScanForm;
