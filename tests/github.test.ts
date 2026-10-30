// Tests for lib/github.ts. None of them talk to the real GitHub:
// we replace ("mock") the one GitHub call we need, so tests are fast, free, and work offline.
import { afterEach, describe, expect, it, vi } from "vitest";
import { RequestError } from "octokit";
import { MAX_FILES, isCodeFile, listCodeFiles, octokit, parseRepoUrl, toUserError } from "@/lib/github";

// Builds a fake GitHub error with a status code and optional response headers.
const githubError = (status: number, message = "error", headers: Record<string, string> = {}) =>
  new RequestError(message, status, {
    request: { method: "GET", url: "https://api.github.com/x", headers: {} },
    response: { status, url: "https://api.github.com/x", headers, data: {} },
  });

// Makes octokit.rest.git.getTree return this list of files instead of calling GitHub.
const mockTree = (tree: { path: string; type?: string; size?: number }[], truncated = false) => {
  const entries = tree.map((entry, i) => ({ type: "blob", size: 100, sha: `sha${i}`, ...entry }));
  // "as never" because we only fill in the fields our code reads, not GitHub's full response type
  vi.spyOn(octokit.rest.git, "getTree").mockResolvedValue({ data: { tree: entries, truncated } } as never);
};

// Put the real getTree back after each test.
afterEach(() => {
  vi.restoreAllMocks();
});

describe("parseRepoUrl", () => {
  it("reads the owner and repo", () => {
    expect(parseRepoUrl("https://github.com/expressjs/express")).toEqual({ owner: "expressjs", repo: "express" });
  });

  it("ignores a trailing slash and .git", () => {
    expect(parseRepoUrl("https://github.com/a/b/")).toEqual({ owner: "a", repo: "b" });
    expect(parseRepoUrl("https://github.com/a/b.git")).toEqual({ owner: "a", repo: "b" });
  });
});

describe("isCodeFile", () => {
  it("keeps code files", () => {
    for (const path of ["a.js", "src/b.ts", "c.tsx", "d.mjs", "e.cjs", "f.mts", "g.cts", "h.jsx"]) {
      expect(isCodeFile(path)).toBe(true);
    }
  });

  it("skips other files, minified files, and skipped folders", () => {
    for (const path of ["README.md", "a.json", "app.min.js", "node_modules/x/index.js", "src/dist/a.js", ".next/b.js"]) {
      expect(isCodeFile(path)).toBe(false);
    }
  });

  it("only skips whole folder names, not names that contain them", () => {
    expect(isCodeFile("src/builder/a.js")).toBe(true); // "builder" is not "build"
  });
});

describe("listCodeFiles", () => {
  it("keeps only code files, and only files (not folders)", async () => {
    mockTree([{ path: "src", type: "tree" }, { path: "src/app.js" }, { path: "README.md" }, { path: "node_modules/x.js" }]);
    const { files, truncated } = await listCodeFiles("o", "r", "sha");
    expect(files.map((f) => f.path)).toEqual(["src/app.js"]);
    expect(truncated).toBe(false);
  });

  it("keeps only files inside the chosen folder", async () => {
    mockTree([{ path: "src/a.js" }, { path: "srcx/b.js" }, { path: "lib/c.js" }]);
    const { files } = await listCodeFiles("o", "r", "sha", "src/");
    expect(files.map((f) => f.path)).toEqual(["src/a.js"]);
  });

  it("skips files over 200 KB", async () => {
    mockTree([{ path: "small.js", size: 1000 }, { path: "huge.js", size: 300 * 1024 }]);
    const { files } = await listCodeFiles("o", "r", "sha");
    expect(files.map((f) => f.path)).toEqual(["small.js"]);
  });

  it("stops at MAX_FILES and says the list was cut", async () => {
    mockTree(Array.from({ length: MAX_FILES + 5 }, (_, i) => ({ path: `f${i}.js` })));
    const { files, truncated } = await listCodeFiles("o", "r", "sha");
    expect(files).toHaveLength(MAX_FILES);
    expect(truncated).toBe(true);
  });

  it("passes on GitHub's own truncated flag", async () => {
    mockTree([{ path: "a.js" }], true);
    expect((await listCodeFiles("o", "r", "sha")).truncated).toBe(true);
  });
});

describe("toUserError", () => {
  it("explains a missing or private repo", () => {
    expect(toUserError(githubError(404))).toBe("Repo not found, or it's private.");
  });

  it("explains the rate limit (429, or 403 with no requests left)", () => {
    const rateLimit = "GitHub's rate limit was reached. Please try again in a few minutes.";
    expect(toUserError(githubError(429))).toBe(rateLimit);
    expect(toUserError(githubError(403, "error", { "x-ratelimit-remaining": "0" }))).toBe(rateLimit);
    expect(toUserError(githubError(403, "You have exceeded a secondary rate limit"))).toBe(rateLimit);
  });

  it("uses a general message for anything else", () => {
    expect(toUserError(githubError(500))).toBe("Couldn't read this repo from GitHub.");
    expect(toUserError(new Error("network down"))).toBe("Couldn't read this repo from GitHub.");
  });
});
