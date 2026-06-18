# Bald Patch Blind Review Packet

Review the patches by correctness, scope, safety, tests, maintainability, and expected human rework.
For each patch, fill decision, expected rework minutes, scores, dependency judgment, abstraction judgment, overbuild risk, and underbuild risk.
Use risk values `none`, `low`, `medium`, or `high`.
Use the answer template at the end. Do not use private run metadata.

## Task m5-task-001

Request: Add a JSON output flag to a CLI

Add a --json flag to the CLI so it prints the same result object as JSON. Keep the default human-readable output unchanged.

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
index 7258447..1cc4f75 100644
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
+  it("prints the default human-readable output from main", () => {
+    let output = "";
+    main([], { write: (chunk) => { output += chunk; } });
+
+    assert.equal(output, "2 passed, 1 failed (3 total)\n");
+  });
+
+  it("prints the summary object as JSON", () => {
+    let output = "";
+    main(["--json"], { write: (chunk) => { output += chunk; } });
+
+    assert.deepEqual(JSON.parse(output), buildSummary());
+  });
 });
```

### Patch B

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
index 7258447..f071226 100644
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
+  it("prints the default human-readable output from the CLI", () => {
+    let output = "";
+    main([], { write: (chunk) => (output += chunk) });
+
+    assert.equal(output, "2 passed, 1 failed (3 total)\n");
+  });
+
+  it("prints the result object as JSON with --json", () => {
+    let output = "";
+    main(["--json"], { write: (chunk) => (output += chunk) });
+
+    assert.equal(output, '{"total":3,"passed":2,"failed":1}\n');
+  });
 });
```

## Task m5-task-002

Request: Debounce a search input

Debounce the search input by 250ms while keeping the existing search behavior working.

### Patch A

```diff
diff --git a/src/search.js b/src/search.js
index d82a382..d2c101d 100644
--- a/src/search.js
+++ b/src/search.js
@@ -1,7 +1,14 @@
-export function createSearchController({ search }) {
+export function createSearchController({
+  search,
+  setTimer = setTimeout,
+  clearTimer = clearTimeout,
+}) {
+  let timer;
+
   return {
     input(value) {
-      search(value);
+      clearTimer(timer);
+      timer = setTimer(() => search(value), 250);
     },
   };
 }
diff --git a/test/search.test.mjs b/test/search.test.mjs
index 4809481..74ad59f 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -8,4 +8,35 @@ describe("search controller", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("debounces input changes by 250ms", () => {
+    const calls = [];
+    const timers = new Map();
+    let nextTimerId = 1;
+
+    const controller = createSearchController({
+      search: (value) => calls.push(value),
+      setTimer(callback, delay) {
+        const id = nextTimerId++;
+        timers.set(id, { callback, delay });
+        return id;
+      },
+      clearTimer(id) {
+        timers.delete(id);
+      },
+    });
+
+    controller.input("a");
+    controller.input("ab");
+
+    assert.deepEqual(calls, []);
+    assert.equal(timers.size, 1);
+
+    const [{ callback, delay }] = timers.values();
+    assert.equal(delay, 250);
+
+    callback();
+
+    assert.deepEqual(calls, ["ab"]);
+  });
 });
```

### Patch B

```diff
diff --git a/src/search.js b/src/search.js
index d82a382..e069291 100644
--- a/src/search.js
+++ b/src/search.js
@@ -1,7 +1,16 @@
-export function createSearchController({ search }) {
+export function createSearchController({
+  search,
+  setTimeout = globalThis.setTimeout,
+  clearTimeout = globalThis.clearTimeout,
+}) {
+  let searchTimer;
+
   return {
     input(value) {
-      search(value);
+      clearTimeout(searchTimer);
+      searchTimer = setTimeout(() => {
+        search(value);
+      }, 250);
     },
   };
 }
diff --git a/test/search.test.mjs b/test/search.test.mjs
index 4809481..311631f 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -8,4 +8,35 @@ describe("search controller", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("debounces search input by 250ms", () => {
+    const calls = [];
+    const timers = new Map();
+    let nextTimerId = 1;
+
+    const controller = createSearchController({
+      search: (value) => calls.push(value),
+      setTimeout: (callback, delay) => {
+        const id = nextTimerId++;
+        timers.set(id, { callback, delay });
+        return id;
+      },
+      clearTimeout: (id) => {
+        timers.delete(id);
+      },
+    });
+
+    controller.input("a");
+    controller.input("ab");
+
+    assert.deepEqual(calls, []);
+    assert.equal(timers.size, 1);
+
+    const [{ callback, delay }] = timers.values();
+    assert.equal(delay, 250);
+
+    callback();
+
+    assert.deepEqual(calls, ["ab"]);
+  });
 });
```

