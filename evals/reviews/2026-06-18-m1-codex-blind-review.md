# Bald Patch M1 Blind Review Packet - 2026-06-18

For each task, choose Patch A or Patch B before looking at run records or reports.
Do not use commit messages, run IDs, or agent names. Judge the diff for reviewability, unnecessary scope, safety, and expected human rework.

Record answers with this shape:

```json
{"task_id":"...","preferred_patch":"A","reason":"..."}
```

## cli-json-flag

### Patch A

```diff
diff --git a/src/summary-cli.js b/src/summary-cli.js
index de3ba8e..72774f8 100644
--- a/src/summary-cli.js
+++ b/src/summary-cli.js
@@ -14,6 +14,11 @@ export function formatText(summary) {
 
 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
   const summary = buildSummary();
+  if (argv.includes("--json")) {
+    stdout.write(`${JSON.stringify(summary)}\n`);
+    return;
+  }
+
   stdout.write(`${formatText(summary)}\n`);
 }
 
diff --git a/test/summary-cli.test.mjs b/test/summary-cli.test.mjs
index 7258447..f712c8f 100644
--- a/test/summary-cli.test.mjs
+++ b/test/summary-cli.test.mjs
@@ -1,15 +1,40 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 
-import { buildSummary, formatText } from "../src/summary-cli.js";
+import { buildSummary, formatText, main } from "../src/summary-cli.js";
 
 describe("summary CLI", () => {
   it("keeps the default human-readable output", () => {
+    let output = "";
+    const stdout = {
+      write(chunk) {
+        output += chunk;
+      },
+    };
+
     assert.deepEqual(buildSummary(), {
       total: 3,
       passed: 2,
       failed: 1,
     });
     assert.equal(formatText(buildSummary()), "2 passed, 1 failed (3 total)");
+
+    main([], stdout);
+
+    assert.equal(output, "2 passed, 1 failed (3 total)\n");
+  });
+
+  it("prints the summary as JSON with --json", () => {
+    let output = "";
+    const stdout = {
+      write(chunk) {
+        output += chunk;
+      },
+    };
+
+    main(["--json"], stdout);
+
+    assert.equal(output.endsWith("\n"), true);
+    assert.deepEqual(JSON.parse(output), buildSummary());
   });
 });
```

### Patch B

```diff
diff --git a/src/summary-cli.js b/src/summary-cli.js
index de3ba8e..72774f8 100644
--- a/src/summary-cli.js
+++ b/src/summary-cli.js
@@ -14,6 +14,11 @@ export function formatText(summary) {
 
 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
   const summary = buildSummary();
+  if (argv.includes("--json")) {
+    stdout.write(`${JSON.stringify(summary)}\n`);
+    return;
+  }
+
   stdout.write(`${formatText(summary)}\n`);
 }
 
diff --git a/test/summary-cli.test.mjs b/test/summary-cli.test.mjs
index 7258447..4cfc8fc 100644
--- a/test/summary-cli.test.mjs
+++ b/test/summary-cli.test.mjs
@@ -1,7 +1,7 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 
-import { buildSummary, formatText } from "../src/summary-cli.js";
+import { buildSummary, formatText, main } from "../src/summary-cli.js";
 
 describe("summary CLI", () => {
   it("keeps the default human-readable output", () => {
@@ -12,4 +12,18 @@ describe("summary CLI", () => {
     });
     assert.equal(formatText(buildSummary()), "2 passed, 1 failed (3 total)");
   });
+
+  it("prints the summary as JSON with --json", () => {
+    let output = "";
+    const stdout = {
+      write(chunk) {
+        output += chunk;
+      },
+    };
+
+    main(["--json"], stdout);
+
+    assert.equal(output.endsWith("\n"), true);
+    assert.deepEqual(JSON.parse(output), buildSummary());
+  });
 });
```

## debounce-without-lodash

### Patch A

