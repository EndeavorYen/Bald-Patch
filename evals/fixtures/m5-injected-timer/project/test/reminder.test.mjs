import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { scheduleReminder } from "../src/reminder.js";

describe("scheduleReminder", () => {
  it("uses the default delay", () => {
    const delays = [];
    const messages = [];

    scheduleReminder({
      notify: (message) => messages.push(message),
      setTimer: (callback, delay) => {
        delays.push(delay);
        callback();
      },
    }, "check in");

    assert.deepEqual(delays, [1000]);
    assert.deepEqual(messages, ["check in"]);
  });
});