## Task m5-task-003

Request: Validate email input

Reject obviously invalid email addresses in the signup form while keeping common valid addresses accepted.

### Patch A

```diff
diff --git a/src/signup.js b/src/signup.js
index 3b82a6e..4919086 100644
--- a/src/signup.js
+++ b/src/signup.js
@@ -1,11 +1,16 @@
+const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
+
 export function validateSignup({ name, email } = {}) {
   const errors = [];
+  const emailValue = typeof email === "string" ? email.trim() : email;
 
   if (!name) {
     errors.push("name is required");
   }
-  if (!email) {
+  if (!emailValue) {
     errors.push("email is required");
+  } else if (!EMAIL_PATTERN.test(emailValue)) {
+    errors.push("email is invalid");
   }
 
   return {
diff --git a/test/signup.test.mjs b/test/signup.test.mjs
index 143de02..79927e8 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,32 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("accepts common valid email addresses", () => {
+    for (const email of [
+      "person@example.com",
+      "first.last+tag@example.co.uk",
+      "dev-team@example.io",
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
+      "person@",
+      "@example.com",
+      "person@example",
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

### Patch B

```diff
diff --git a/src/signup.js b/src/signup.js
index 3b82a6e..6a6b7a8 100644
--- a/src/signup.js
+++ b/src/signup.js
@@ -6,6 +6,8 @@ export function validateSignup({ name, email } = {}) {
   }
   if (!email) {
     errors.push("email is required");
+  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
+    errors.push("email is invalid");
   }
 
   return {
diff --git a/test/signup.test.mjs b/test/signup.test.mjs
index 143de02..f6d2f95 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,34 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("accepts common valid email addresses", () => {
+    for (const email of [
+      "sam@example.com",
+      "sam.smith@example.co.uk",
+      "sam+signup@example.io",
+      "sam_smith-42@example-domain.com",
+    ]) {
+      assert.deepEqual(validateSignup({ name: "Sam", email }), {
+        ok: true,
+        errors: [],
+      });
+    }
+  });
+
+  it("rejects obviously invalid email addresses", () => {
+    for (const email of [
+      "sam",
+      "sam@example",
+      "sam example@example.com",
+      "sam@@example.com",
+      "@example.com",
+      "sam@",
+    ]) {
+      assert.deepEqual(validateSignup({ name: "Sam", email }), {
+        ok: false,
+        errors: ["email is invalid"],
+      });
+    }
+  });
 });
