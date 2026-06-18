# Bald Patch Blind Review Packet

Review the patches by correctness, scope, safety, tests, maintainability, and expected human rework.
For each patch, fill decision, expected rework minutes, scores, dependency judgment, abstraction judgment, overbuild risk, and underbuild risk.
Use risk values `none`, `low`, `medium`, or `high`.
Use the answer template at the end. Do not use private run metadata.

## Task m5-task-002

Request: Debounce a search input

Debounce the search input by 250ms while keeping the existing search behavior working.

### Patch A

```diff
diff --git a/src/search.js b/src/search.js
index d82a382..c34fcc6 100644
--- a/src/search.js
+++ b/src/search.js
@@ -1,7 +1,20 @@
-export function createSearchController({ search }) {
+export function createSearchController({
+  search,
+  setTimeout: schedule = globalThis.setTimeout,
+  clearTimeout: cancel = globalThis.clearTimeout,
+}) {
+  let pendingSearch = null;
+
   return {
     input(value) {
-      search(value);
+      if (pendingSearch !== null) {
+        cancel(pendingSearch);
+      }
+
+      pendingSearch = schedule(() => {
+        pendingSearch = null;
+        search(value);
+      }, 250);
     },
   };
 }
diff --git a/test/search.test.mjs b/test/search.test.mjs
index 4809481..22f6fbb 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -8,4 +8,34 @@ describe("search controller", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("debounces search input by 250ms", () => {
+    const searches = [];
+    const scheduledTimers = [];
+    const canceledTimers = [];
+
+    const controller = createSearchController({
+      search: (value) => searches.push(value),
+      setTimeout(callback, delay) {
+        const timer = { callback, delay };
+        scheduledTimers.push(timer);
+        return scheduledTimers.length - 1;
+      },
+      clearTimeout: (timer) => canceledTimers.push(timer),
+    });
+
+    controller.input("apples");
+    controller.input("oranges");
+
+    assert.deepEqual(
+      scheduledTimers.map((timer) => timer.delay),
+      [250, 250],
+    );
+    assert.deepEqual(canceledTimers, [0]);
+    assert.deepEqual(searches, []);
+
+    scheduledTimers[1].callback();
+
+    assert.deepEqual(searches, ["oranges"]);
+  });
 });
```

### Patch B

```diff
diff --git a/src/search.js b/src/search.js
index d82a382..d433032 100644
--- a/src/search.js
+++ b/src/search.js
@@ -1,7 +1,16 @@
-export function createSearchController({ search }) {
+export function createSearchController({
+  search,
+  setTimeout = globalThis.setTimeout,
+  clearTimeout = globalThis.clearTimeout,
+}) {
+  let pendingSearch;
+
   return {
     input(value) {
-      search(value);
+      clearTimeout(pendingSearch);
+      pendingSearch = setTimeout(() => {
+        search(value);
+      }, 250);
     },
   };
 }
diff --git a/test/search.test.mjs b/test/search.test.mjs
index 4809481..d1360bf 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -8,4 +8,57 @@ describe("search controller", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("debounces search input by 250ms", () => {
+    const calls = [];
+    let scheduledTask;
+    let scheduledDelay;
+    const controller = createSearchController({
+      search: (value) => calls.push(value),
+      setTimeout(task, delay) {
+        scheduledTask = task;
+        scheduledDelay = delay;
+        return 1;
+      },
+      clearTimeout: () => {},
+    });
+
+    controller.input("book");
+
+    assert.equal(scheduledDelay, 250);
+    assert.deepEqual(calls, []);
+
+    scheduledTask();
+
+    assert.deepEqual(calls, ["book"]);
+  });
+
+  it("keeps only the latest pending search", () => {
+    const calls = [];
+    const pendingTasks = new Map();
+    let nextTaskId = 1;
+    const controller = createSearchController({
+      search: (value) => calls.push(value),
+      setTimeout(task) {
+        const taskId = nextTaskId;
+        nextTaskId += 1;
+        pendingTasks.set(taskId, task);
+        return taskId;
+      },
+      clearTimeout(taskId) {
+        pendingTasks.delete(taskId);
+      },
+    });
+
+    controller.input("bo");
+    controller.input("book");
+
+    assert.deepEqual([...pendingTasks.keys()], [2]);
+
+    for (const task of pendingTasks.values()) {
+      task();
+    }
+
+    assert.deepEqual(calls, ["book"]);
+  });
 });
```

## Task m5-task-003

Request: Validate email input

Reject obviously invalid email addresses in the signup form while keeping common valid addresses accepted.

