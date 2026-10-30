// Tests for lib/scanner.ts: does each rule find the old code, and stay quiet on new code?
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scanFile } from "@/lib/scanner";

// Reads a sample file from tests/fixtures/.
const fixture = (name: string) => readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8");

// Scans a small piece of code and returns just the rule IDs found, e.g. ["R1", "R7"].
const ruleIds = (code: string, filename = "app.js") => scanFile(code, filename).map((f) => f.ruleId);

// Wraps code in a route handler, so `req` and `res` are real handler parameters (gives "high" confidence).
const inRoute = (body: string) => `app.get("/x", (req, res) => { ${body} });`;

describe("fixtures", () => {
  it("finds exactly the 14 problems in the Express 4 app, in line order", () => {
    const findings = scanFile(fixture("express4-app.js"), "express4-app.js");

    expect(findings.map((f) => [f.ruleId, f.line])).toEqual([
      ["C3", 4],
      ["R1", 7],
      ["R7", 7],
      ["R3", 9],
      ["R2", 10],
      ["C2", 11],
      ["R4", 12],
      ["C1", 14],
      ["R8", 15],
      ["R9", 16],
      ["R10", 17],
      ["R6", 18],
      ["C1", 20],
      ["R5", 20],
    ]);
    // Every one of them is inside a real route handler, so we're sure about all of them.
    expect(findings.every((f) => f.confidence === "high")).toBe(true);
  });

  it("finds nothing in an app that is already migrated", () => {
    expect(scanFile(fixture("express5-clean.js"), "express5-clean.js")).toEqual([]);
  });
});

describe("rules", () => {
  it("R1: app.del()", () => {
    expect(ruleIds(`app.del("/x", h);`)).toEqual(["R1"]);
    expect(ruleIds(`app.delete("/x", h);`)).toEqual([]);
  });

  it("R2: req.acceptsCharset() & co.", () => {
    expect(ruleIds(inRoute(`req.acceptsEncoding("gzip");`))).toEqual(["R2"]);
    expect(ruleIds(inRoute(`req.acceptsEncodings("gzip");`))).toEqual([]);
  });

  it("R3: req.param(name)", () => {
    expect(ruleIds(inRoute(`req.param("id");`))).toEqual(["R3"]);
    // app.param("id", fn) is a different, still-valid API
    expect(ruleIds(`app.param("id", fn); router.param("id", fn);`)).toEqual([]);
  });

  it("R4: res.json(obj, status)", () => {
    expect(ruleIds(inRoute(`res.json({ a: 1 }, 201);`))).toEqual(["R4"]);
    expect(ruleIds(inRoute(`res.status(201).json({ a: 1 });`))).toEqual([]);
  });

  it("R5: res.jsonp(obj, status)", () => {
    expect(ruleIds(inRoute(`res.jsonp({ a: 1 }, 201);`))).toEqual(["R5"]);
    expect(ruleIds(inRoute(`res.status(201).jsonp({ a: 1 });`))).toEqual([]);
  });

  it("R6: res.send(body, status)", () => {
    expect(ruleIds(inRoute(`res.send("hi", 404);`))).toEqual(["R6"]);
    expect(ruleIds(inRoute(`res.status(404).send("hi");`))).toEqual([]);
  });

  it("R7: res.send(status)", () => {
    expect(ruleIds(inRoute(`res.send(404);`))).toEqual(["R7"]);
    expect(ruleIds(inRoute(`res.sendStatus(404); res.send("404");`))).toEqual([]);
  });

  it("R8: res.redirect(url, status)", () => {
    expect(ruleIds(inRoute(`res.redirect("/home", 301);`))).toEqual(["R8"]);
    expect(ruleIds(inRoute(`res.redirect(301, "/home");`))).toEqual([]);
  });

  it("R9: res.redirect('back') and res.location('back')", () => {
    expect(ruleIds(inRoute(`res.redirect("back"); res.location("back");`))).toEqual(["R9", "R9"]);
    expect(ruleIds(inRoute(`res.redirect("/back");`))).toEqual([]);
  });

  it("R10: res.sendfile()", () => {
    expect(ruleIds(inRoute(`res.sendfile("/a.txt");`))).toEqual(["R10"]);
    expect(ruleIds(inRoute(`res.sendFile("/a.txt");`))).toEqual([]);
  });

  it("C1: old route path syntax", () => {
    expect(ruleIds(`app.get("/files/*", h);`)).toEqual(["C1"]);
    expect(ruleIds(`app.get("/:id?", h);`)).toEqual(["C1"]);
    expect(ruleIds(`router.post("/(a|b)", h);`)).toEqual(["C1"]);
    expect(ruleIds(`app.use("*", h);`)).toEqual(["C1"]);
    // New syntax, settings like app.get("env"), and non-path strings are fine
    expect(ruleIds(`app.get("/files/*splat", h); app.get("/:file{.:ext}", h); app.get("env");`)).toEqual([]);
  });

  it("C2: changing req.query", () => {
    expect(ruleIds(inRoute(`req.query.page = 1;`))).toEqual(["C2"]);
    expect(ruleIds(inRoute(`req.query = {};`))).toEqual(["C2"]);
    expect(ruleIds(inRoute(`const query = { ...req.query }; query.page = 1;`))).toEqual([]);
  });

  it("C3: express.urlencoded() without `extended`", () => {
    expect(ruleIds(`app.use(express.urlencoded());`)).toEqual(["C3"]);
    expect(ruleIds(`app.use(express.urlencoded({ limit: "1mb" }));`)).toEqual(["C3"]);
    expect(ruleIds(`app.use(express.urlencoded({ extended: false }));`)).toEqual([]);
  });
});