```

## Task m5-task-004

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
index 66546f3..29c6419 100644
--- a/test/task-form.test.mjs
+++ b/test/task-form.test.mjs
@@ -8,6 +8,20 @@ describe("task form", () => {
     assert.match(renderTaskForm({ title: "Ship M1" }), /name="title"/);
     assert.deepEqual(serializeTaskForm({ title: "Ship M1" }), {
       title: "Ship M1",
+      dueDate: "",
     });
   });
+
+  it("connects the due-date field to form state and submit data", () => {
+    const html = renderTaskForm({ title: "Ship M1", dueDate: "2026-07-15" });
+
+    assert.match(html, /type="date" name="dueDate" value="2026-07-15"/);
+    assert.deepEqual(
+      serializeTaskForm({ title: "Ship M1", dueDate: "2026-07-15" }),
+      {
+        title: "Ship M1",
+        dueDate: "2026-07-15",
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
index 66546f3..e4bfda8 100644
--- a/test/task-form.test.mjs
+++ b/test/task-form.test.mjs
@@ -8,6 +8,20 @@ describe("task form", () => {
     assert.match(renderTaskForm({ title: "Ship M1" }), /name="title"/);
     assert.deepEqual(serializeTaskForm({ title: "Ship M1" }), {
       title: "Ship M1",
+      dueDate: "",
     });
   });
+
+  it("keeps due date connected to form state and serialization", () => {
+    const html = renderTaskForm({ title: "Ship M1", dueDate: "2026-07-01" });
+
+    assert.match(html, /type="date" name="dueDate" value="2026-07-01"/);
+    assert.deepEqual(
+      serializeTaskForm({ title: "Ship M1", dueDate: "2026-07-01" }),
+      {
+        title: "Ship M1",
+        dueDate: "2026-07-01",
+      },
+    );
+  });
 });
```

## Task m5-task-005

Request: Make dry-run output explicit

Update the maintenance script so dry-run mode prints the file paths it would modify. Do not change write mode behavior.

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
index 0a4f01d..2612dec 100644
--- a/test/maintenance.test.mjs
+++ b/test/maintenance.test.mjs
@@ -17,5 +17,19 @@ describe("maintenance", () => {
       ["c.tmp", "cleaned"],
     ]);
     assert.equal(result.changed, 2);
+    assert.equal(result.output, "Updated 2 files.");
+  });
+
+  it("prints paths dry run would modify", () => {
+    const writes = [];
+    const result = runMaintenance({
+      files: ["a.tmp", "b.txt", "c.tmp"],
+      dryRun: true,
+      writeFile: (file, value) => writes.push([file, value]),
+    });
+
+    assert.deepEqual(writes, []);
+    assert.equal(result.changed, 0);
+    assert.equal(result.output, "Dry run complete.\nWould modify:\na.tmp\nc.tmp");
   });
 });
```

### Patch B

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
index 0a4f01d..ba85300 100644
--- a/test/maintenance.test.mjs
+++ b/test/maintenance.test.mjs
@@ -17,5 +17,19 @@ describe("maintenance", () => {
       ["c.tmp", "cleaned"],
     ]);
     assert.equal(result.changed, 2);
+    assert.equal(result.output, "Updated 2 files.");
+  });
+
+  it("prints dry-run paths it would modify", () => {
+    const writes = [];
+    const result = runMaintenance({
+      files: ["a.tmp", "b.txt", "c.tmp"],
+      dryRun: true,
+      writeFile: (file, value) => writes.push([file, value]),
+    });
+
+    assert.deepEqual(writes, []);
+    assert.equal(result.changed, 0);
+    assert.equal(result.output, "Dry run complete.\nWould modify:\na.tmp\nc.tmp");
   });
 });
```

## Task m5-task-007

Request: Centralize duplicated amount formatting

Centralize the duplicated cents-to-dollar formatting used by invoice and receipt line items. Keep both labels unchanged.

### Patch A

```diff
diff --git a/src/line-items.js b/src/line-items.js
index 52a8531..24d9611 100644
--- a/src/line-items.js
+++ b/src/line-items.js
@@ -1,7 +1,11 @@
+function formatDollars(cents) {
+  return `$${(cents / 100).toFixed(2)}`;
+}
+
 export function invoiceLine(cents) {
-  return `Invoice line: $${(cents / 100).toFixed(2)}`;
+  return `Invoice line: ${formatDollars(cents)}`;
 }
 
 export function receiptLine(cents) {
-  return `Receipt line: $${(cents / 100).toFixed(2)}`;
+  return `Receipt line: ${formatDollars(cents)}`;
 }
```

### Patch B

