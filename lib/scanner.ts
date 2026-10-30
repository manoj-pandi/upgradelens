// The core of UpgradeLens: reads the code of ONE file and finds every line that breaks in Express 5.
// It never runs the code. Babel turns the code into a tree of objects (an AST, "abstract syntax tree"),
// and we look for patterns in that tree, like "a call to a method named del".
// Because we look at the tree, code inside comments and strings is never matched by mistake.
import { parse, type ParserPlugin } from "@babel/parser";
import traverse, { type NodePath } from "@babel/traverse";
import * as t from "@babel/types";

// "high" = we're sure this object is Express's req/res. "medium" = probably, but check by hand.
export type Confidence = "high" | "medium";

// One problem found in the code.
export interface Finding {
  ruleId: string; // e.g. "R1" (see lib/ruleMeta.ts)
  file: string; // path of the file inside the repo
  line: number; // starts at 1
  column: number; // starts at 0
  code: string; // the old line of code, trimmed
  fix: string; // what to write instead
  message: string; // why it breaks, in plain English
  confidence: Confidence;
}

// Objects that usually hold the Express app or a router.
const ROUTER_NAMES = ["app", "router"];

// Methods that register a route, e.g. app.get("/users", handler).
const ROUTE_METHODS = ["get", "post", "put", "patch", "delete", "del", "all", "use", "options", "head"];

// Rules R4 / R5 / R6 are the same check (body first, status second) on three methods.
// A Map (not a plain object) so names like "toString" can't match by accident.
const STATUS_SECOND_RULES = new Map([
  ["json", "R4"],
  ["jsonp", "R5"],
  ["send", "R6"],
]);

// ---------- Small helpers ----------

// Returns the method name of a call like `res.send()` → "send", or `res["send"]()` → "send".
// Returns null for plain function calls like `express()`.
const methodName = (callee: t.Node): string | null => {
  if (!t.isMemberExpression(callee)) return null;
  // res.send → the property is an Identifier named "send"
  if (!callee.computed && t.isIdentifier(callee.property)) return callee.property.name;
  // res["send"] → the property is a string
  if (callee.computed && t.isStringLiteral(callee.property)) return callee.property.value;
  return null;
};

// Returns the object's name in `res.send()` → "res". Returns null for longer chains like `res.status(200).send()`.
const objectName = (callee: t.Node): string | null => {
  if (t.isMemberExpression(callee) && t.isIdentifier(callee.object)) return callee.object.name;
  return null;
};

// Returns the original source text of a node, e.g. the text `{ id }` for an object argument.
const src = (code: string, node: t.Node): string => code.slice(node.start ?? 0, node.end ?? 0);

// True if the node is a plain number like 200.
const isNum = (node: t.Node | undefined): boolean => t.isNumericLiteral(node);

// Finds the route handler that contains this code, e.g. the `(req, res) => {...}` in
// `app.get("/users", (req, res) => {...})`. Returns null if the code isn't inside one.
const routeHandler = (path: NodePath): NodePath<t.Function> | null => {
  // Walk up the tree: function → its parent → ... until we find a function passed to app.get(...) and co.
  const found = path.findParent((parent) => {
    if (!parent.isFunction()) return false;
    // The function must be an argument of a call...
    const call = parent.parentPath;
    if (!call?.isCallExpression() || parent.listKey !== "arguments") return false;
    // ...and that call must be app.get(...), router.post(...), and so on.
    const callee = call.node.callee;
    const obj = objectName(callee);
    const method = methodName(callee);
    return obj !== null && ROUTER_NAMES.includes(obj) && method !== null && ROUTE_METHODS.includes(method);
  });
  return found as NodePath<t.Function> | null;
};

// Returns the name of the handler's parameter at `index` (0 = req, 1 = res), or null.
const handlerParam = (path: NodePath, index: number): string | null => {
  const param = routeHandler(path)?.node.params[index];
  return t.isIdentifier(param) ? param.name : null;
};

// "high" when `name` really is the route handler's req (index 0) or res (index 1) parameter.
// Otherwise "medium": it's probably req/res, but it could be any object with the same method name.
const confidenceFor = (path: NodePath, name: string | null, index: number): Confidence => {
  return name !== null && handlerParam(path, index) === name ? "high" : "medium";
};

// The name the handler uses for the request, e.g. "request" in (request, response) => ...
// Used to write fixes that match the user's own code. Defaults to "req".
const reqName = (path: NodePath): string => handlerParam(path, 0) ?? "req";

// True for `<name>.query` (like req.query). Written as a "type guard" so TypeScript then knows it's a MemberExpression.
const isQueryAccess = (node: t.Node): node is t.MemberExpression & { object: t.Identifier } => {
  return t.isMemberExpression(node) && !node.computed && t.isIdentifier(node.object) &&
    t.isIdentifier(node.property, { name: "query" });
};

