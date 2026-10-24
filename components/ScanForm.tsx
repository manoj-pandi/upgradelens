"use client";

import { useRef, useState, type SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, LockIcon, SpinnerIcon } from "./Icons";
import { folderSchema, repoUrlSchema, scanRequestSchema, type ScanField } from "@/lib/validation";

type FieldErrors = Partial<Record<ScanField, string>>;

const inputBase =
  "h-12 w-full rounded-[10px] border bg-white px-3.5 font-mono text-[15px] text-foreground " +
  "placeholder:text-zinc-500 focus:outline-none focus:ring-2 disabled:bg-zinc-50";
const inputOk = "border-zinc-300 focus:border-zinc-900 focus:ring-zinc-900/10";
const inputBad = "border-red-600 focus:border-red-600 focus:ring-red-600/15";

// Validate one field on its own (used when the user leaves the field)
function validateField(field: ScanField, value: string): string | undefined {
  const schema = field === "url" ? repoUrlSchema : folderSchema;
  const result = schema.safeParse(value);
  return result.success ? undefined : result.error.issues[0].message;
}

export default function ScanForm() {
  const router = useRouter();
  const urlRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);

  const [values, setValues] = useState({ url: "", folder: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState(""); // errors from the server
  const [loading, setLoading] = useState(false);

  function handleChange(field: ScanField, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined })); // clear as they fix it
  }

  function handleBlur(field: ScanField) {
    // Don't nag about an empty URL just because they clicked away
    if (field === "url" && !values.url.trim()) return;
    setErrors((e) => ({ ...e, [field]: validateField(field, values[field]) }));
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Scan failed. Please try again.");
      router.push(`/report/${data.id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Scan failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate // we show our own clear messages instead of the browser's popups
      aria-busy={loading}
      className="flex w-full max-w-190 flex-col gap-3.5 rounded-2xl border border-line bg-white p-5"
    >
      <div className="flex flex-wrap gap-3">
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
            <p id="repo-error" className="text-sm font-medium text-red-700">{errors.url}</p>
          )}
        </div>

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
          {errors.folder ? (
            <p id="folder-error" className="text-sm font-medium text-red-700">{errors.folder}</p>
          ) : (
            <p id="folder-hint" className="text-sm text-muted">Leave empty to scan the whole repo.</p>
          )}
        </div>
      </div>

      {formError && (
        <p role="alert" className="text-sm font-medium text-red-700">{formError}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm text-muted">
          <LockIcon />
          Public repos only. Your code is parsed, never run.
        </span>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-[10px] bg-zinc-900 px-5.5 font-semibold text-white hover:bg-zinc-800 disabled:opacity-70"
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
}