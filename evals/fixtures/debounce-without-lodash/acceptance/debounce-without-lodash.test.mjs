import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("debounce-without-lodash acceptance", () => {
  it("fires search once after a 250ms pause", async () => {
    const { createSearchController } = await import(
      pathToFileURL(path.join(cwd, "src/search.js"))
    );
    const calls = [];
    const controller = createSearchController({ search: (value) => calls.push(value) });

    controller.input("a");
    controller.input("ab");
    controller.input("abc");

    assert.deepEqual(calls, []);
    await delay(275);
    assert.deepEqual(calls, ["abc"]);
  });

  it("does not add utility dependencies", () => {
    const pkg = JSON.parse(readFileSync(path.join(cwd, "package.json"), "utf8"));
    assert.equal(pkg.dependencies, undefined);
  });
});