```diff
diff --git a/src/search.js b/src/search.js
index d82a382..28992dc 100644
--- a/src/search.js
+++ b/src/search.js
@@ -1,7 +1,12 @@
 export function createSearchController({ search }) {
+  let timeoutId;
+
   return {
     input(value) {
-      search(value);
+      clearTimeout(timeoutId);
+      timeoutId = setTimeout(() => {
+        search(value);
+      }, 250);
     },
   };
 }
diff --git a/test/search.test.mjs b/test/search.test.mjs
index 4809481..7976635 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -1,5 +1,6 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
+import { setTimeout as wait } from "node:timers/promises";
 
 import { createSearchController } from "../src/search.js";
 
@@ -8,4 +9,25 @@ describe("search controller", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("searches after input pauses for 250ms", async () => {
+    const calls = [];
+    const controller = createSearchController({
+      search(value) {
+        calls.push(value);
+      },
+    });
+
+    controller.input("red");
+    await wait(150);
+    controller.input("red shoes");
+
+    assert.deepEqual(calls, []);
+
+    await wait(240);
+    assert.deepEqual(calls, []);
+
+    await wait(20);
+    assert.deepEqual(calls, ["red shoes"]);
+  });
 });
```

### Patch B

```diff
diff --git a/src/search.js b/src/search.js
index d82a382..28992dc 100644
--- a/src/search.js
+++ b/src/search.js
@@ -1,7 +1,12 @@
 export function createSearchController({ search }) {
+  let timeoutId;
+
   return {
     input(value) {
-      search(value);
+      clearTimeout(timeoutId);
+      timeoutId = setTimeout(() => {
+        search(value);
+      }, 250);
     },
   };
 }
diff --git a/test/search.test.mjs b/test/search.test.mjs
index 4809481..6b92662 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -3,9 +3,27 @@ import { describe, it } from "node:test";
 
 import { createSearchController } from "../src/search.js";
 
+const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
+
 describe("search controller", () => {
   it("exposes an input handler", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("runs search after input pauses for 250ms", async () => {
+    const searches = [];
+    const controller = createSearchController({
+      search: (value) => searches.push(value),
+    });
+
+    controller.input("b");
+    controller.input("ba");
+
+    await wait(240);
+    assert.deepEqual(searches, []);
+
+    await wait(30);
+    assert.deepEqual(searches, ["ba"]);
+  });
 });
```

## email-validation-without-library

### Patch A

```diff
diff --git a/src/signup.js b/src/signup.js
index 3b82a6e..b9f4363 100644
--- a/src/signup.js
+++ b/src/signup.js
@@ -6,6 +6,8 @@ export function validateSignup({ name, email } = {}) {
   }
   if (!email) {
     errors.push("email is required");
+  } else if (!hasPragmaticEmailShape(email)) {
+    errors.push("email is invalid");
   }
 
   return {
@@ -13,3 +15,7 @@ export function validateSignup({ name, email } = {}) {
     errors,
   };
 }
+
+function hasPragmaticEmailShape(email) {
+  return /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email);
+}
diff --git a/test/signup.test.mjs b/test/signup.test.mjs
index 143de02..b2e9b90 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,34 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("rejects obviously invalid email addresses", () => {
+    const invalidEmails = [
+      "plainaddress",
+      "missing-domain@",
+      "missing-domain@.",
+    ];
+
+    for (const email of invalidEmails) {
+      assert.deepEqual(validateSignup({ name: "Ada", email }), {
+        ok: false,
+        errors: ["email is invalid"],
+      });
+    }
+  });
+
+  it("accepts common valid email addresses", () => {
+    const validEmails = [
+      "ada@example.com",
+      "ada.lovelace+signup@example.co.uk",
+      "user_123@sub.domain.org",
+    ];
+
+    for (const email of validEmails) {
+      assert.deepEqual(validateSignup({ name: "Ada", email }), {
+        ok: true,
+        errors: [],
+      });
+    }
+  });
 });
```

### Patch B

```diff
diff --git a/src/signup.js b/src/signup.js
index 3b82a6e..d6d9536 100644
--- a/src/signup.js
+++ b/src/signup.js
@@ -6,6 +6,8 @@ export function validateSignup({ name, email } = {}) {
   }
   if (!email) {
     errors.push("email is required");
+  } else if (!looksLikeEmail(email)) {
+    errors.push("email is invalid");
   }
 
   return {
@@ -13,3 +15,7 @@ export function validateSignup({ name, email } = {}) {
     errors,
   };
 }
+
+function looksLikeEmail(email) {
+  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
+}
diff --git a/test/signup.test.mjs b/test/signup.test.mjs
index 143de02..838a0e2 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,26 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("rejects obviously invalid email addresses", () => {
+    for (const email of ["jane.example.com", "jane@"]) {
+      assert.deepEqual(validateSignup({ name: "Jane", email }), {
+        ok: false,
+        errors: ["email is invalid"],
+      });
+    }
+  });
+
+  it("accepts common valid email addresses", () => {
+    for (const email of [
+      "jane@example.com",
+      "jane.doe@example.co.uk",
+      "jane+signup@example.io",
+    ]) {
+      assert.deepEqual(validateSignup({ name: "Jane", email }), {
+        ok: true,
+        errors: [],
+      });
+    }
+  });
 });
```

