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
index 7258447..c3eb031 100644
--- a/test/summary-cli.test.mjs
+++ b/test/summary-cli.test.mjs
@@ -1,7 +1,7 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";

-import { buildSummary, formatText } from "../src/summary-cli.js";
+import { buildSummary, formatText, main } from "../src/summary-cli.js";

 describe("summary CLI", () => {
   it("keeps the default human-readable output", () => {
@@ -12,4 +12,17 @@ describe("summary CLI", () => {
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
+    assert.equal(output, `${JSON.stringify(buildSummary())}\n`);
+  });
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
index 7258447..99ea2db 100644
--- a/test/summary-cli.test.mjs
+++ b/test/summary-cli.test.mjs
@@ -1,7 +1,7 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";

-import { buildSummary, formatText } from "../src/summary-cli.js";
+import { buildSummary, formatText, main } from "../src/summary-cli.js";

 describe("summary CLI", () => {
   it("keeps the default human-readable output", () => {
@@ -11,5 +11,17 @@ describe("summary CLI", () => {
       failed: 1,
     });
     assert.equal(formatText(buildSummary()), "2 passed, 1 failed (3 total)");
+
+    let output = "";
+    main([], { write: (chunk) => { output += chunk; } });
+    assert.equal(output, "2 passed, 1 failed (3 total)\n");
+  });
+
+  it("prints the summary object as JSON with --json", () => {
+    let output = "";
+    main(["--json"], { write: (chunk) => { output += chunk; } });
+
+    assert.equal(output, '{"total":3,"passed":2,"failed":1}\n');
+    assert.deepEqual(JSON.parse(output), buildSummary());
   });
 });
```

### Patch C

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
index 7258447..fe55939 100644
--- a/test/summary-cli.test.mjs
+++ b/test/summary-cli.test.mjs
@@ -1,7 +1,7 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";

-import { buildSummary, formatText } from "../src/summary-cli.js";
+import { buildSummary, formatText, main } from "../src/summary-cli.js";

 describe("summary CLI", () => {
   it("keeps the default human-readable output", () => {
@@ -12,4 +12,28 @@ describe("summary CLI", () => {
     });
     assert.equal(formatText(buildSummary()), "2 passed, 1 failed (3 total)");
   });
+
+  it("prints the summary as JSON when requested", () => {
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
+
+  it("keeps main's default output human-readable", () => {
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
 });
```

### Patch D

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
index 7258447..d59f55d 100644
--- a/test/summary-cli.test.mjs
+++ b/test/summary-cli.test.mjs
@@ -1,7 +1,7 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";

-import { buildSummary, formatText } from "../src/summary-cli.js";
+import { buildSummary, formatText, main } from "../src/summary-cli.js";

 describe("summary CLI", () => {
   it("keeps the default human-readable output", () => {
@@ -11,5 +11,17 @@ describe("summary CLI", () => {
       failed: 1,
     });
     assert.equal(formatText(buildSummary()), "2 passed, 1 failed (3 total)");
+
+    let output = "";
+    main([], { write: (chunk) => { output += chunk; } });
+    assert.equal(output, "2 passed, 1 failed (3 total)\n");
+  });
+
+  it("prints the summary result as JSON with --json", () => {
+    let output = "";
+    main(["--json"], { write: (chunk) => { output += chunk; } });
+
+    assert.equal(output, `${JSON.stringify(buildSummary())}\n`);
+    assert.deepEqual(JSON.parse(output), buildSummary());
   });
 });
```

## Task m5-task-002

Request: Debounce a search input

Debounce the search input by 250ms while keeping the existing search behavior working.

### Patch A

```diff
diff --git a/src/search.js b/src/search.js
index d82a382..ad6f68f 100644
--- a/src/search.js
+++ b/src/search.js
@@ -1,7 +1,16 @@
-export function createSearchController({ search }) {
+export function createSearchController({
+  search,
+  setTimeout: schedule = setTimeout,
+  clearTimeout: cancel = clearTimeout,
+}) {
+  let pendingSearch;
+
   return {
     input(value) {
-      search(value);
+      cancel(pendingSearch);
+      pendingSearch = schedule(() => {
+        search(value);
+      }, 250);
     },
   };
 }
diff --git a/test/search.test.mjs b/test/search.test.mjs
index 4809481..2f01219 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -3,9 +3,73 @@ import { describe, it } from "node:test";

 import { createSearchController } from "../src/search.js";

+function createTimers() {
+  let nextId = 1;
+  let now = 0;
+  const timers = new Map();
+
+  return {
+    setTimeout(callback, delay) {
+      const id = nextId++;
+      timers.set(id, { callback, time: now + delay });
+      return id;
+    },
+    clearTimeout(id) {
+      timers.delete(id);
+    },
+    tick(ms) {
+      now += ms;
+      for (const [id, timer] of [...timers]) {
+        if (timer.time <= now) {
+          timers.delete(id);
+          timer.callback();
+        }
+      }
+    },
+  };
+}
+
 describe("search controller", () => {
   it("exposes an input handler", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("searches with the input value after 250ms", () => {
+    const timers = createTimers();
+    const searches = [];
+    const controller = createSearchController({
+      search: (value) => searches.push(value),
+      setTimeout: timers.setTimeout,
+      clearTimeout: timers.clearTimeout,
+    });
+
+    controller.input("react");
+    timers.tick(249);
+    assert.deepEqual(searches, []);
+
+    timers.tick(1);
+    assert.deepEqual(searches, ["react"]);
+  });
+
+  it("debounces repeated input and searches the latest value", () => {
+    const timers = createTimers();
+    const searches = [];
+    const controller = createSearchController({
+      search: (value) => searches.push(value),
+      setTimeout: timers.setTimeout,
+      clearTimeout: timers.clearTimeout,
+    });
+
+    controller.input("r");
+    timers.tick(100);
+    controller.input("re");
+    timers.tick(100);
+    controller.input("rea");
+    timers.tick(249);
+    assert.deepEqual(searches, []);
+
+    timers.tick(1);
+    assert.deepEqual(searches, ["rea"]);
+  });
 });
```

### Patch B

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
index 4809481..f727ab1 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -1,5 +1,5 @@
 import assert from "node:assert/strict";
-import { describe, it } from "node:test";
+import { describe, it, mock } from "node:test";

 import { createSearchController } from "../src/search.js";

@@ -8,4 +8,50 @@ describe("search controller", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("debounces search input by 250ms", () => {
+    mock.timers.enable({ apis: ["setTimeout"] });
+
+    try {
+      const searches = [];
+      const controller = createSearchController({
+        search: (value) => searches.push(value),
+      });
+
+      controller.input("alpha");
+
+      mock.timers.tick(249);
+      assert.deepEqual(searches, []);
+
+      mock.timers.tick(1);
+      assert.deepEqual(searches, ["alpha"]);
+    } finally {
+      mock.timers.reset();
+    }
+  });
+
+  it("searches the latest input value after repeated input", () => {
+    mock.timers.enable({ apis: ["setTimeout"] });
+
+    try {
+      const searches = [];
+      const controller = createSearchController({
+        search: (value) => searches.push(value),
+      });
+
+      controller.input("a");
+      mock.timers.tick(100);
+      controller.input("ab");
+      mock.timers.tick(100);
+      controller.input("abc");
+      mock.timers.tick(249);
+
+      assert.deepEqual(searches, []);
+
+      mock.timers.tick(1);
+      assert.deepEqual(searches, ["abc"]);
+    } finally {
+      mock.timers.reset();
+    }
+  });
 });
```

### Patch C

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
index 4809481..1fb6242 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -1,11 +1,33 @@
 import assert from "node:assert/strict";
-import { describe, it } from "node:test";
+import { afterEach, describe, it, mock } from "node:test";

 import { createSearchController } from "../src/search.js";

 describe("search controller", () => {
+  afterEach(() => {
+    mock.timers.reset();
+  });
+
   it("exposes an input handler", () => {
     const controller = createSearchController({ search: () => {} });
     assert.equal(typeof controller.input, "function");
   });
+
+  it("debounces search input by 250ms", () => {
+    mock.timers.enable({ apis: ["setTimeout"] });
+
+    const searches = [];
+    const controller = createSearchController({
+      search: (value) => searches.push(value),
+    });
+
+    controller.input("r");
+    controller.input("re");
+
+    assert.deepEqual(searches, []);
+    mock.timers.tick(249);
+    assert.deepEqual(searches, []);
+    mock.timers.tick(1);
+    assert.deepEqual(searches, ["re"]);
+  });
 });
```

### Patch D

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
index 4809481..686cd5b 100644
--- a/test/search.test.mjs
+++ b/test/search.test.mjs
@@ -1,5 +1,6 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
+import { setTimeout as delay } from "node:timers/promises";

 import { createSearchController } from "../src/search.js";

@@ -8,4 +9,23 @@ describe("search controller", () => {
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
+    await delay(100);
+    controller.input("ab");
+    await delay(100);
+    controller.input("abc");
+
+    assert.deepEqual(searches, []);
+
+    await delay(260);
+
+    assert.deepEqual(searches, ["abc"]);
+  });
 });
```

## Task m5-task-003

Request: Validate email input

Reject obviously invalid email addresses in the signup form while keeping common valid addresses accepted.

### Patch A

```diff
diff --git a/src/signup.js b/src/signup.js
index 3b82a6e..9c48141 100644
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
@@ -13,3 +15,11 @@ export function validateSignup({ name, email } = {}) {
     errors,
   };
 }
+
+function isValidEmail(email) {
+  return (
+    typeof email === "string" &&
+    !email.includes("..") &&
+    /^[^\s@.](?:[^\s@]*[^\s@.])?@(?:[^\s@.]+\.)+[^\s@.]{2,}$/.test(email)
+  );
+}
diff --git a/test/signup.test.mjs b/test/signup.test.mjs
index 143de02..4a7e258 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,38 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("rejects obviously invalid email addresses", () => {
+    for (const email of [
+      "plainaddress",
+      "missing-at.example.com",
+      "user@",
+      "@example.com",
+      "user@example",
+      "user name@example.com",
+      "user@@example.com",
+      "user@.example.com",
+      "user@example..com",
+      "user@example.com.",
+    ]) {
+      assert.deepEqual(validateSignup({ name: "Ada", email }), {
+        ok: false,
+        errors: ["email is invalid"],
+      });
+    }
+  });
+
+  it("accepts common valid email addresses", () => {
+    for (const email of [
+      "user@example.com",
+      "first.last+tag@example.co.uk",
+      "user_name@example.io",
+      "user-name@sub.example.com",
+    ]) {
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
index 3b82a6e..511b9f3 100644
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
@@ -13,3 +15,12 @@ export function validateSignup({ name, email } = {}) {
     errors,
   };
 }
+
+function isValidEmail(email) {
+  return (
+    typeof email === "string" &&
+    email.length <= 254 &&
+    /^[^\s@]+@[^\s@.][^\s@]*\.[^\s@.][^\s@]*$/.test(email) &&
+    !email.includes("..")
+  );
+}
diff --git a/test/signup.test.mjs b/test/signup.test.mjs
index 143de02..6ce012d 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,33 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("accepts common valid email addresses", () => {
+    for (const email of [
+      "person@example.com",
+      "first.last+tag@sub.example.co.uk",
+      "user_name-123@example.io",
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
+      "person example@example.com",
+      "person@example..com",
+    ]) {
+      assert.deepEqual(validateSignup({ name: "Ada", email }), {
+        ok: false,
+        errors: ["email is invalid"],
+      });
+    }
+  });
 });
```

### Patch C

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
index 143de02..2896895 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,22 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("rejects obviously invalid email addresses", () => {
+    for (const email of ["plainaddress", "missing-at.example.com", "missing-domain@", "@missing-local.com", "has spaces@example.com"]) {
+      assert.deepEqual(validateSignup({ name: "Ada", email }), {
+        ok: false,
+        errors: ["email is invalid"],
+      });
+    }
+  });
+
+  it("accepts common valid email addresses", () => {
+    for (const email of ["ada@example.com", "first.last+tag@example.co.uk", "user_name@example.io"]) {
+      assert.deepEqual(validateSignup({ name: "Ada", email }), {
+        ok: true,
+        errors: [],
+      });
+    }
+  });
 });
```

### Patch D

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
index 143de02..6485dd0 100644
--- a/test/signup.test.mjs
+++ b/test/signup.test.mjs
@@ -10,4 +10,28 @@ describe("validateSignup", () => {
       errors: ["name is required", "email is required"],
     });
   });
+
+  it("accepts common valid email addresses", () => {
+    for (const email of ["user@example.com", "first.last+tag@example.co.uk"]) {
+      assert.deepEqual(validateSignup({ name: "Ada", email }), {
+        ok: true,
+        errors: [],
+      });
+    }
+  });
+
+  it("rejects obviously invalid email addresses", () => {
+    for (const email of [
+      "plainaddress",
+      "missing-at.example.com",
+      "missing-domain@",
+      "@missing-local.com",
+      "has space@example.com",
+    ]) {
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
index 66546f3..62d724c 100644
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
+  it("keeps the due-date field connected to form state", () => {
+    assert.match(
+      renderTaskForm({ dueDate: "2026-07-01" }),
+      /<input type="date" name="dueDate" value="2026-07-01">/,
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
index 66546f3..138cb5e 100644
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
+  it("keeps the due-date field connected to form state", () => {
+    assert.match(
+      renderTaskForm({ dueDate: "2026-06-30" }),
+      /type="date" name="dueDate" value="2026-06-30"/,
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

### Patch C

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
index 66546f3..4d311af 100644
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
+  it("keeps the due-date field connected to form state", () => {
+    assert.match(
+      renderTaskForm({ dueDate: "2026-06-30" }),
+      /<input type="date" name="dueDate" value="2026-06-30">/,
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

### Patch D

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
index 66546f3..2f36836 100644
--- a/test/task-form.test.mjs
+++ b/test/task-form.test.mjs
@@ -8,6 +8,25 @@ describe("task form", () => {
     assert.match(renderTaskForm({ title: "Ship M1" }), /name="title"/);
     assert.deepEqual(serializeTaskForm({ title: "Ship M1" }), {
       title: "Ship M1",
+      dueDate: "",
     });
   });
+
+  it("keeps due date connected to form state and submit serialization", () => {
+    const html = renderTaskForm({
+      title: "Ship M1",
+      dueDate: "2026-06-18",
+    });
+
+    assert.match(html, /name="dueDate"/);
+    assert.match(html, /type="date"/);
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
index 0a4f01d..d730a85 100644
--- a/test/maintenance.test.mjs
+++ b/test/maintenance.test.mjs
@@ -17,5 +17,19 @@ describe("maintenance", () => {
       ["c.tmp", "cleaned"],
     ]);
     assert.equal(result.changed, 2);
+    assert.equal(result.output, "Updated 2 files.");
+  });
+
+  it("prints dry-run paths without writing files", () => {
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
index 49ce1b0..190eab8 100644
--- a/src/maintenance.js
+++ b/src/maintenance.js
@@ -12,7 +12,7 @@ export function runMaintenance({
   if (dryRun) {
     return {
       changed: 0,
-      output: "Dry run complete.",
+      output: ["Dry run complete.", ...targets.map((file) => `Would modify: ${file}`)].join("\n"),
     };
   }

diff --git a/test/maintenance.test.mjs b/test/maintenance.test.mjs
index 0a4f01d..6d276f6 100644
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
+    assert.equal(result.output, "Dry run complete.\nWould modify: a.tmp\nWould modify: c.tmp");
   });
 });
```

### Patch C

```diff
diff --git a/src/maintenance.js b/src/maintenance.js
index 49ce1b0..a656c13 100644
--- a/src/maintenance.js
+++ b/src/maintenance.js
@@ -10,9 +10,11 @@ export function runMaintenance({
   const targets = candidatePaths(files);

   if (dryRun) {
+    const output = ["Dry run complete.", ...targets.map((file) => `Would update ${file}`)];
+
     return {
       changed: 0,
-      output: "Dry run complete.",
+      output: output.join("\n"),
     };
   }

diff --git a/test/maintenance.test.mjs b/test/maintenance.test.mjs
index 0a4f01d..df9a5f6 100644
--- a/test/maintenance.test.mjs
+++ b/test/maintenance.test.mjs
@@ -4,6 +4,19 @@ import { describe, it } from "node:test";
 import { candidatePaths, runMaintenance } from "../src/maintenance.js";

 describe("maintenance", () => {
+  it("prints target paths in dry-run mode", () => {
+    const writes = [];
+    const result = runMaintenance({
+      files: ["a.tmp", "b.txt", "c.tmp"],
+      dryRun: true,
+      writeFile: (file, value) => writes.push([file, value]),
+    });
+
+    assert.deepEqual(writes, []);
+    assert.equal(result.changed, 0);
+    assert.equal(result.output, "Dry run complete.\nWould update a.tmp\nWould update c.tmp");
+  });
+
   it("keeps write mode behavior", () => {
     const writes = [];
     const result = runMaintenance({
```

### Patch D

```diff
diff --git a/src/maintenance.js b/src/maintenance.js
index 49ce1b0..613501e 100644
--- a/src/maintenance.js
+++ b/src/maintenance.js
@@ -12,7 +12,7 @@ export function runMaintenance({
   if (dryRun) {
     return {
       changed: 0,
-      output: "Dry run complete.",
+      output: ["Dry run complete.", ...targets].join("\n"),
     };
   }

diff --git a/test/maintenance.test.mjs b/test/maintenance.test.mjs
index 0a4f01d..faa2a67 100644
--- a/test/maintenance.test.mjs
+++ b/test/maintenance.test.mjs
@@ -18,4 +18,17 @@ describe("maintenance", () => {
     ]);
     assert.equal(result.changed, 2);
   });
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
+    assert.equal(result.output, "Dry run complete.\na.tmp\nc.tmp");
+  });
 });
```

## Task m5-task-006

Request: Align billing total formatting

Introduce a shared `formatAmount` helper and use it from both invoice and receipt summaries, so both show totals as dollar amounts while keeping their labels unchanged.

### Patch A

```diff
diff --git a/src/invoice.js b/src/invoice.js
index 5107929..00f4d74 100644
--- a/src/invoice.js
+++ b/src/invoice.js
@@ -1,5 +1,7 @@
+import { formatAmount } from "./formatAmount.js";
+
 export function formatInvoiceTotal(cents) {
-  return `$${(cents / 100).toFixed(2)}`;
+  return formatAmount(cents);
 }

 export function invoiceSummary(cents) {
diff --git a/src/receipt.js b/src/receipt.js
index bd80277..17c1aa3 100644
--- a/src/receipt.js
+++ b/src/receipt.js
@@ -1,5 +1,7 @@
+import { formatAmount } from "./formatAmount.js";
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

### Patch C

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

### Patch D

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

## Task m5-task-007

Request: Centralize duplicated amount formatting

Centralize the duplicated cents-to-dollar formatting used by invoice and receipt line items. Keep both labels unchanged.

### Patch A

```diff
diff --git a/src/line-items.js b/src/line-items.js
index 52a8531..990f406 100644
--- a/src/line-items.js
+++ b/src/line-items.js
@@ -1,7 +1,11 @@
+function formatLineAmount(cents) {
+  return `$${(cents / 100).toFixed(2)}`;
+}
+
 export function invoiceLine(cents) {
-  return `Invoice line: $${(cents / 100).toFixed(2)}`;
+  return `Invoice line: ${formatLineAmount(cents)}`;
 }

 export function receiptLine(cents) {
-  return `Receipt line: $${(cents / 100).toFixed(2)}`;
+  return `Receipt line: ${formatLineAmount(cents)}`;
 }
```

### Patch B

```diff
diff --git a/src/line-items.js b/src/line-items.js
index 52a8531..7eadee4 100644
--- a/src/line-items.js
+++ b/src/line-items.js
@@ -1,7 +1,11 @@
+function formatAmount(cents) {
+  return `$${(cents / 100).toFixed(2)}`;
+}
+
 export function invoiceLine(cents) {
-  return `Invoice line: $${(cents / 100).toFixed(2)}`;
+  return `Invoice line: ${formatAmount(cents)}`;
 }

 export function receiptLine(cents) {
-  return `Receipt line: $${(cents / 100).toFixed(2)}`;
+  return `Receipt line: ${formatAmount(cents)}`;
 }
```

### Patch C

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

### Patch D

```diff
diff --git a/src/line-items.js b/src/line-items.js
index 52a8531..7eadee4 100644
--- a/src/line-items.js
+++ b/src/line-items.js
@@ -1,7 +1,11 @@
+function formatAmount(cents) {
+  return `$${(cents / 100).toFixed(2)}`;
+}
+
 export function invoiceLine(cents) {
-  return `Invoice line: $${(cents / 100).toFixed(2)}`;
+  return `Invoice line: ${formatAmount(cents)}`;
 }

 export function receiptLine(cents) {
-  return `Receipt line: $${(cents / 100).toFixed(2)}`;
+  return `Receipt line: ${formatAmount(cents)}`;
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
index bb42a14..cf086ed 100644
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
+      delayMs: 2500,
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
index bb42a14..7ed6697 100644
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
+    }, "follow up");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["follow up"]);
+  });
 });