describe("fix text and confidence", () => {
  it("writes the fix using the user's own code", () => {
    const [finding] = scanFile(inRoute(`res.json({ a: 1 }, 201);`), "app.js");
    expect(finding.fix).toBe("res.status(201).json({ a: 1 })");
    expect(finding.code).toBe(`app.get("/x", (req, res) => { res.json({ a: 1 }, 201); });`);
  });

  it("uses the handler's own name for req in the R9 fix", () => {
    const code = `app.get("/x", (request, response) => response.redirect("back"));`;
    expect(scanFile(code, "app.js")[0].fix).toBe("response.redirect(request.get('Referrer') || '/')");
  });

  it("suggests new route syntax for C1", () => {
    expect(scanFile(`app.get("/:file.:ext?", h);`, "app.js")[0].fix).toBe("'/:file{.:ext}'");
    expect(scanFile(`app.get("/files/*", h);`, "app.js")[0].fix).toContain("'/files/*splat'");
  });

  it("is 'medium' when res isn't a route handler parameter", () => {
    const [finding] = scanFile(`const helper = (res) => res.send(500);`, "app.js");
    expect(finding.ruleId).toBe("R7");
    expect(finding.confidence).toBe("medium");
  });

  it("reports the right line and column", () => {
    const [finding] = scanFile(`\n\n  app.del("/x", h);`, "app.js");
    expect(finding).toMatchObject({ line: 3, column: 2, file: "app.js" });
  });
});

describe("parsing", () => {
  it("ignores code inside comments and strings", () => {
    expect(ruleIds(`// res.send(200)\nconst s = "res.json(x, 200)";`)).toEqual([]);
  });

  it("reads TypeScript, including generics that look like JSX", () => {
    const code = `
      import type { Request, Response } from "express";
      const id = <T,>(x: T): T => x;
      const cast = <number>value;
      app.get("/x", (req: Request, res: Response) => res.send(200));
    `;
    expect(ruleIds(code, "server.ts")).toEqual(["R7"]);
  });

  it("reads TSX (TypeScript + JSX)", () => {
    const code = `
      const Page = ({ title }: { title: string }) => <h1>{title}</h1>;
      app.del("/x", (req, res) => res.sendStatus(204));
    `;
    expect(ruleIds(code, "page.tsx")).toEqual(["R1"]);
  });

  it("throws on code that is too broken to read, so the caller can skip the file", () => {
    expect(() => scanFile(`app.get(`, "broken.js")).toThrow();
  });
});
