# Bald Patch Blind Review Packet

Review the patches by correctness, scope, safety, tests, maintainability, and expected human rework.
For each patch, fill decision, expected rework minutes, scores, dependency judgment, abstraction judgment, overbuild risk, and underbuild risk.
Use risk values `none`, `low`, `medium`, or `high`.
Use the answer template at the end. Do not use private run metadata.

## Task task-001

Request: Add a JSON output flag to a CLI

Add a --json flag to the CLI so it prints the same result object as JSON. Keep the default human-readable output unchanged.

### Patch A

```diff
diff --git a/src/summary-cli.js b/src/summary-cli.js
index de3ba8e..dc70e16 100644
--- a/src/summary-cli.js
+++ b/src/summary-cli.js
@@ -14,7 +14,8 @@ export function formatText(summary) {
 
 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
   const summary = buildSummary();
-  stdout.write(`${formatText(summary)}\n`);
+  const output = argv.includes("--json") ? JSON.stringify(summary) : formatText(summary);
+  stdout.write(`${output}\n`);
 }
 
 if (import.meta.url === pathToFileURL(process.argv[1]).href) {
diff --git a/test/summary-cli.test.mjs b/test/summary-cli.test.mjs
index 7258447..4ec5f6d 100644
--- a/test/summary-cli.test.mjs
+++ b/test/summary-cli.test.mjs
@@ -1,15 +1,34 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 
-import { buildSummary, formatText } from "../src/summary-cli.js";
+import { main } from "../src/summary-cli.js";
 
 describe("summary CLI", () => {
   it("keeps the default human-readable output", () => {
-    assert.deepEqual(buildSummary(), {
+    let output = "";
+
+    main([], {
+      write(chunk) {
+        output += chunk;
+      },
+    });
+
+    assert.equal(output, "2 passed, 1 failed (3 total)\n");
+  });
+
+  it("prints the summary object as JSON when requested", () => {
+    let output = "";
+
+    main(["--json"], {
+      write(chunk) {
+        output += chunk;
+      },
+    });
+
+    assert.deepEqual(JSON.parse(output), {
       total: 3,
       passed: 2,
       failed: 1,
     });
-    assert.equal(formatText(buildSummary()), "2 passed, 1 failed (3 total)");
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
index 7258447..2762b59 100644
--- a/test/summary-cli.test.mjs
+++ b/test/summary-cli.test.mjs
@@ -1,7 +1,7 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 
-import { buildSummary, formatText } from "../src/summary-cli.js";
+import { buildSummary, formatText, main } from "../src/summary-cli.js";
 
 describe("summary CLI", () => {
   it("keeps the default human-readable output", () => {
@@ -12,4 +12,16 @@ describe("summary CLI", () => {
     });
     assert.equal(formatText(buildSummary()), "2 passed, 1 failed (3 total)");
   });
+
+  it("prints the summary as JSON with --json", () => {
+    let output = "";
+
+    main(["--json"], {
+      write(chunk) {
+        output += chunk;
+      },
+    });
+
+    assert.equal(output, `${JSON.stringify(buildSummary())}\n`);
+  });
 });
```

## Task task-002

Request: Debounce a search input

Debounce the search input by 250ms while keeping the existing search behavior working.

### Patch A

```diff
diff --git a/src/search.js b/src/search.js
index d82a382..5c950c3 100644
--- a/src/search.js
+++ b/src/search.js
@@ -1,7 +1,12 @@
 export function createSearchController({ search }) {
+  let searchTimeout;
+
   return {
     input(value) {
-      search(value);
+      clearTimeout(searchTimeout);
+      searchTimeout = setTimeout(() => {
+        search(value);
+      }, 250);
     },
   };
 }
diff --git a/test/search.test.mjs b/test/search.test.mjs
index 4809481..fa18c69 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -8,4 +8,22 @@ describe("search controller", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("debounces input by 250ms and searches for the latest value", (t) => {
+    t.mock.timers.enable({ apis: ["setTimeout"] });
+
+    const searches = [];
+    const controller = createSearchController({
+      search: (value) => searches.push(value),
+    });
+
+    controller.input("a");
+    controller.input("ab");
+
+    t.mock.timers.tick(249);
+    assert.deepEqual(searches, []);
+
+    t.mock.timers.tick(1);
+    assert.deepEqual(searches, ["ab"]);
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
index 4809481..fd36a5d 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -1,5 +1,6 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
+import { setTimeout as delay } from "node:timers/promises";
 
 import { createSearchController } from "../src/search.js";
 
@@ -8,4 +9,20 @@ describe("search controller", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("debounces search input by 250ms", async () => {
+    const searches = [];
+    const controller = createSearchController({
+      search: (value) => searches.push(value),
+    });
+
+    controller.input("a");
+    controller.input("ap");
+    await delay(240);
+    assert.deepEqual(searches, []);
+
+    controller.input("app");
+    await delay(260);
+    assert.deepEqual(searches, ["app"]);
+  });
 });
```

