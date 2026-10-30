// Everything that talks to GitHub: find the latest commit, list the code files, download a file.
// Server only: it reads GITHUB_TOKEN, which must never reach the browser.
import { Octokit, RequestError } from "octokit";

// Files we can scan, and limits that keep one scan fast and cheap.
const CODE_EXTENSIONS = [".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx", ".mts", ".cts"];
const SKIP_FOLDERS = ["node_modules", "dist", "build", "coverage", "vendor", ".next", "out"];
export const MAX_FILES = 400;
export const MAX_FILE_BYTES = 200 * 1024; // 200 KB

// One shared GitHub client for the whole server.
// With a token GitHub allows 5,000 requests an hour; without one, only 60.
export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  // By default octokit WAITS when the rate limit is hit (up to an hour) and then retries.
  // A user is waiting on the Scan button, so we give up right away and show a clear message instead.
  throttle: {
    onRateLimit: () => false,
    onSecondaryRateLimit: () => false,
  },
});

// One file in the repo: where it is, and its sha (GitHub's fingerprint of the file's content).
export interface RepoFile {
  path: string;
  sha: string;
}

// "https://github.com/expressjs/express.git" → { owner: "expressjs", repo: "express" }
// The URL is already checked by lib/validation.ts, so we only need to split it.
export const parseRepoUrl = (url: string): { owner: string; repo: string } => {
  const [owner, repo] = new URL(url).pathname.split("/").filter(Boolean);
  return { owner, repo: repo.replace(/\.git$/, "") };
};

// Finds the latest commit of a branch (the repo's default branch if none is given).
// We scan by commit sha, so the report always matches one exact version of the code.
export const getLatestCommit = async (owner: string, repo: string, branch?: string) => {
  // No branch given → ask GitHub which branch is the default (usually "main" or "master").
  const branchName = branch ?? (await octokit.rest.repos.get({ owner, repo })).data.default_branch;
  const { data } = await octokit.rest.repos.getBranch({ owner, repo, branch: branchName });
  return { branch: branchName, sha: data.commit.sha };
};

// True for files we should scan: a code extension, not minified, and not inside a skipped folder.
export const isCodeFile = (path: string): boolean => {
  if (path.endsWith(".min.js")) return false;
  if (!CODE_EXTENSIONS.some((ext) => path.endsWith(ext))) return false;
  // "src/node_modules/x.js" → ["src", "node_modules", "x.js"] → contains a skipped folder
  return !path.split("/").some((part) => SKIP_FOLDERS.includes(part));
};

// Lists the code files of a commit, optionally only inside `folder` (like "src/").
// `truncated` is true when some files were left out: GitHub's list was too big, or we hit MAX_FILES.
export const listCodeFiles = async (owner: string, repo: string, sha: string, folder?: string) => {
  // One request returns every file in the repo (recursive = include sub-folders).
  const { data } = await octokit.rest.git.getTree({ owner, repo, tree_sha: sha, recursive: "true" });

  const codeFiles: RepoFile[] = [];
  for (const entry of data.tree) {
    // "blob" = a file ("tree" = a folder, "commit" = a git submodule)
    if (entry.type !== "blob" || !entry.path || !entry.sha) continue;
    if (folder && !entry.path.startsWith(folder)) continue;
    if (!isCodeFile(entry.path)) continue;
    if ((entry.size ?? 0) > MAX_FILE_BYTES) continue; // huge files are almost always generated code
    codeFiles.push({ path: entry.path, sha: entry.sha });
  }

  return {
    files: codeFiles.slice(0, MAX_FILES),
    truncated: data.truncated || codeFiles.length > MAX_FILES,
  };
};

// Downloads one file's text by its sha.
export const fetchFile = async (owner: string, repo: string, fileSha: string): Promise<string> => {
  const { data } = await octokit.rest.git.getBlob({ owner, repo, file_sha: fileSha });
  // GitHub sends the content base64-encoded (binary-safe text); turn it back into normal text.
  if (data.encoding === "base64") return Buffer.from(data.content, "base64").toString("utf8");
  return data.content;
};

// Turns any GitHub error into a short message that's safe to show the user.
// The real error (with details) should be logged on the server by the caller.
export const toUserError = (err: unknown): string => {
  if (err instanceof RequestError) {
    if (err.status === 404) return "Repo not found, or it's private.";
    if (err.status === 401) return "The server's GitHub token is invalid or expired.";

    // 429, or 403 with no requests left / a "secondary rate limit" (too many requests too fast)
    const remaining = err.response?.headers["x-ratelimit-remaining"];
    const isRateLimit = err.status === 429 ||
      (err.status === 403 && (remaining === "0" || /rate limit/i.test(err.message)));
    if (isRateLimit) return "GitHub's rate limit was reached. Please try again in a few minutes.";
  }
  return "Couldn't read this repo from GitHub.";
};