```diff
diff --git a/src/line-items.js b/src/line-items.js
index 52a8531..24d9611 100644
--- a/src/line-items.js
+++ b/src/line-items.js
@@ -1,7 +1,11 @@
+function formatDollars(cents) {
+  return `$${(cents / 100).toFixed(2)}`;
+}
+
 export function invoiceLine(cents) {
-  return `Invoice line: $${(cents / 100).toFixed(2)}`;
+  return `Invoice line: ${formatDollars(cents)}`;
 }
 
 export function receiptLine(cents) {
-  return `Receipt line: $${(cents / 100).toFixed(2)}`;
+  return `Receipt line: ${formatDollars(cents)}`;
 }
```

## Task m5-task-008

Request: Respect an injected timer delay

Add a custom delayMs option to the existing scheduleReminder options object while preserving the existing default delay and injected timer path.

### Patch A

```diff
diff --git a/src/reminder.js b/src/reminder.js
index 1ce639d..b6ed41e 100644
--- a/src/reminder.js
+++ b/src/reminder.js
@@ -1,3 +1,3 @@
-export function scheduleReminder({ notify, setTimer = setTimeout }, message) {
-  return setTimer(() => notify(message), 1000);
+export function scheduleReminder({ notify, setTimer = setTimeout, delayMs = 1000 }, message) {
+  return setTimer(() => notify(message), delayMs);
 }
diff --git a/test/reminder.test.mjs b/test/reminder.test.mjs
index bb42a14..dd989ab 100644
--- a/test/reminder.test.mjs
+++ b/test/reminder.test.mjs
@@ -19,4 +19,18 @@ describe("scheduleReminder", () => {
     assert.deepEqual(delays, [1000]);
     assert.deepEqual(messages, ["check in"]);
   });
+
+  it("uses a custom delay with the injected timer", () => {
+    const delays = [];
+
+    scheduleReminder({
+      notify: () => {},
+      setTimer: (callback, delay) => {
+        delays.push(delay);
+      },
+      delayMs: 2500,
+    }, "check in");
+
+    assert.deepEqual(delays, [2500]);
+  });
 });
```

### Patch B

```diff
diff --git a/src/reminder.js b/src/reminder.js
index 1ce639d..b6ed41e 100644
--- a/src/reminder.js
+++ b/src/reminder.js
@@ -1,3 +1,3 @@
-export function scheduleReminder({ notify, setTimer = setTimeout }, message) {
-  return setTimer(() => notify(message), 1000);
+export function scheduleReminder({ notify, setTimer = setTimeout, delayMs = 1000 }, message) {
+  return setTimer(() => notify(message), delayMs);
 }
diff --git a/test/reminder.test.mjs b/test/reminder.test.mjs
index bb42a14..d70bed6 100644
--- a/test/reminder.test.mjs
+++ b/test/reminder.test.mjs
@@ -19,4 +19,21 @@ describe("scheduleReminder", () => {
     assert.deepEqual(delays, [1000]);
     assert.deepEqual(messages, ["check in"]);
   });
+
+  it("uses a custom delay with the injected timer", () => {
+    const delays = [];
+    const messages = [];
+
+    scheduleReminder({
+      delayMs: 2500,
+      notify: (message) => messages.push(message),
+      setTimer: (callback, delay) => {
+        delays.push(delay);
+        callback();
+      },
+    }, "follow up");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["follow up"]);
+  });
 });
```

## Task m5-task-010

Request: Serialize an optional nickname field

Accept an optional nickname field from submitted profile form entries. Keep existing name serialization unchanged.

### Patch A

```diff
diff --git a/src/profile-form.js b/src/profile-form.js
index 20807d8..a6853b2 100644
--- a/src/profile-form.js
+++ b/src/profile-form.js
@@ -1,5 +1,11 @@
 export function serializeProfileForm(entries) {
-  return {
+  const profile = {
     name: String(entries.name || "").trim(),
   };
+
+  if (Object.hasOwn(entries, "nickname")) {
+    profile.nickname = String(entries.nickname || "").trim();
+  }
+
+  return profile;
 }
diff --git a/test/profile-form.test.mjs b/test/profile-form.test.mjs
index 332f33f..b7ffc68 100644
--- a/test/profile-form.test.mjs
+++ b/test/profile-form.test.mjs
@@ -9,4 +9,11 @@ describe("serializeProfileForm", () => {
       name: "Ada",
     });
   });
+
+  it("serializes a submitted nickname field", () => {
+    assert.deepEqual(serializeProfileForm({ name: " Ada ", nickname: " Countess " }), {
+      name: "Ada",
+      nickname: "Countess",
+    });
+  });
 });
```