## Task task-003

Request: Validate email input

Reject obviously invalid email addresses in the signup form while keeping common valid addresses accepted.

### Patch A

```diff
diff --git a/src/signup.js b/src/signup.js
index 3b82a6e..f97195a 100644
--- a/src/signup.js
+++ b/src/signup.js
@@ -6,6 +6,8 @@ export function validateSignup({ name, email } = {}) {
   }
   if (!email) {
     errors.push("email is required");
+  } else if (!isValidEmail(email)) {
+    errors.push("email is invalid");
   }
 
   return {
@@ -13,3 +15,17 @@ export function validateSignup({ name, email } = {}) {
     errors,
   };
 }
+
+function isValidEmail(email) {
+  if (typeof email !== "string" || /\s/.test(email)) {
+    return false;
+  }
+
+  const parts = email.split("@");
+  if (parts.length !== 2 || !parts[0] || !parts[1]) {
+    return false;
+  }
+
+  const domainLabels = parts[1].split(".");
+  return domainLabels.length > 1 && domainLabels.every(Boolean);
+}
diff --git a/test/signup.test.mjs b/test/signup.test.mjs
index 143de02..f5e1471 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,34 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("rejects obviously invalid email addresses", () => {
+    for (const email of [
+      "plainaddress",
+      "missing-domain@",
+      "@missing-local.test",
+      "user@example",
+      "user@example..com",
+      "user name@example.com",
+      "user@@example.com",
+    ]) {
+      assert.deepEqual(validateSignup({ name: "Ava", email }), {
+        ok: false,
+        errors: ["email is invalid"],
+      });
+    }
+  });
+
+  it("accepts common valid email addresses", () => {
+    for (const email of [
+      "user@example.com",
+      "first.last@example.co.uk",
+      "first+label@example.io",
+    ]) {
+      assert.deepEqual(validateSignup({ name: "Ava", email }), {
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
index 3b82a6e..155a910 100644
--- a/src/signup.js
+++ b/src/signup.js
@@ -6,6 +6,8 @@ export function validateSignup({ name, email } = {}) {
   }
   if (!email) {
     errors.push("email is required");
+  } else if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(email)) {
+    errors.push("email is invalid");
   }
 
   return {
diff --git a/test/signup.test.mjs b/test/signup.test.mjs
index 143de02..14bc82e 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,31 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("accepts common valid email addresses", () => {
+    for (const email of [
+      "person@example.com",
+      "first.last+tag@sub.example.co",
+    ]) {
+      assert.deepEqual(validateSignup({ name: "Ada", email }), {
+        ok: true,
+        errors: [],
+      });
+    }
+  });
+
+  it("rejects obviously invalid email addresses", () => {
+    for (const email of [
+      "person",
+      "person@example",
+      "person@.com",
+      "person@example..com",
+      "person @example.com",
+    ]) {
+      assert.deepEqual(validateSignup({ name: "Ada", email }), {
+        ok: false,
+        errors: ["email is invalid"],
+      });
+    }
+  });
 });
```

## Task task-005

Request: Add a due-date field

Add a due-date field to the form. Keep the value connected to the existing form state and submit flow.

### Patch A

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
index 66546f3..cb1e863 100644
--- a/test/task-form.test.mjs
+++ b/test/task-form.test.mjs
@@ -8,6 +8,19 @@ describe("task form", () => {
     assert.match(renderTaskForm({ title: "Ship M1" }), /name="title"/);
     assert.deepEqual(serializeTaskForm({ title: "Ship M1" }), {
       title: "Ship M1",
+      dueDate: "",
+    });
+  });
+
+  it("keeps the due date connected to render and submit flow", () => {
+    const html = renderTaskForm({ dueDate: "2026-07-01" });
+
+    assert.match(html, /type="date"/);
+    assert.match(html, /name="dueDate"/);
+    assert.match(html, /value="2026-07-01"/);
+    assert.deepEqual(serializeTaskForm({ dueDate: "2026-07-01" }), {
+      title: "",
+      dueDate: "2026-07-01",
     });
   });
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
index 66546f3..feedad3 100644
--- a/test/task-form.test.mjs
+++ b/test/task-form.test.mjs
@@ -8,6 +8,29 @@ describe("task form", () => {
     assert.match(renderTaskForm({ title: "Ship M1" }), /name="title"/);
     assert.deepEqual(serializeTaskForm({ title: "Ship M1" }), {
       title: "Ship M1",
+      dueDate: "",
+    });
+  });
+
+  it("includes the due-date field in render and submit state", () => {
+    const html = renderTaskForm({ title: "Ship M2", dueDate: "2026-07-15" });
+
+    assert.match(html, /Due date/);
+    assert.match(html, /type="date" name="dueDate" value="2026-07-15"/);
+    assert.deepEqual(
+      serializeTaskForm({ title: "Ship M2", dueDate: "2026-07-15" }),
+      {
+        title: "Ship M2",
+        dueDate: "2026-07-15",
+      },
+    );
+  });
+
+  it("preserves default state for new task forms", () => {
+    assert.match(renderTaskForm(), /name="dueDate" value=""/);
+    assert.deepEqual(serializeTaskForm(), {
+      title: "",
+      dueDate: "",
     });
   });
 });
