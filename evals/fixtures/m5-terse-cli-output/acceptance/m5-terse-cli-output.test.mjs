import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("m5 terse cli output acceptance", () => {
  it("filters active ids without adding labels", async () => {
    const { main } = await import(pathToFileURL(path.join(cwd, "src/id-list.js")));
    let output = "";

    main(["--active-only"], {
      write(chunk) {
        output += chunk;
      },
    });

    assert.equal(output, "a1\nc3\n");
  });
});
