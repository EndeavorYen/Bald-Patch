import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, it } from "node:test";

const cwd = process.env.BALD_PATCH_FIXTURE_CWD;

describe("m5 injected timer acceptance", () => {
  it("passes custom delay through the injected timer path", async () => {
    const { scheduleReminder } = await import(pathToFileURL(path.join(cwd, "src/reminder.js")));
    const delays = [];
    const messages = [];

    const token = scheduleReminder({
      notify: (message) => messages.push(message),
      setTimer: (callback, delay) => {
        delays.push(delay);
        callback();
        return "timer-token";
      },
      delayMs: 250,
    }, "stand up");

    assert.equal(token, "timer-token");
    assert.deepEqual(delays, [250]);
    assert.deepEqual(messages, ["stand up"]);
  });
});