```

## Task task-008

Request: Make dry-run output explicit

Update the maintenance script so dry-run mode prints the file paths it would modify. Do not change write mode behavior.

### Patch A

```diff
diff --git a/src/maintenance.js b/src/maintenance.js
index 49ce1b0..ef0a210 100644
--- a/src/maintenance.js
+++ b/src/maintenance.js
@@ -10,9 +10,13 @@ export function runMaintenance({
   const targets = candidatePaths(files);
 
   if (dryRun) {
+    const targetList = targets.length
+      ? targets.map((file) => `Would modify: ${file}`).join("\n")
+      : "Would modify: none";
+
     return {
       changed: 0,
-      output: "Dry run complete.",
+      output: `Dry run complete.\n${targetList}`,
     };
   }
 
diff --git a/test/maintenance.test.mjs b/test/maintenance.test.mjs
index 0a4f01d..2b3ff48 100644
--- a/test/maintenance.test.mjs
+++ b/test/maintenance.test.mjs
@@ -17,5 +17,22 @@ describe("maintenance", () => {
       ["c.tmp", "cleaned"],
     ]);
     assert.equal(result.changed, 2);
+    assert.equal(result.output, "Updated 2 files.");
+  });
+
+  it("prints paths it would modify in dry-run mode", () => {
+    const writes = [];
+    const result = runMaintenance({
+      files: ["a.tmp", "b.txt", "c.tmp"],
+      dryRun: true,
+      writeFile: (file, value) => writes.push([file, value]),
+    });
+
+    assert.deepEqual(writes, []);
+    assert.equal(result.changed, 0);
+    assert.equal(
+      result.output,
+      "Dry run complete.\nWould modify: a.tmp\nWould modify: c.tmp",
+    );
   });
 });
```

### Patch B

```diff
diff --git a/src/maintenance.js b/src/maintenance.js
index 49ce1b0..bf50370 100644
--- a/src/maintenance.js
+++ b/src/maintenance.js
@@ -12,7 +12,7 @@ export function runMaintenance({
   if (dryRun) {
     return {
       changed: 0,
-      output: "Dry run complete.",
+      output: `Dry run would update ${targets.length} files: ${targets.join(", ")}`,
     };
   }
 
diff --git a/test/maintenance.test.mjs b/test/maintenance.test.mjs
index 0a4f01d..b7c5110 100644
--- a/test/maintenance.test.mjs
+++ b/test/maintenance.test.mjs
@@ -18,4 +18,17 @@ describe("maintenance", () => {
     ]);
     assert.equal(result.changed, 2);
   });
+
+  it("prints paths it would modify in dry-run mode", () => {
+    const writes = [];
+    const result = runMaintenance({
+      files: ["a.tmp", "b.txt", "c.tmp"],
+      dryRun: true,
+      writeFile: (file, value) => writes.push([file, value]),
+    });
+
+    assert.deepEqual(writes, []);
+    assert.equal(result.changed, 0);
+    assert.equal(result.output, "Dry run would update 2 files: a.tmp, c.tmp");
+  });
 });
```

## Task task-011

Request: Align billing total formatting

Introduce a shared `formatAmount` helper and use it from both invoice and receipt summaries, so both show totals as dollar amounts while keeping their labels unchanged.

### Patch A

```diff
diff --git a/src/invoice.js b/src/invoice.js
index 5107929..313bb3b 100644
--- a/src/invoice.js
+++ b/src/invoice.js
@@ -1,7 +1,9 @@
+import { formatAmount } from "./formatAmount.js";
+
 export function formatInvoiceTotal(cents) {
-  return `$${(cents / 100).toFixed(2)}`;
+  return formatAmount(cents);
 }
 
 export function invoiceSummary(cents) {
-  return `Invoice total: ${formatInvoiceTotal(cents)}`;
+  return `Invoice total: ${formatAmount(cents)}`;
 }