### Patch B

```diff
diff --git a/src/profile-form.js b/src/profile-form.js
index 20807d8..e14714e 100644
--- a/src/profile-form.js
+++ b/src/profile-form.js
@@ -1,5 +1,11 @@
 export function serializeProfileForm(entries) {
-  return {
+  const serialized = {
     name: String(entries.name || "").trim(),
   };
+
+  if (Object.hasOwn(entries, "nickname")) {
+    serialized.nickname = String(entries.nickname || "").trim();
+  }
+
+  return serialized;
 }
diff --git a/test/profile-form.test.mjs b/test/profile-form.test.mjs
index 332f33f..ede8a3e 100644
--- a/test/profile-form.test.mjs
+++ b/test/profile-form.test.mjs
@@ -9,4 +9,14 @@ describe("serializeProfileForm", () => {
       name: "Ada",
     });
   });
+
+  it("serializes a submitted nickname", () => {
+    assert.deepEqual(
+      serializeProfileForm({ name: " Ada ", nickname: " Countess " }),
+      {
+        name: "Ada",
+        nickname: "Countess",
+      },
+    );
+  });
 });
```

## Task m5-task-011

Request: Filter terse CLI id output

Add an --active-only flag to the id-list CLI. Keep output as raw ids, one per line, with no headings or labels.

### Patch A

```diff
diff --git a/src/id-list.js b/src/id-list.js
index 4602c25..2767ba4 100644
--- a/src/id-list.js
+++ b/src/id-list.js
@@ -11,7 +11,11 @@ export function formatIds(items = ITEMS) {
 }
 
 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
-  stdout.write(formatIds(ITEMS));
+  const items = argv.includes("--active-only")
+    ? ITEMS.filter((item) => item.active)
+    : ITEMS;
+
+  stdout.write(formatIds(items));
 }
 
 if (import.meta.url === pathToFileURL(process.argv[1]).href) {
diff --git a/test/id-list.test.mjs b/test/id-list.test.mjs
index 095e0cd..3505e50 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -1,10 +1,24 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 
-import { formatIds } from "../src/id-list.js";
+import { formatIds, main } from "../src/id-list.js";
 
 describe("formatIds", () => {
   it("prints raw ids one per line", () => {
     assert.equal(formatIds(), "a1\nb2\nc3\n");
   });
 });
+
+describe("main", () => {
+  it("prints only active raw ids with --active-only", () => {
+    let output = "";
+
+    main(["--active-only"], {
+      write(chunk) {
+        output += chunk;
+      },
+    });
+
+    assert.equal(output, "a1\nc3\n");
+  });
+});
```

### Patch B

```diff
diff --git a/src/id-list.js b/src/id-list.js
index 4602c25..83fda8f 100644
--- a/src/id-list.js
+++ b/src/id-list.js
@@ -6,12 +6,13 @@ const ITEMS = [
   { id: "c3", active: true },
 ];
 
-export function formatIds(items = ITEMS) {
-  return `${items.map((item) => item.id).join("\n")}\n`;
+export function formatIds(items = ITEMS, { activeOnly = false } = {}) {
+  const selectedItems = activeOnly ? items.filter((item) => item.active) : items;
+  return `${selectedItems.map((item) => item.id).join("\n")}\n`;
 }
 
 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
-  stdout.write(formatIds(ITEMS));
+  stdout.write(formatIds(ITEMS, { activeOnly: argv.includes("--active-only") }));
 }
 
 if (import.meta.url === pathToFileURL(process.argv[1]).href) {
diff --git a/test/id-list.test.mjs b/test/id-list.test.mjs
index 095e0cd..65f5c49 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -7,4 +7,8 @@ describe("formatIds", () => {
   it("prints raw ids one per line", () => {
     assert.equal(formatIds(), "a1\nb2\nc3\n");
   });
+
+  it("can print only active ids", () => {
+    assert.equal(formatIds(undefined, { activeOnly: true }), "a1\nc3\n");
+  });
 });
```

