# Bald Patch Blind Review Packet

Review the patches by correctness, scope, safety, tests, maintainability, and expected human rework.
For each patch, fill decision, expected rework minutes, scores, dependency judgment, abstraction judgment, overbuild risk, and underbuild risk.
Use risk values `none`, `low`, `medium`, or `high`.
Use the answer template at the end. Do not use private run metadata.

## Task m5-task-008 (seed 1)

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
index bb42a14..1331668 100644
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
+    }, "stretch");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["stretch"]);
+  });
 });
```

## Task m5-task-008 (seed 2)

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
index bb42a14..1331668 100644
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
+    }, "stretch");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["stretch"]);
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
index bb42a14..3638820 100644
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
+    }, "stretch");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["stretch"]);
+  });
 });
```

## Task m5-task-008 (seed 3)

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
index bb42a14..1fd776f 100644
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
+      delayMs: 2500,
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
index bb42a14..4c7e7fe 100644
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
+    }, "check later");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["check later"]);
+  });
 });
```

## Task m5-task-008 (seed 4)

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
index bb42a14..5249589 100644
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
+    }, "custom check in");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["custom check in"]);
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
index bb42a14..3638820 100644
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
+    }, "stretch");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["stretch"]);
+  });
 });
```

## Task m5-task-008 (seed 5)

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
index bb42a14..1fd776f 100644
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
+      delayMs: 2500,
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
index bb42a14..9b8db1b 100644
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
+    }, "stand up");
+
+    assert.deepEqual(delays, [2500]);
+    assert.deepEqual(messages, ["stand up"]);
+  });
 });
```

## Task m5-task-011 (seed 1)

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
index 095e0cd..01b6958 100644
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
 });
```

