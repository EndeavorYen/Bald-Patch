import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { after, describe, it } from "node:test";

import { prepareFixture } from "../scripts/prepare-fixture.mjs";
import { readTasks } from "../scripts/fixture-utils.mjs";
import { verifyFixture } from "../scripts/verify-fixture.mjs";

const tmpRoot = mkdtempSync(path.join(tmpdir(), "bald-patch-fixtures-test-"));

after(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
});

describe("eval fixtures", () => {
  it("prepares every task from a clean standalone project", () => {
    for (const task of readTasks()) {
      const prepared = prepareFixture({
        taskId: task.id,
        outDir: path.join(tmpRoot, task.id),
        force: true,
      });

      assert.equal(prepared.task_id, task.id);
      assert.ok(existsSync(path.join(prepared.out, ".git")));
      assert.match(prepared.verify, new RegExp(`--task ${task.id}\\b`));

      const publicTests = spawnSync("npm", ["test"], {
        cwd: prepared.out,
        encoding: "utf8",
      });
      assert.equal(publicTests.status, 0, publicTests.stderr || publicTests.stdout);

      const verification = verifyFixture({
        taskId: task.id,
        cwd: prepared.out,
      });
      assert.equal(verification.ok, false, `${task.id} should fail hidden acceptance before patch`);
      assert.equal(verification.phase, "acceptance");
    }
  });

  it("prepares M2 positive-control tasks from clean standalone projects", () => {
    const positiveTasks = readTasks(undefined, { mode: "m2" })
      .filter((task) => task.kind === "positive-control");

    assert.equal(positiveTasks.length, 1);

    for (const task of positiveTasks) {
      const prepared = prepareFixture({
        taskId: task.id,
        outDir: path.join(tmpRoot, `m2-${task.id}`),
        force: true,
      });

      const publicTests = spawnSync("npm", ["test"], {
        cwd: prepared.out,
        encoding: "utf8",
      });
      assert.equal(publicTests.status, 0, publicTests.stderr || publicTests.stdout);

      const verification = verifyFixture({
        taskId: task.id,
        cwd: prepared.out,
      });
      assert.equal(verification.ok, false, `${task.id} should fail hidden acceptance before patch`);
      assert.equal(verification.phase, "acceptance");
    }
  });
});