## Task m5-task-012

Request: Collapse obsolete total-format wrappers

Replace the invoice and receipt total-format wrapper functions with one shared formatAmount helper, and call that helper directly from both summaries.

### Patch A

```diff
diff --git a/src/invoice.js b/src/invoice.js
index 5107929..10cb4a7 100644
--- a/src/invoice.js
+++ b/src/invoice.js
@@ -1,7 +1,5 @@
-export function formatInvoiceTotal(cents) {
-  return `$${(cents / 100).toFixed(2)}`;
-}
+import { formatAmount } from "./formatAmount.js";
 
 export function invoiceSummary(cents) {
-  return `Invoice total: ${formatInvoiceTotal(cents)}`;
+  return `Invoice total: ${formatAmount(cents)}`;
 }
diff --git a/src/receipt.js b/src/receipt.js
index bd80277..e986169 100644
--- a/src/receipt.js
+++ b/src/receipt.js
@@ -1,7 +1,5 @@
-export function formatReceiptTotal(cents) {
-  return `${(cents / 100).toFixed(2)} USD`;
-}
+import { formatAmount } from "./formatAmount.js";
 
 export function receiptSummary(cents) {
-  return `Receipt total: ${formatReceiptTotal(cents)}`;
+  return `Receipt total: ${formatAmount(cents)}`;
 }
diff --git a/test/billing.test.mjs b/test/billing.test.mjs
index a96485c..fd23057 100644
--- a/test/billing.test.mjs
+++ b/test/billing.test.mjs
@@ -5,8 +5,8 @@ import { invoiceSummary } from "../src/invoice.js";
 import { receiptSummary } from "../src/receipt.js";
 
 describe("billing summaries", () => {
-  it("keeps existing labels", () => {
+  it("formats totals with the shared amount formatter", () => {
     assert.equal(invoiceSummary(1234), "Invoice total: $12.34");
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
index 5107929..10cb4a7 100644
--- a/src/invoice.js
+++ b/src/invoice.js
@@ -1,7 +1,5 @@
-export function formatInvoiceTotal(cents) {
-  return `$${(cents / 100).toFixed(2)}`;
-}
+import { formatAmount } from "./formatAmount.js";
 
 export function invoiceSummary(cents) {
-  return `Invoice total: ${formatInvoiceTotal(cents)}`;
+  return `Invoice total: ${formatAmount(cents)}`;
 }
diff --git a/src/receipt.js b/src/receipt.js
index bd80277..e986169 100644
--- a/src/receipt.js
+++ b/src/receipt.js
@@ -1,7 +1,5 @@
-export function formatReceiptTotal(cents) {
-  return `${(cents / 100).toFixed(2)} USD`;
-}
+import { formatAmount } from "./formatAmount.js";
 
 export function receiptSummary(cents) {
-  return `Receipt total: ${formatReceiptTotal(cents)}`;
+  return `Receipt total: ${formatAmount(cents)}`;
 }
diff --git a/test/billing.test.mjs b/test/billing.test.mjs
index a96485c..a3cc6fb 100644
--- a/test/billing.test.mjs
+++ b/test/billing.test.mjs
@@ -7,6 +7,6 @@ import { receiptSummary } from "../src/receipt.js";
 describe("billing summaries", () => {
   it("keeps existing labels", () => {
     assert.equal(invoiceSummary(1234), "Invoice total: $12.34");
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

## Answer Template

```json
[
  {
    "task_id": "m5-task-001",
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
    "task_id": "m5-task-002",
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
    "task_id": "m5-task-003",
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
    "task_id": "m5-task-004",
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
    "task_id": "m5-task-005",
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
    "task_id": "m5-task-007",
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
    "task_id": "m5-task-008",
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
    "task_id": "m5-task-010",
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
    "task_id": "m5-task-011",
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
    "task_id": "m5-task-012",
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