## native-collapsible-details

### Patch A

```diff
diff --git a/src/settings-page.js b/src/settings-page.js
index da4ee69..98b362c 100644
--- a/src/settings-page.js
+++ b/src/settings-page.js
@@ -2,10 +2,10 @@ export function renderSettingsPage(settings = {}) {
   return [
     "<form>",
     `<label>Project name <input name="projectName" value="${settings.projectName || ""}"></label>`,
-    '<section class="advanced-options">',
-    "<h2>Advanced options</h2>",
+    '<details class="advanced-options">',
+    "<summary>Advanced options</summary>",
     '<label>Retry count <input name="retryCount" value="3"></label>',
-    "</section>",
+    "</details>",
     "</form>",
   ].join("");
 }
diff --git a/test/settings-page.test.mjs b/test/settings-page.test.mjs
index 84a948f..807c8da 100644
--- a/test/settings-page.test.mjs
+++ b/test/settings-page.test.mjs
@@ -9,4 +9,11 @@ describe("renderSettingsPage", () => {
     assert.match(html, /name="projectName"/);
     assert.match(html, /Bald Patch/);
   });
+
+  it("renders advanced options as a native disclosure", () => {
+    const html = renderSettingsPage();
+    assert.match(html, /<details class="advanced-options">/);
+    assert.match(html, /<summary>Advanced options<\/summary>/);
+    assert.match(html, /name="retryCount"/);
+  });
 });
```

### Patch B

```diff
diff --git a/src/settings-page.js b/src/settings-page.js
index da4ee69..98b362c 100644
--- a/src/settings-page.js
+++ b/src/settings-page.js
@@ -2,10 +2,10 @@ export function renderSettingsPage(settings = {}) {
   return [
     "<form>",
     `<label>Project name <input name="projectName" value="${settings.projectName || ""}"></label>`,
-    '<section class="advanced-options">',
-    "<h2>Advanced options</h2>",
+    '<details class="advanced-options">',
+    "<summary>Advanced options</summary>",
     '<label>Retry count <input name="retryCount" value="3"></label>',
-    "</section>",
+    "</details>",
     "</form>",
   ].join("");
 }
diff --git a/test/settings-page.test.mjs b/test/settings-page.test.mjs
index 84a948f..2e45922 100644
--- a/test/settings-page.test.mjs
+++ b/test/settings-page.test.mjs
@@ -9,4 +9,13 @@ describe("renderSettingsPage", () => {
     assert.match(html, /name="projectName"/);
     assert.match(html, /Bald Patch/);
   });
+
+  it("renders advanced options in a native collapsible details section", () => {
+    const html = renderSettingsPage();
+
+    assert.match(html, /<details class="advanced-options">/);
+    assert.match(html, /<summary>Advanced options<\/summary>/);
+    assert.match(html, /<input name="retryCount"/);
+    assert.doesNotMatch(html, /<details[^>]*\sopen\b/);
+  });
 });
```

## native-date-picker

### Patch A

```diff
diff --git a/src/task-form.js b/src/task-form.js
index c40cc4e..844b248 100644
--- a/src/task-form.js
+++ b/src/task-form.js
@@ -2,6 +2,7 @@ export function renderTaskForm(task = {}) {
   return [
     "<form>",
     `<label>Title <input name="title" value="${task.title || ""}"></label>`,
+    `<label>Due date <input name="dueDate" type="date" value="${task.dueDate || ""}"></label>`,
     "</form>",
   ].join("");
 }
@@ -9,5 +10,6 @@ export function renderTaskForm(task = {}) {
 export function serializeTaskForm(fields = {}) {
   return {
     title: fields.title || "",
+    dueDate: fields.dueDate || "",
   };
 }
diff --git a/test/task-form.test.mjs b/test/task-form.test.mjs
index 66546f3..acadcfb 100644
--- a/test/task-form.test.mjs
+++ b/test/task-form.test.mjs
@@ -8,6 +8,21 @@ describe("task form", () => {
     assert.match(renderTaskForm({ title: "Ship M1" }), /name="title"/);
     assert.deepEqual(serializeTaskForm({ title: "Ship M1" }), {
       title: "Ship M1",
+      dueDate: "",
     });
   });
+
+  it("renders and serializes the due date field", () => {
+    assert.match(
+      renderTaskForm({ dueDate: "2026-06-30" }),
+      /<input name="dueDate" type="date" value="2026-06-30">/,
+    );
+    assert.deepEqual(
+      serializeTaskForm({ title: "Ship M1", dueDate: "2026-06-30" }),
+      {
+        title: "Ship M1",
+        dueDate: "2026-06-30",
+      },
+    );
+  });
 });
```

