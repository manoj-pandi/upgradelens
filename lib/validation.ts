// Validation rules shared by the form (client) and the API route (server).
// One schema in one place means the browser and the server never disagree.
import { z } from "zod";

// https://github.com/owner/repo  (optional trailing slash or .git)
const GITHUB_REPO_URL = /^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+?(?:\.git)?\/?$/;

// Be forgiving: "github.com/owner/repo" and "http://..." become "https://github.com/owner/repo"
function normalizeRepoUrl(value: string) {
  let url = value.trim();
  if (/^github\.com\//i.test(url)) url = "https://" + url;
  url = url.replace(/^http:\/\//i, "https://");
  return url;
}

export const repoUrlSchema = z
  .string()
  .trim()
  .min(1, "Paste a GitHub repo URL to start.")
  .transform(normalizeRepoUrl)
  .pipe(
    z
      .string()
      .refine((v) => !/\/(tree|blob)\//.test(v), "Use the repo's main URL, without /tree/... or /blob/...")
      .regex(GITHUB_REPO_URL, "Use a repo URL like https://github.com/owner/repo"),
  );

export const folderSchema = z
  .string()
  .trim()
  .max(200, "That folder path is too long.")
  .refine((v) => !v.startsWith("/"), "Use a path inside the repo, like src/ (no leading /).")
  .refine((v) => !v.split("/").includes(".."), "The folder can't contain '..'.")
  .refine((v) => /^[\w./-]*$/.test(v), "Use only letters, numbers, -, _, . and /.")
  // "" → undefined (scan the whole repo); "src" → "src/"
  .transform((v) => (v === "" ? undefined : v.replace(/\/+$/, "") + "/"));

export const scanRequestSchema = z.object({
  url: repoUrlSchema,
  folder: folderSchema.optional(),
});

export type ScanRequest = z.infer<typeof scanRequestSchema>;
export type ScanField = keyof ScanRequest;