// ---------- Route path check (rule C1) ----------

// Express 5 uses a new route path syntax (path-to-regexp v8):
// - a wildcard must have a name:      "/files/*"     → "/files/*splat"
// - optional parts use braces:        "/:file.:ext?" → "/:file{.:ext}"
// - these characters are reserved:    ( ) [ ] + !
// The "g" flag means "every match", so .replace() fixes all of them, not just the first.
// (We only use these with .replace() and .match(), which handle the "g" flag safely.)
const UNNAMED_STAR = /\*(?![A-Za-z_$])/g; // a * that isn't followed by a name
const OPTIONAL_PARAM = /([./-]?):(\w+)\?/g; // ":name?" with an optional "." "/" or "-" before it
const RESERVED_CHARS = /[()[\]+!?]/; // characters with no meaning (or a new meaning) in Express 5

// True if the route path uses syntax that changed in Express 5.
const hasOldPathSyntax = (path: string): boolean => {
  return path.match(UNNAMED_STAR) !== null || RESERVED_CHARS.test(path);
};

// Builds the suggested fix for an old route path.
const fixRoutePath = (path: string): string => {
  // "Match everything" needs a leading slash and a name now.
  if (path === "*") return "'/*splat' (or '/{*splat}' to also match '/')";

  // Rewrite the parts we know how to convert automatically.
  const fixed = path.replace(UNNAMED_STAR, "*splat").replace(OPTIONAL_PARAM, "{$1:$2}");

  // If anything unsupported is left (like "(a|b)" or "+"), we can't rewrite it safely; give advice instead.
  if (RESERVED_CHARS.test(fixed)) {
    return "Characters like ( ) [ ] + ! ? are reserved now. Use an array of paths, e.g. ['/a', '/b'], instead of a pattern.";
  }

  // "/files/*splat" no longer matches plain "/files". Wrapping it in braces makes that part optional.
  const braced = fixed.replace(/\/\*splat/g, "{/*splat}");
  if (braced !== fixed) return `'${fixed}' (or '${braced}' to also match without the wildcard part)`;
  return `'${fixed}'`;
};

// ---------- Parsing ----------

// Picks the Babel plugins for a file. TypeScript files need the "typescript" plugin.
// Only .tsx (and JS files) get "jsx": in a plain .ts file, JSX would break valid code like `<T>(x: T) => x`.
const pluginsFor = (filename: string): ParserPlugin[] => {
  if (filename.endsWith(".tsx")) return ["typescript", "jsx"];
  if (/\.(ts|mts|cts)$/.test(filename)) return ["typescript"];
  return ["jsx"];
};

// ---------- The scanner ----------