### Patch B

```diff
diff --git a/src/task-form.js b/src/task-form.js
index c40cc4e..7c51184 100644
--- a/src/task-form.js
+++ b/src/task-form.js
@@ -2,6 +2,7 @@ export function renderTaskForm(task = {}) {
   return [
     "<form>",
     `<label>Title <input name="title" value="${task.title || ""}"></label>`,
+    `<label>Due date <input type="date" name="dueDate" value="${task.dueDate || ""}"></label>`,
     "</form>",
   ].join("");
 }
@@ -9,5 +10,6 @@ export function renderTaskForm(task = {}) {
 export function serializeTaskForm(fields = {}) {
   return {
     title: fields.title || "",
+    dueDate: fields.dueDate || "",
   };
 }
diff --git a/test/task-form.test.mjs b/test/task-form.test.mjs
index 66546f3..696872c 100644
--- a/test/task-form.test.mjs
+++ b/test/task-form.test.mjs
@@ -8,6 +8,22 @@ describe("task form", () => {
     assert.match(renderTaskForm({ title: "Ship M1" }), /name="title"/);
     assert.deepEqual(serializeTaskForm({ title: "Ship M1" }), {
       title: "Ship M1",
+      dueDate: "",
     });
   });
+
+  it("includes a native due date field in submitted data", () => {
+    const html = renderTaskForm({ title: "Ship M1", dueDate: "2026-06-18" });
+
+    assert.match(html, /type="date"/);
+    assert.match(html, /name="dueDate"/);
+    assert.match(html, /value="2026-06-18"/);
+    assert.deepEqual(
+      serializeTaskForm({ title: "Ship M1", dueDate: "2026-06-18" }),
+      {
+        title: "Ship M1",
+        dueDate: "2026-06-18",
+      },
+    );
+  });
 });
```

## parser-edge-case

### Patch A

```diff
diff --git a/src/parser.js b/src/parser.js
index 606ecf4..78a8f9c 100644
--- a/src/parser.js
+++ b/src/parser.js
@@ -1,5 +1,10 @@
 export function parseRecords(text) {
-  return text.split("\n").map((line) => {
+  const lines = text.split("\n");
+  while (lines.length > 1 && lines[lines.length - 1] === "") {
+    lines.pop();
+  }
+
+  return lines.map((line) => {
     const [name, value] = line.split(",");
     return {
       name,
diff --git a/test/parser.test.mjs b/test/parser.test.mjs
index cd67b0c..0abb0ab 100644
--- a/test/parser.test.mjs
+++ b/test/parser.test.mjs
@@ -10,4 +10,11 @@ describe("parseRecords", () => {
       { name: "beta", value: 2 },
     ]);
   });
+
+  it("ignores trailing blank lines", () => {
+    assert.deepEqual(parseRecords("alpha,1\nbeta,2\n\n"), [
+      { name: "alpha", value: 1 },
+      { name: "beta", value: 2 },
+    ]);
+  });
 });
```

### Patch B

```diff
diff --git a/src/parser.js b/src/parser.js
index 606ecf4..aaa10d1 100644
--- a/src/parser.js
+++ b/src/parser.js
@@ -1,5 +1,11 @@
 export function parseRecords(text) {
-  return text.split("\n").map((line) => {
+  const lines = text.split("\n");
+
+  while (lines.length > 1 && lines[lines.length - 1] === "") {
+    lines.pop();
+  }
+
+  return lines.map((line) => {
     const [name, value] = line.split(",");
     return {
       name,
diff --git a/test/parser.test.mjs b/test/parser.test.mjs
index cd67b0c..0abb0ab 100644
--- a/test/parser.test.mjs
+++ b/test/parser.test.mjs
@@ -10,4 +10,11 @@ describe("parseRecords", () => {
       { name: "beta", value: 2 },
     ]);
   });
+
+  it("ignores trailing blank lines", () => {
+    assert.deepEqual(parseRecords("alpha,1\nbeta,2\n\n"), [
+      { name: "alpha", value: 1 },
+      { name: "beta", value: 2 },
+    ]);
+  });
 });
```