### Patch B

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
index 095e0cd..815146b 100644
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
+  it("supports --active-only without headings or labels", () => {
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

## Task m5-task-011 (seed 2)

Request: Filter terse CLI id output

Add an --active-only flag to the id-list CLI. Keep output as raw ids, one per line, with no headings or labels.

### Patch A

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

### Patch B

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
index 095e0cd..346477d 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -1,10 +1,17 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 
-import { formatIds } from "../src/id-list.js";
+import { formatIds, main } from "../src/id-list.js";
 
 describe("formatIds", () => {
   it("prints raw ids one per line", () => {
     assert.equal(formatIds(), "a1\nb2\nc3\n");
   });
+
+  it("prints only active raw ids with --active-only", () => {
+    let output = "";
+    main(["--active-only"], { write: (chunk) => (output += chunk) });
+
+    assert.equal(output, "a1\nc3\n");
+  });
 });
```

## Task m5-task-011 (seed 3)

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
index 095e0cd..216dca9 100644
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
+  it("filters to active ids without labels", () => {
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
index 095e0cd..2aeb6e3 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -1,10 +1,20 @@
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
+    main(["--active-only"], { write: (chunk) => (output += chunk) });
+
+    assert.equal(output, "a1\nc3\n");
+  });
+});
```

## Task m5-task-011 (seed 4)

Request: Filter terse CLI id output

Add an --active-only flag to the id-list CLI. Keep output as raw ids, one per line, with no headings or labels.

### Patch A

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
index 095e0cd..346477d 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -1,10 +1,17 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 
-import { formatIds } from "../src/id-list.js";
+import { formatIds, main } from "../src/id-list.js";
 
 describe("formatIds", () => {
   it("prints raw ids one per line", () => {
     assert.equal(formatIds(), "a1\nb2\nc3\n");
   });
+
+  it("prints only active raw ids with --active-only", () => {
+    let output = "";
+    main(["--active-only"], { write: (chunk) => (output += chunk) });
+
+    assert.equal(output, "a1\nc3\n");
+  });
 });
```

### Patch B

```diff
diff --git a/src/id-list.js b/src/id-list.js
index 4602c25..3a36d05 100644
--- a/src/id-list.js
+++ b/src/id-list.js
@@ -11,7 +11,10 @@ export function formatIds(items = ITEMS) {
 }
 
 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
-  stdout.write(formatIds(ITEMS));
+  const items = argv.includes("--active-only")
+    ? ITEMS.filter((item) => item.active)
+    : ITEMS;
+  stdout.write(formatIds(items));
 }
 
 if (import.meta.url === pathToFileURL(process.argv[1]).href) {
diff --git a/test/id-list.test.mjs b/test/id-list.test.mjs
index 095e0cd..ab61a92 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -1,10 +1,17 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 
-import { formatIds } from "../src/id-list.js";
+import { formatIds, main } from "../src/id-list.js";
 
 describe("formatIds", () => {
   it("prints raw ids one per line", () => {
     assert.equal(formatIds(), "a1\nb2\nc3\n");
   });
+
+  it("prints only active ids for --active-only", () => {
+    let output = "";
+    main(["--active-only"], { write: (text) => { output += text; } });
+
+    assert.equal(output, "a1\nc3\n");
+  });
 });
```

## Task m5-task-011 (seed 5)

Request: Filter terse CLI id output

Add an --active-only flag to the id-list CLI. Keep output as raw ids, one per line, with no headings or labels.

### Patch A

```diff
diff --git a/src/id-list.js b/src/id-list.js
index 4602c25..33a3e20 100644
--- a/src/id-list.js
+++ b/src/id-list.js
@@ -6,12 +6,15 @@ const ITEMS = [
   { id: "c3", active: true },
 ];
 
-export function formatIds(items = ITEMS) {
-  return `${items.map((item) => item.id).join("\n")}\n`;
+export function formatIds(items = ITEMS, { activeOnly = false } = {}) {
+  const ids = (activeOnly ? items.filter((item) => item.active) : items).map(
+    (item) => item.id,
+  );
+  return `${ids.join("\n")}\n`;
 }
 
 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
-  stdout.write(formatIds(ITEMS));
+  stdout.write(formatIds(ITEMS, { activeOnly: argv.includes("--active-only") }));
 }
 
 if (import.meta.url === pathToFileURL(process.argv[1]).href) {
diff --git a/test/id-list.test.mjs b/test/id-list.test.mjs
index 095e0cd..46e402d 100644
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
+  it("prints only active raw ids when requested", () => {
+    assert.equal(formatIds(undefined, { activeOnly: true }), "a1\nc3\n");
+  });
+});
+
+describe("main", () => {
+  it("supports --active-only without headings or labels", () => {
+    let output = "";
+    main(["--active-only"], { write: (chunk) => (output += chunk) });
+
+    assert.equal(output, "a1\nc3\n");
+  });
 });
```

### Patch B

```diff
diff --git a/src/id-list.js b/src/id-list.js
index 4602c25..c94d841 100644
--- a/src/id-list.js
+++ b/src/id-list.js
@@ -6,12 +6,13 @@ const ITEMS = [
   { id: "c3", active: true },
 ];
 
-export function formatIds(items = ITEMS) {
-  return `${items.map((item) => item.id).join("\n")}\n`;
+export function formatIds(items = ITEMS, { activeOnly = false } = {}) {
+  const listedItems = activeOnly ? items.filter((item) => item.active) : items;
+  return `${listedItems.map((item) => item.id).join("\n")}\n`;
 }
 
 export function main(argv = process.argv.slice(2), stdout = process.stdout) {
-  stdout.write(formatIds(ITEMS));
+  stdout.write(formatIds(ITEMS, { activeOnly: argv.includes("--active-only") }));
 }
 
 if (import.meta.url === pathToFileURL(process.argv[1]).href) {
diff --git a/test/id-list.test.mjs b/test/id-list.test.mjs
index 095e0cd..346477d 100644
--- a/test/id-list.test.mjs
+++ b/test/id-list.test.mjs
@@ -1,10 +1,17 @@
 import assert from "node:assert/strict";
 import { describe, it } from "node:test";
 
-import { formatIds } from "../src/id-list.js";
+import { formatIds, main } from "../src/id-list.js";
 
 describe("formatIds", () => {
   it("prints raw ids one per line", () => {
     assert.equal(formatIds(), "a1\nb2\nc3\n");
   });
+
+  it("prints only active raw ids with --active-only", () => {
+    let output = "";
+    main(["--active-only"], { write: (chunk) => (output += chunk) });
+
+    assert.equal(output, "a1\nc3\n");
+  });
 });
```

## Answer Template

```json
[
  {
    "task_id": "m5-task-008",
    "seed": 1,
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
    "seed": 2,
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
    "seed": 3,
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
    "seed": 4,
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
    "seed": 5,
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
    "seed": 1,
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
    "seed": 2,
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
    "seed": 3,
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
    "seed": 4,
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
    "seed": 5,
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