// Scans one file and returns its findings, sorted by line.
// Throws if the code is too broken to parse; the caller (scanRepo) catches that and marks the file as skipped.
export const scanFile = (code: string, filename: string): Finding[] => {
  const ast = parse(code, {
    sourceType: "unambiguous", // works for both `require(...)` files and `import` files
    errorRecovery: true, // keep going after small syntax errors instead of failing the whole file
    plugins: pluginsFor(filename),
  });

  const lines = code.split(/\r?\n/);
  const findings: Finding[] = [];

  // Adds one finding. `node` is where the problem is; we read its line and column from Babel.
  const report = (node: t.Node, ruleId: string, message: string, fix: string, confidence: Confidence) => {
    const line = node.loc?.start.line ?? 1;
    findings.push({
      ruleId,
      file: filename,
      line,
      column: node.loc?.start.column ?? 0,
      code: (lines[line - 1] ?? "").trim(),
      fix,
      message,
      confidence,
    });
  };

  traverse(ast, {
    // Runs once for every function call in the file, e.g. res.send(200).
    CallExpression(path) {
      const { callee, arguments: args } = path.node;
      const method = methodName(callee);
      if (method === null || !t.isMemberExpression(callee)) return; // not a `something.method()` call

      const obj = objectName(callee); // "res" in res.send(); null for chains
      const objText = src(code, callee.object); // the object as written, used in fix text
      const isRouter = obj !== null && ROUTER_NAMES.includes(obj);
      const [first, second] = args;

      // R1: app.del() was renamed to app.delete()
      if (method === "del") {
        report(path.node, "R1", "app.del() was removed in Express 5. Use app.delete().",
          `${objText}.delete(...)`, isRouter ? "high" : "medium");
      }

      // R2: req.acceptsCharset() & co. are now plural
      if (method === "acceptsCharset" || method === "acceptsEncoding" || method === "acceptsLanguage") {
        const argsText = args.map((arg) => src(code, arg)).join(", ");
        report(path.node, "R2", `req.${method}() was removed in Express 5. Use req.${method}s().`,
          `${objText}.${method}s(${argsText})`, confidenceFor(path, obj, 0));
      }

      // R3: req.param(name) was removed. app.param("id", fn) is different and still exists, so skip routers.
      if (method === "param" && args.length === 1 && !isRouter) {
        const name = t.isStringLiteral(first) ? first.value : "name";
        report(path.node, "R3", "req.param() was removed in Express 5. Read the value from where it really comes from.",
          `${objText}.params.${name}, ${objText}.body.${name}, or ${objText}.query.${name}`, confidenceFor(path, obj, 0));
      }

      // R4 / R5 / R6: res.json(obj, status), res.jsonp(obj, status), res.send(body, status)
      const statusRuleId = STATUS_SECOND_RULES.get(method);
      if (statusRuleId && args.length === 2 && isNum(second) && !isNum(first)) {
        report(path.node, statusRuleId, `res.${method}(body, status) was removed in Express 5. Set the status first.`,
          `${objText}.status(${src(code, second)}).${method}(${src(code, first)})`, confidenceFor(path, obj, 1));
      }

      // R7: res.send(200) no longer sends a status code; it would send the number as the body
      if (method === "send" && args.length === 1 && isNum(first)) {
        report(path.node, "R7", "res.send(status) was removed in Express 5. Use res.sendStatus().",
          `${objText}.sendStatus(${src(code, first)})`, confidenceFor(path, obj, 1));
      }

      // R8: res.redirect(url, status) — the status now comes first
      if (method === "redirect" && args.length === 2 && isNum(second) && !isNum(first)) {
        report(path.node, "R8", "res.redirect(url, status) was removed in Express 5. Put the status first.",
          `${objText}.redirect(${src(code, second)}, ${src(code, first)})`, confidenceFor(path, obj, 1));
      }

      // R9: the magic string 'back' was removed from res.redirect() and res.location()
      if ((method === "redirect" || method === "location") && args.length === 1 &&
          t.isStringLiteral(first) && first.value === "back") {
        report(path.node, "R9", `res.${method}('back') was removed in Express 5. Read the Referrer header yourself.`,
          `${objText}.${method}(${reqName(path)}.get('Referrer') || '/')`, confidenceFor(path, obj, 1));
      }

      // R10: res.sendfile() was renamed to res.sendFile()
      if (method === "sendfile") {
        const argsText = args.map((arg) => src(code, arg)).join(", ");
        report(path.node, "R10", "res.sendfile() was removed in Express 5. Use res.sendFile() (capital F).",
          `${objText}.sendFile(${argsText})`, confidenceFor(path, obj, 1));
      }

      // C1: route paths with old syntax. Only paths starting with "/" (or exactly "*") are routes;
      // this skips settings like app.get("env").
      if (isRouter && ROUTE_METHODS.includes(method) && t.isStringLiteral(first)) {
        const routePath = first.value;
        const isRoutePath = routePath.startsWith("/") || routePath === "*";
        if (isRoutePath && hasOldPathSyntax(routePath)) {
          report(first, "C1", "This route path uses syntax that changed in Express 5. It may stop matching or throw at startup.",
            fixRoutePath(routePath), "high");
        }
      }

      // C3: express.urlencoded() now defaults to extended: false
      if (method === "urlencoded" && obj === "express") {
        // No options at all, or an options object without the `extended` key.
        // If the options are a variable we can't see inside, we skip it to avoid a false alarm.
        const hasExtended = t.isObjectExpression(first) && first.properties.some(
          (prop) => t.isObjectProperty(prop) && t.isIdentifier(prop.key, { name: "extended" }),
        );
        if (first === undefined || (t.isObjectExpression(first) && !hasExtended)) {
          report(path.node, "C3", "express.urlencoded() now defaults to extended: false, so nested form fields like user[name] are no longer turned into objects.",
            "express.urlencoded({ extended: true }) if you rely on nested form data", "high");
        }
      }
    },

    // C2: req.query is read-only in Express 5 (it's a getter), so assigning to it silently does nothing.
    // Runs once for every assignment, e.g. req.query.page = 1.
    AssignmentExpression(path) {
      const left = path.node.left;
      if (!t.isMemberExpression(left)) return;

      // Case 1: `req.query = {...}`. Case 2: `req.query.page = 1`, where the object being changed is `req.query`.
      const queryExpr = isQueryAccess(left) ? left : isQueryAccess(left.object) ? left.object : null;
      if (queryExpr === null) return;
      const name = src(code, queryExpr.object); // "req", or whatever the user called it

      report(path.node, "C2", "req.query is read-only in Express 5. Changing it does nothing, with no error.",
        `Copy it first: const query = { ...${name}.query }`, "high");
    },
  });

  // Sort by position so the report reads top to bottom.
  return findings.sort((a, b) => a.line - b.line || a.column - b.column);
};