### Patch A

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
index 143de02..c329a57 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,32 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("accepts common valid email addresses", () => {
+    assert.deepEqual(validateSignup({ name: "Sam", email: "sam@example.com" }), {
+      ok: true,
+      errors: [],
+    });
+    assert.deepEqual(
+      validateSignup({ name: "Sam", email: "sam.smith+news@example.co.uk" }),
+      {
+        ok: true,
+        errors: [],
+      },
+    );
+  });
+
+  it("rejects obviously invalid email addresses", () => {
+    for (const email of [
+      "sam",
+      "sam@example",
+      "sam@@example.com",
+      "sam example@example.com",
+    ]) {
+      assert.deepEqual(validateSignup({ name: "Sam", email }), {
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
index 143de02..aa48f0a 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,27 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("accepts common valid email addresses", () => {
+    assert.deepEqual(validateSignup({ name: "Ada", email: "ada@example.com" }), {
+      ok: true,
+      errors: [],
+    });
+    assert.deepEqual(
+      validateSignup({ name: "Ada", email: "ada.lovelace+notes@sub.example.co" }),
+      {
+        ok: true,
+        errors: [],
+      },
+    );
+  });
+
+  it("rejects obviously invalid email addresses", () => {
+    for (const email of ["ada", "ada@", "@example.com", "ada@example", "ada example.com"]) {
+      assert.deepEqual(validateSignup({ name: "Ada", email }), {
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
index 66546f3..364247e 100644
--- a/test/task-form.test.mjs
+++ b/test/task-form.test.mjs
@@ -8,6 +8,18 @@ describe("task form", () => {
     assert.match(renderTaskForm({ title: "Ship M1" }), /name="title"/);
     assert.deepEqual(serializeTaskForm({ title: "Ship M1" }), {
       title: "Ship M1",
+      dueDate: "",
+    });
+  });
+
+  it("connects the due date field to form state and submit data", () => {
+    assert.match(
+      renderTaskForm({ dueDate: "2026-07-01" }),
+      /<input type="date" name="dueDate" value="2026-07-01">/,
+    );
+    assert.deepEqual(serializeTaskForm({ title: "Ship M1", dueDate: "2026-07-01" }), {
+      title: "Ship M1",
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
index 66546f3..5f44943 100644
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
+  it("includes a populated due date field", () => {
+    assert.match(
+      renderTaskForm({ dueDate: "2026-07-01" }),
+      /type="date" name="dueDate" value="2026-07-01"/,
+    );
+    assert.deepEqual(
+      serializeTaskForm({ title: "Ship M2", dueDate: "2026-07-01" }),
+      {
+        title: "Ship M2",
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
index 0a4f01d..0d07419 100644
--- a/test/maintenance.test.mjs
+++ b/test/maintenance.test.mjs
@@ -17,5 +17,19 @@ describe("maintenance", () => {
       ["c.tmp", "cleaned"],
     ]);
     assert.equal(result.changed, 2);
+    assert.equal(result.output, "Updated 2 files.");
+  });
+
+  it("prints paths that dry-run mode would modify", () => {
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
index bb42a14..62e7d23 100644
--- a/test/reminder.test.mjs
+++ b/test/reminder.test.mjs
@@ -19,4 +19,21 @@ describe("scheduleReminder", () => {
     assert.deepEqual(delays, [1000]);
     assert.deepEqual(messages, ["check in"]);
   });
+
+  it("uses a custom delay", () => {
+    const delays = [];
+    const messages = [];
+
+    scheduleReminder({
+      notify: (message) => messages.push(message),
+      setTimer: (callback, delay) => {
+        delays.push(delay);
+        callback();
+      },
+      delayMs: 2500,
+    }, "stand up");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["stand up"]);
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
index bb42a14..21b29a7 100644
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
+      notify: (message) => messages.push(message),
+      setTimer: (callback, delay) => {
+        delays.push(delay);
+        callback();
+      },
+      delayMs: 250,
+    }, "stretch");
+
+    assert.deepEqual(delays, [250]);
+    assert.deepEqual(messages, ["stretch"]);
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
index 095e0cd..04d1916 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -1,10 +1,28 @@
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
+  it("prints all ids by default", () => {
+    let output = "";
+
+    main([], { write: (chunk) => (output += chunk) });
+
+    assert.equal(output, "a1\nb2\nc3\n");
+  });
+
+  it("prints only active ids with --active-only", () => {
+    let output = "";
+
+    main(["--active-only"], { write: (chunk) => (output += chunk) });
+
+    assert.equal(output, "a1\nc3\n");
+  });
+});
```

### Patch B

```diff
diff --git a/src/id-list.js b/src/id-list.js
index 4602c25..182c67f 100644
--- a/src/id-list.js
+++ b/src/id-list.js
@@ -6,12 +6,13 @@ const ITEMS = [
   { id: "c3", active: true },
 ];

-export function formatIds(items = ITEMS) {
-  return `${items.map((item) => item.id).join("\n")}\n`;
+export function formatIds(items = ITEMS, { activeOnly = false } = {}) {
+  const filteredItems = activeOnly ? items.filter((item) => item.active) : items;
+  return `${filteredItems.map((item) => item.id).join("\n")}\n`;
 }

 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
-  stdout.write(formatIds(ITEMS));
+  stdout.write(formatIds(ITEMS, { activeOnly: argv.includes("--active-only") }));
 }

 if (import.meta.url === pathToFileURL(process.argv[1]).href) {
diff --git a/test/id-list.test.mjs b/test/id-list.test.mjs
index 095e0cd..9656d1e 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -1,10 +1,22 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";

-import { formatIds } from "../src/id-list.js";
+import { formatIds, main } from "../src/id-list.js";

 describe("formatIds", () => {
   it("prints raw ids one per line", () => {
     assert.equal(formatIds(), "a1\nb2\nc3\n");
   });
+
+  it("prints only active ids with --active-only", () => {
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
 });
```

## Answer Template

```json
[
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
  }
]
```
