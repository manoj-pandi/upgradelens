// What each rule checks, in plain words. Used by the UI (Home and Report pages).
// The detection logic itself lives in lib/scanner.ts.

export type RuleKind = "removed" | "behavior";

export interface RuleMeta {
  id: string;
  kind: RuleKind;
  code: string;        // what the old code looks like
  description: string; // why it breaks, in one line
}

export const RULES: RuleMeta[] = [
  { id: "R1", kind: "removed", code: "app.del()", description: "Renamed to app.delete()" },
  { id: "R2", kind: "removed", code: "req.acceptsCharset() & co.", description: "Now plural: acceptsCharsets()" },
  { id: "R3", kind: "removed", code: "req.param(name)", description: "Use req.params, req.body, or req.query" },
  { id: "R4", kind: "removed", code: "res.json(obj, status)", description: "Use res.status(status).json(obj)" },
  { id: "R5", kind: "removed", code: "res.jsonp(obj, status)", description: "Use res.status(status).jsonp(obj)" },
  { id: "R6", kind: "removed", code: "res.send(body, status)", description: "Use res.status(status).send(body)" },
  { id: "R7", kind: "removed", code: "res.send(status)", description: "Use res.sendStatus(status)" },
  { id: "R8", kind: "removed", code: "res.redirect(url, status)", description: "Status comes first now" },
  { id: "R9", kind: "removed", code: "res.redirect('back')", description: "Use the Referrer header" },
  { id: "R10", kind: "removed", code: "res.sendfile()", description: "Renamed to res.sendFile()" },
  { id: "C1", kind: "behavior", code: "'/files/*'  '/:id?'", description: "Old route path syntax stops matching or throws" },
  { id: "C2", kind: "behavior", code: "req.query.page = 1", description: "req.query is now read-only" },
  { id: "C3", kind: "behavior", code: "express.urlencoded()", description: "Default changed to extended: false" },
];

export const REMOVED_RULES = RULES.filter((r) => r.kind === "removed");
export const BEHAVIOR_RULES = RULES.filter((r) => r.kind === "behavior");

export const MIGRATION_GUIDE_URL = "https://expressjs.com/en/guide/migrating-5";