diff --git a/src/receipt.js b/src/receipt.js
index bd80277..c56b57d 100644
--- a/src/receipt.js
+++ b/src/receipt.js
@@ -1,7 +1,9 @@
+import { formatAmount } from "./formatAmount.js";
+
 export function formatReceiptTotal(cents) {
-  return `${(cents / 100).toFixed(2)} USD`;
+  return formatAmount(cents);
 }
 
 export function receiptSummary(cents) {
-  return `Receipt total: ${formatReceiptTotal(cents)}`;
+  return `Receipt total: ${formatAmount(cents)}`;
 }
diff --git a/test/billing.test.mjs b/test/billing.test.mjs
index 19d16fd..4f4525a 100644
--- a/test/billing.test.mjs
+++ b/test/billing.test.mjs
@@ -10,6 +10,6 @@ describe("billing summaries", () => {
   });
 
   it("keeps the existing receipt label", () => {
-    assert.match(receiptSummary(1234), /^Receipt total: /);
+    assert.equal(receiptSummary(1234), "Receipt total: $12.34");
   });
 });
diff --git a/src/formatAmount.js b/src/formatAmount.js
new file mode 100644
index 0000000..021af62
--- /dev/null
+++ b/src/formatAmount.js
@@ -0,0 +1,3 @@
+export function formatAmount(cents) {
+  return `$${(cents / 100).toFixed(2)}`;
+}
```

### Patch B

```diff
diff --git a/src/invoice.js b/src/invoice.js
index 5107929..61e49d5 100644
--- a/src/invoice.js
+++ b/src/invoice.js
@@ -1,5 +1,7 @@
+import { formatAmount } from "./amount.js";
+
 export function formatInvoiceTotal(cents) {
-  return `$${(cents / 100).toFixed(2)}`;
+  return formatAmount(cents);
 }
 
 export function invoiceSummary(cents) {
diff --git a/src/receipt.js b/src/receipt.js
index bd80277..db04d67 100644
--- a/src/receipt.js
+++ b/src/receipt.js
@@ -1,5 +1,7 @@
+import { formatAmount } from "./amount.js";
+
 export function formatReceiptTotal(cents) {
-  return `${(cents / 100).toFixed(2)} USD`;
+  return formatAmount(cents);
 }
 
 export function receiptSummary(cents) {
diff --git a/test/billing.test.mjs b/test/billing.test.mjs
index 19d16fd..4f4525a 100644
--- a/test/billing.test.mjs
+++ b/test/billing.test.mjs
@@ -10,6 +10,6 @@ describe("billing summaries", () => {
   });
 
   it("keeps the existing receipt label", () => {
-    assert.match(receiptSummary(1234), /^Receipt total: /);
+    assert.equal(receiptSummary(1234), "Receipt total: $12.34");
   });
 });
diff --git a/src/amount.js b/src/amount.js
new file mode 100644
index 0000000..021af62
--- /dev/null
+++ b/src/amount.js
@@ -0,0 +1,3 @@
+export function formatAmount(cents) {
+  return `$${(cents / 100).toFixed(2)}`;
+}
```

## Answer Template

```json
[
  {
    "task_id": "task-001",
    "preferred_patch": "",
    "confidence": null,
    "reason": "",
    "patches": {
      "A": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      },
      "B": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      }
    }
  },
  {
    "task_id": "task-002",
    "preferred_patch": "",
    "confidence": null,
    "reason": "",
    "patches": {
      "A": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      },
      "B": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      }
    }
  },
  {
    "task_id": "task-003",
    "preferred_patch": "",
    "confidence": null,
    "reason": "",
    "patches": {
      "A": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      },
      "B": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      }
    }
  },
  {
    "task_id": "task-005",
    "preferred_patch": "",
    "confidence": null,
    "reason": "",
    "patches": {
      "A": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      },
      "B": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      }
    }
  },
  {
    "task_id": "task-008",
    "preferred_patch": "",
    "confidence": null,
    "reason": "",
    "patches": {
      "A": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      },
      "B": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      }
    }
  },
  {
    "task_id": "task-011",
    "preferred_patch": "",
    "confidence": null,
    "reason": "",
    "patches": {
      "A": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      },
      "B": {
        "decision": "",
        "expected_rework_minutes": null,
        "scores": {
          "requirements": null,
          "correctness_safety": null,
          "test_adequacy": null,
          "maintainability_reviewability": null
        },
        "dependency_judgment": "",
        "abstraction_judgment": "",
        "overbuild_risk": "",
        "underbuild_risk": ""
      }
    }
  }
]
```
