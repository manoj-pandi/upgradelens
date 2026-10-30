// Tests for lib/validation.ts: the rules for the repo URL and folder that the form and the API share.
import { describe, expect, it } from "vitest";
import { folderSchema, repoUrlSchema } from "@/lib/validation";

// Returns the error message for a bad value, or undefined if the value is valid.
const errorFor = (schema: typeof repoUrlSchema | typeof folderSchema, value: string) =>
  schema.safeParse(value).error?.issues[0]?.message;

describe("repoUrlSchema", () => {
  it("rejects an empty URL", () => {
    expect(errorFor(repoUrlSchema, "   ")).toBe("Paste a GitHub repo URL to start.");
  });

  it("rejects URLs that aren't GitHub repos", () => {
    expect(errorFor(repoUrlSchema, "https://gitlab.com/a/b")).toBeDefined();
    expect(errorFor(repoUrlSchema, "https://github.com/onlyowner")).toBeDefined();
  });

  it("rejects /tree/ and /blob/ URLs with a helpful message", () => {
    expect(errorFor(repoUrlSchema, "https://github.com/a/b/tree/main/src")).toContain("without /tree/");
  });

  it("turns github.com/a/b and http:// into https://", () => {
    expect(repoUrlSchema.parse("github.com/a/b")).toBe("https://github.com/a/b");
    expect(repoUrlSchema.parse("http://github.com/a/b")).toBe("https://github.com/a/b");
  });

  it("accepts a trailing slash or .git", () => {
    expect(errorFor(repoUrlSchema, "https://github.com/a/b/")).toBeUndefined();
    expect(errorFor(repoUrlSchema, "https://github.com/a/b.git")).toBeUndefined();
  });
});

describe("folderSchema", () => {
  it("rejects a leading /", () => {
    expect(errorFor(folderSchema, "/src")).toContain("no leading /");
  });

  it("rejects '..' so nobody can climb out of the repo", () => {
    expect(errorFor(folderSchema, "../etc")).toBe("The folder can't contain '..'.");
  });

  it("rejects spaces and other odd characters", () => {
    expect(errorFor(folderSchema, "src lib")).toBeDefined();
  });

  it("adds a trailing slash: src → src/", () => {
    expect(folderSchema.parse("src")).toBe("src/");
    expect(folderSchema.parse("src/lib/")).toBe("src/lib/");
  });

  it("turns an empty folder into undefined (scan the whole repo)", () => {
    expect(folderSchema.parse("")).toBeUndefined();
    expect(folderSchema.parse("  ")).toBeUndefined();
  });
});