```

### Patch C

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
index bb42a14..02543dd 100644
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
+      delayMs: 2500,
+      setTimer: (callback, delay) => {
+        delays.push(delay);
+        callback();
+      },
+    }, "stretch");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["stretch"]);
+  });
 });
```

### Patch D

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
index bb42a14..ec8d34a 100644
--- a/test/reminder.test.mjs
+++ b/test/reminder.test.mjs
@@ -19,4 +19,21 @@ describe("scheduleReminder", () => {
     assert.deepEqual(delays, [1000]);
     assert.deepEqual(messages, ["check in"]);
   });
+
+  it("uses a custom delay with an injected timer", () => {
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
+    }, "follow up");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["follow up"]);
+  });
 });
```

## Task m5-task-009

Request: Reject unsafe report names

Reject report names that could escape the reports directory while keeping simple report names accepted.

### Patch A

```diff
diff --git a/src/report-path.js b/src/report-path.js
index 82875f9..c22b8ab 100644
--- a/src/report-path.js
+++ b/src/report-path.js
@@ -1,5 +1,5 @@
 export function isSafeReportName(name) {
-  return typeof name === "string" && name.length > 0;
+  return typeof name === "string" && name.length > 0 && !/[\\/]/.test(name);
 }

 export function reportPath(name) {
diff --git a/test/report-path.test.mjs b/test/report-path.test.mjs
index 2cd46c9..37027c6 100644
--- a/test/report-path.test.mjs
+++ b/test/report-path.test.mjs
@@ -7,4 +7,10 @@ describe("reportPath", () => {
   it("keeps simple names working", () => {
     assert.equal(reportPath("weekly"), "reports/weekly.json");
   });
+
+  it("rejects names that could escape the reports directory", () => {
+    assert.throws(() => reportPath("../secrets"), /invalid report name/);
+    assert.throws(() => reportPath("nested/../../secrets"), /invalid report name/);
+    assert.throws(() => reportPath("..\\secrets"), /invalid report name/);
+  });
 });
```

### Patch B

```diff
diff --git a/src/report-path.js b/src/report-path.js
index 82875f9..93925e0 100644
--- a/src/report-path.js
+++ b/src/report-path.js
@@ -1,5 +1,5 @@
 export function isSafeReportName(name) {
-  return typeof name === "string" && name.length > 0;
+  return typeof name === "string" && /^[A-Za-z0-9_-]+$/.test(name);
 }

 export function reportPath(name) {
diff --git a/test/report-path.test.mjs b/test/report-path.test.mjs
index 2cd46c9..366cf51 100644
--- a/test/report-path.test.mjs
+++ b/test/report-path.test.mjs
@@ -6,5 +6,13 @@ import { reportPath } from "../src/report-path.js";
 describe("reportPath", () => {
   it("keeps simple names working", () => {
     assert.equal(reportPath("weekly"), "reports/weekly.json");
+    assert.equal(reportPath("weekly-2026_06"), "reports/weekly-2026_06.json");
+  });
+
+  it("rejects names that could escape the reports directory", () => {
+    assert.throws(() => reportPath("../secret"), /invalid report name/);
+    assert.throws(() => reportPath("nested/secret"), /invalid report name/);
+    assert.throws(() => reportPath("nested\\secret"), /invalid report name/);
+    assert.throws(() => reportPath("/tmp/secret"), /invalid report name/);
   });
 });
```

### Patch C

```diff
diff --git a/src/report-path.js b/src/report-path.js
index 82875f9..e0546d4 100644
--- a/src/report-path.js
+++ b/src/report-path.js
@@ -1,5 +1,10 @@
 export function isSafeReportName(name) {
-  return typeof name === "string" && name.length > 0;
+  return (
+    typeof name === "string" &&
+    name.length > 0 &&
+    !name.includes("/") &&
+    !name.includes("\\")
+  );
 }

 export function reportPath(name) {
diff --git a/test/report-path.test.mjs b/test/report-path.test.mjs
index 2cd46c9..c1d2ea3 100644
--- a/test/report-path.test.mjs
+++ b/test/report-path.test.mjs
@@ -7,4 +7,9 @@ describe("reportPath", () => {
   it("keeps simple names working", () => {
     assert.equal(reportPath("weekly"), "reports/weekly.json");
   });
+
+  it("rejects names that could escape the reports directory", () => {
+    assert.throws(() => reportPath("../weekly"), /invalid report name/);
+    assert.throws(() => reportPath("..\\weekly"), /invalid report name/);
+  });
 });
```

### Patch D

```diff
diff --git a/src/report-path.js b/src/report-path.js
index 82875f9..438ecb8 100644
--- a/src/report-path.js
+++ b/src/report-path.js
@@ -1,5 +1,11 @@
 export function isSafeReportName(name) {
-  return typeof name === "string" && name.length > 0;
+  return (
+    typeof name === "string" &&
+    name.length > 0 &&
+    name !== "." &&
+    name !== ".." &&
+    !/[\\/]/.test(name)
+  );
 }

 export function reportPath(name) {
diff --git a/test/report-path.test.mjs b/test/report-path.test.mjs
index 2cd46c9..670bf86 100644
--- a/test/report-path.test.mjs
+++ b/test/report-path.test.mjs
@@ -7,4 +7,11 @@ describe("reportPath", () => {
   it("keeps simple names working", () => {
     assert.equal(reportPath("weekly"), "reports/weekly.json");
   });
+
+  it("rejects names that could escape the reports directory", () => {
+    assert.throws(() => reportPath("../weekly"), /invalid report name/);
+    assert.throws(() => reportPath("weekly/../../secret"), /invalid report name/);
+    assert.throws(() => reportPath("weekly\\..\\secret"), /invalid report name/);
+    assert.throws(() => reportPath(".."), /invalid report name/);
+  });
 });
```

## Task m5-task-010

Request: Serialize an optional nickname field

Accept an optional nickname field from submitted profile form entries. Keep existing name serialization unchanged.

### Patch A

```diff
diff --git a/src/profile-form.js b/src/profile-form.js
index 20807d8..86b6b82 100644
--- a/src/profile-form.js
+++ b/src/profile-form.js
@@ -1,5 +1,11 @@
 export function serializeProfileForm(entries) {
-  return {
+  const profile = {
     name: String(entries.name || "").trim(),
   };
+
+  if ("nickname" in entries) {
+    profile.nickname = String(entries.nickname || "").trim();
+  }
+
+  return profile;
 }
diff --git a/test/profile-form.test.mjs b/test/profile-form.test.mjs
index 332f33f..9ca958a 100644
--- a/test/profile-form.test.mjs
+++ b/test/profile-form.test.mjs
@@ -9,4 +9,11 @@ describe("serializeProfileForm", () => {
       name: "Ada",
     });
   });
+
+  it("serializes optional nickname when submitted", () => {
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
index 20807d8..86b6b82 100644
--- a/src/profile-form.js
+++ b/src/profile-form.js
@@ -1,5 +1,11 @@
 export function serializeProfileForm(entries) {
-  return {
+  const profile = {
     name: String(entries.name || "").trim(),
   };
+
+  if ("nickname" in entries) {
+    profile.nickname = String(entries.nickname || "").trim();
+  }
+
+  return profile;
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

### Patch C

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
index 332f33f..b7dfe0e 100644
--- a/test/profile-form.test.mjs
+++ b/test/profile-form.test.mjs
@@ -9,4 +9,11 @@ describe("serializeProfileForm", () => {
       name: "Ada",
     });
   });
+
+  it("serializes submitted nickname", () => {
+    assert.deepEqual(serializeProfileForm({ name: " Ada ", nickname: " Countess " }), {
+      name: "Ada",
+      nickname: "Countess",
+    });
+  });
 });
```

### Patch D

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
index 332f33f..ffe08cf 100644
--- a/test/profile-form.test.mjs
+++ b/test/profile-form.test.mjs
@@ -9,4 +9,11 @@ describe("serializeProfileForm", () => {
       name: "Ada",
     });
   });
+
+  it("serializes a submitted nickname", () => {
+    assert.deepEqual(serializeProfileForm({ name: " Ada ", nickname: " Countess " }), {
+      name: "Ada",
+      nickname: "Countess",
+    });
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

### Patch B

```diff
diff --git a/src/id-list.js b/src/id-list.js
index 4602c25..0ad8611 100644
--- a/src/id-list.js
+++ b/src/id-list.js
@@ -6,12 +6,14 @@ const ITEMS = [
   { id: "c3", active: true },
 ];

-export function formatIds(items = ITEMS) {
-  return `${items.map((item) => item.id).join("\n")}\n`;
+export function formatIds(items = ITEMS, { activeOnly = false } = {}) {
+  const filteredItems = activeOnly ? items.filter((item) => item.active) : items;
+
+  return `${filteredItems.map((item) => item.id).join("\n")}\n`;
 }

 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
-  stdout.write(formatIds(ITEMS));
+  stdout.write(formatIds(ITEMS, { activeOnly: argv.includes("--active-only") }));
 }

 if (import.meta.url === pathToFileURL(process.argv[1]).href) {
diff --git a/test/id-list.test.mjs b/test/id-list.test.mjs
index 095e0cd..9a74567 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -7,4 +7,8 @@ describe("formatIds", () => {
   it("prints raw ids one per line", () => {
     assert.equal(formatIds(), "a1\nb2\nc3\n");
   });
+
+  it("can print only active ids without headings or labels", () => {
+    assert.equal(formatIds(undefined, { activeOnly: true }), "a1\nc3\n");
+  });
 });
```

### Patch C

```diff
diff --git a/src/id-list.js b/src/id-list.js
index 4602c25..67e52f0 100644
--- a/src/id-list.js
+++ b/src/id-list.js
@@ -6,12 +6,13 @@ const ITEMS = [
   { id: "c3", active: true },
 ];

-export function formatIds(items = ITEMS) {
-  return `${items.map((item) => item.id).join("\n")}\n`;
+export function formatIds(items = ITEMS, { activeOnly = false } = {}) {
+  const ids = activeOnly ? items.filter((item) => item.active) : items;
+  return `${ids.map((item) => item.id).join("\n")}\n`;
 }

 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
-  stdout.write(formatIds(ITEMS));
+  stdout.write(formatIds(ITEMS, { activeOnly: argv.includes("--active-only") }));
 }

 if (import.meta.url === pathToFileURL(process.argv[1]).href) {
diff --git a/test/id-list.test.mjs b/test/id-list.test.mjs
index 095e0cd..8033bba 100644
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
+  it("prints only active raw ids for --active-only", () => {
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

### Patch D

```diff
diff --git a/src/id-list.js b/src/id-list.js
index 4602c25..f94e1a7 100644
--- a/src/id-list.js
+++ b/src/id-list.js
@@ -6,12 +6,13 @@ const ITEMS = [
   { id: "c3", active: true },
 ];

-export function formatIds(items = ITEMS) {
-  return `${items.map((item) => item.id).join("\n")}\n`;
+export function formatIds(items = ITEMS, { activeOnly = false } = {}) {
+  const visibleItems = activeOnly ? items.filter((item) => item.active) : items;
+  return `${visibleItems.map((item) => item.id).join("\n")}\n`;
 }

 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
-  stdout.write(formatIds(ITEMS));
+  stdout.write(formatIds(ITEMS, { activeOnly: argv.includes("--active-only") }));
 }

 if (import.meta.url === pathToFileURL(process.argv[1]).href) {
diff --git a/test/id-list.test.mjs b/test/id-list.test.mjs
index 095e0cd..aa8c84f 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -1,10 +1,23 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";

-import { formatIds } from "../src/id-list.js";
+import { formatIds, main } from "../src/id-list.js";

 describe("formatIds", () => {
   it("prints raw ids one per line", () => {
     assert.equal(formatIds(), "a1\nb2\nc3\n");
   });
+
+  it("filters to active ids without labels", () => {
+    assert.equal(formatIds(undefined, { activeOnly: true }), "a1\nc3\n");
+  });
+});
+
+describe("main", () => {
+  it("prints only active ids for --active-only", () => {
+    let output = "";
+    main(["--active-only"], { write: (chunk) => (output += chunk) });
+
+    assert.equal(output, "a1\nc3\n");
+  });
 });
```

## Task m5-task-012

Request: Collapse obsolete total-format wrappers

Replace the invoice and receipt total-format wrapper functions with one shared formatAmount helper, and call that helper directly from both summaries.

### Patch A

```diff
diff --git a/src/invoice.js b/src/invoice.js
index 5107929..d50b583 100644
--- a/src/invoice.js
+++ b/src/invoice.js
@@ -1,7 +1,5 @@
-export function formatInvoiceTotal(cents) {
-  return `$${(cents / 100).toFixed(2)}`;
-}
+import { formatAmount } from "./amount.js";

 export function invoiceSummary(cents) {
-  return `Invoice total: ${formatInvoiceTotal(cents)}`;
+  return `Invoice total: ${formatAmount(cents)}`;
 }
diff --git a/src/receipt.js b/src/receipt.js
index bd80277..c81e009 100644
--- a/src/receipt.js
+++ b/src/receipt.js
@@ -1,7 +1,5 @@
-export function formatReceiptTotal(cents) {
-  return `${(cents / 100).toFixed(2)} USD`;
-}
+import { formatAmount } from "./amount.js";

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

### Patch B

```diff
diff --git a/src/invoice.js b/src/invoice.js
index 5107929..8d5841d 100644
--- a/src/invoice.js
+++ b/src/invoice.js
@@ -1,7 +1,5 @@
-export function formatInvoiceTotal(cents) {
-  return `$${(cents / 100).toFixed(2)}`;
-}
+import { formatAmount } from "./format.js";

 export function invoiceSummary(cents) {
-  return `Invoice total: ${formatInvoiceTotal(cents)}`;
+  return `Invoice total: ${formatAmount(cents)}`;
 }
diff --git a/src/receipt.js b/src/receipt.js
index bd80277..cbc9c6b 100644
--- a/src/receipt.js
+++ b/src/receipt.js
@@ -1,7 +1,5 @@
-export function formatReceiptTotal(cents) {
-  return `${(cents / 100).toFixed(2)} USD`;
-}
+import { formatAmount } from "./format.js";

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
diff --git a/src/format.js b/src/format.js
new file mode 100644
index 0000000..021af62
--- /dev/null
+++ b/src/format.js
@@ -0,0 +1,3 @@
+export function formatAmount(cents) {
+  return `$${(cents / 100).toFixed(2)}`;
+}
```

### Patch C

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

### Patch D

```diff
diff --git a/src/invoice.js b/src/invoice.js
index 5107929..ef3b24e 100644
--- a/src/invoice.js
+++ b/src/invoice.js
@@ -1,7 +1,5 @@
-export function formatInvoiceTotal(cents) {
-  return `$${(cents / 100).toFixed(2)}`;
-}
+import { formatAmount } from "./formatAmount.js";

 export function invoiceSummary(cents) {
-  return `Invoice total: ${formatInvoiceTotal(cents)}`;
+  return `Invoice total: $${formatAmount(cents)}`;
 }
diff --git a/src/receipt.js b/src/receipt.js
index bd80277..2edd288 100644
--- a/src/receipt.js
+++ b/src/receipt.js
@@ -1,7 +1,5 @@
-export function formatReceiptTotal(cents) {
-  return `${(cents / 100).toFixed(2)} USD`;
-}
+import { formatAmount } from "./formatAmount.js";

 export function receiptSummary(cents) {
-  return `Receipt total: ${formatReceiptTotal(cents)}`;
+  return `Receipt total: ${formatAmount(cents)} USD`;
 }
diff --git a/test/billing.test.mjs b/test/billing.test.mjs
index a96485c..4e89fbc 100644
--- a/test/billing.test.mjs
+++ b/test/billing.test.mjs
@@ -7,6 +7,6 @@ import { receiptSummary } from "../src/receipt.js";
 describe("billing summaries", () => {
   it("keeps existing labels", () => {
     assert.equal(invoiceSummary(1234), "Invoice total: $12.34");
-    assert.match(receiptSummary(1234), /^Receipt total: /);
+    assert.equal(receiptSummary(1234), "Receipt total: 12.34 USD");
   });
 });
diff --git a/src/formatAmount.js b/src/formatAmount.js
new file mode 100644
index 0000000..9b11af4
--- /dev/null
+++ b/src/formatAmount.js
@@ -0,0 +1,3 @@
+export function formatAmount(cents) {
+  return (cents / 100).toFixed(2);
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
      },
      "C": {
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
      "D": {
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
      },
      "C": {
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
      "D": {
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
      },
      "C": {
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
      "D": {
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
      },
      "C": {
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
      "D": {
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
      },
      "C": {
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
      "D": {
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
    "task_id": "m5-task-006",
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
      },
      "C": {
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
      "D": {
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
      },
      "C": {
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
      "D": {
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
      },
      "C": {
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
      "D": {
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
    "task_id": "m5-task-009",
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
      },
      "C": {
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
      "D": {
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
      },
      "C": {
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
      "D": {
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
      },
      "C": {
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
      "D": {
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
      },
      "C": {
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
      "D": {
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