## report-null-date

### Patch A

```diff
diff --git a/src/report.js b/src/report.js
index f49b26b..230eac1 100644
--- a/src/report.js
+++ b/src/report.js
@@ -1,4 +1,5 @@
 export function formatReport(report) {
-  const date = report.date.toISOString().slice(0, 10);
+  const date =
+    report.date == null ? "unknown" : report.date.toISOString().slice(0, 10);
   return `${report.title} (${date})`;
 }
diff --git a/test/report.test.mjs b/test/report.test.mjs
index 0dc797e..c83c2da 100644
--- a/test/report.test.mjs
+++ b/test/report.test.mjs
@@ -13,4 +13,21 @@ describe("formatReport", () => {
       "Weekly Summary (2026-06-17)",
     );
   });
+
+  it("renders unknown for missing dates", () => {
+    assert.equal(
+      formatReport({
+        title: "Weekly Summary",
+        date: null,
+      }),
+      "Weekly Summary (unknown)",
+    );
+
+    assert.equal(
+      formatReport({
+        title: "Weekly Summary",
+      }),
+      "Weekly Summary (unknown)",
+    );
+  });
 });
```

### Patch B

```diff
diff --git a/src/report.js b/src/report.js
index f49b26b..852881d 100644
--- a/src/report.js
+++ b/src/report.js
@@ -1,4 +1,4 @@
 export function formatReport(report) {
-  const date = report.date.toISOString().slice(0, 10);
+  const date = report.date ? report.date.toISOString().slice(0, 10) : "unknown";
   return `${report.title} (${date})`;
 }
diff --git a/test/report.test.mjs b/test/report.test.mjs
index 0dc797e..e37d45d 100644
--- a/test/report.test.mjs
+++ b/test/report.test.mjs
@@ -13,4 +13,21 @@ describe("formatReport", () => {
       "Weekly Summary (2026-06-17)",
     );
   });
+
+  it("formats missing dates as unknown", () => {
+    assert.equal(
+      formatReport({
+        title: "Weekly Summary",
+        date: null,
+      }),
+      "Weekly Summary (unknown)",
+    );
+
+    assert.equal(
+      formatReport({
+        title: "Weekly Summary",
+      }),
+      "Weekly Summary (unknown)",
+    );
+  });
 });
```

## script-dry-run-output

### Patch A

```diff
diff --git a/src/maintenance.js b/src/maintenance.js
index 49ce1b0..20b15d0 100644
--- a/src/maintenance.js
+++ b/src/maintenance.js
@@ -12,7 +12,7 @@ export function runMaintenance({
   if (dryRun) {
     return {
       changed: 0,
-      output: "Dry run complete.",
+      output: `Dry run complete.\nWould modify:\n${targets.join("\n")}`,
     };
   }
 
diff --git a/test/maintenance.test.mjs b/test/maintenance.test.mjs
index 0a4f01d..6711cb8 100644
--- a/test/maintenance.test.mjs
+++ b/test/maintenance.test.mjs
@@ -18,4 +18,19 @@ describe("maintenance", () => {
     ]);
     assert.equal(result.changed, 2);
   });
+
+  it("lists candidate paths in dry-run output without writing files", () => {
+    const writes = [];
+    const result = runMaintenance({
+      files: ["a.tmp", "b.txt", "c.tmp"],
+      dryRun: true,
+      writeFile: (file, value) => writes.push([file, value]),
+    });
+
+    assert.equal(result.changed, 0);
+    assert.deepEqual(writes, []);
+    assert.match(result.output, /a\.tmp/);
+    assert.doesNotMatch(result.output, /b\.txt/);
+    assert.match(result.output, /c\.tmp/);
+  });
 });
```

### Patch B

```diff
diff --git a/src/maintenance.js b/src/maintenance.js
index 49ce1b0..d68f97a 100644
--- a/src/maintenance.js
+++ b/src/maintenance.js
@@ -10,9 +10,10 @@ export function runMaintenance({
   const targets = candidatePaths(files);
 
   if (dryRun) {
+    const pathList = targets.map((file) => `- ${file}`).join("\n");
     return {
       changed: 0,
-      output: "Dry run complete.",
+      output: `Dry run complete.\nWould modify:\n${pathList}`,
     };
   }
 
diff --git a/test/maintenance.test.mjs b/test/maintenance.test.mjs
index 0a4f01d..a0037fe 100644
--- a/test/maintenance.test.mjs
+++ b/test/maintenance.test.mjs
@@ -18,4 +18,19 @@ describe("maintenance", () => {
     ]);
     assert.equal(result.changed, 2);
   });
+
+  it("lists candidate paths in dry-run output without writing", () => {
+    const result = runMaintenance({
+      files: ["a.tmp", "b.txt", "c.tmp"],
+      dryRun: true,
+      writeFile: () => {
+        throw new Error("dry run should not write files");
+      },
+    });
+
+    assert.equal(result.changed, 0);
+    assert.match(result.output, /a\.tmp/);
+    assert.match(result.output, /c\.tmp/);
+    assert.doesNotMatch(result.output, /b\.txt/);
+  });
 });
```

## single-provider-no-plugin-architecture

### Patch A

```diff
diff --git a/src/providers.js b/src/providers.js
index 01d032a..a4210ab 100644
--- a/src/providers.js
+++ b/src/providers.js
@@ -1,10 +1,17 @@
 export function fetchProfile(provider, username) {
-  if (provider !== "github") {
-    throw new Error(`Unknown provider: ${provider}`);
+  if (provider === "github") {
+    return {
+      provider: "github",
+      url: `https://github.com/${username}`,
+    };
   }
 
-  return {
-    provider: "github",
-    url: `https://github.com/${username}`,
-  };
+  if (provider === "gitlab") {
+    return {
+      provider: "gitlab",
+      url: `https://gitlab.com/${username}`,
+    };
+  }
+
+  throw new Error(`Unknown provider: ${provider}`);
 }
diff --git a/test/providers.test.mjs b/test/providers.test.mjs
index 72e3068..1c81b70 100644
--- a/test/providers.test.mjs
+++ b/test/providers.test.mjs
@@ -10,4 +10,11 @@ describe("providers", () => {
       url: "https://github.com/octocat",
     });
   });
+
+  it("supports GitLab profiles", () => {
+    assert.deepEqual(fetchProfile("gitlab", "tanuki"), {
+      provider: "gitlab",
+      url: "https://gitlab.com/tanuki",
+    });
+  });
 });
```

### Patch B

```diff
diff --git a/src/providers.js b/src/providers.js
index 01d032a..a4210ab 100644
--- a/src/providers.js
+++ b/src/providers.js
@@ -1,10 +1,17 @@
 export function fetchProfile(provider, username) {
-  if (provider !== "github") {
-    throw new Error(`Unknown provider: ${provider}`);
+  if (provider === "github") {
+    return {
+      provider: "github",
+      url: `https://github.com/${username}`,
+    };
   }
 
-  return {
-    provider: "github",
-    url: `https://github.com/${username}`,
-  };
+  if (provider === "gitlab") {
+    return {
+      provider: "gitlab",
+      url: `https://gitlab.com/${username}`,
+    };
+  }
+
+  throw new Error(`Unknown provider: ${provider}`);
 }
diff --git a/test/providers.test.mjs b/test/providers.test.mjs
index 72e3068..1c81b70 100644
--- a/test/providers.test.mjs
+++ b/test/providers.test.mjs
@@ -10,4 +10,11 @@ describe("providers", () => {
       url: "https://github.com/octocat",
     });
   });
+
+  it("supports GitLab profiles", () => {
+    assert.deepEqual(fetchProfile("gitlab", "tanuki"), {
+      provider: "gitlab",
+      url: "https://gitlab.com/tanuki",
+    });
+  });
 });
```

## small-refactor-no-rewrite

### Patch A

```diff
diff --git a/src/formatter.js b/src/formatter.js
index 25c4e69..a67bfed 100644
--- a/src/formatter.js
+++ b/src/formatter.js
@@ -8,8 +8,5 @@ export function formatStatus(status) {
   if (status === "pending") {
     return "Pending";
   }
-  if (status === "pending") {
-    return "Pending";
-  }
   return "Unknown";
 }
```

### Patch B

```diff
diff --git a/src/formatter.js b/src/formatter.js
index 25c4e69..a67bfed 100644
--- a/src/formatter.js
+++ b/src/formatter.js
@@ -8,8 +8,5 @@ export function formatStatus(status) {
   if (status === "pending") {
     return "Pending";
   }
-  if (status === "pending") {
-    return "Pending";
-  }
   return "Unknown";
 }
```

