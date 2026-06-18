import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const SKILL_PATH = ".agents/skills/baldpatch-patch/SKILL.md";
const OPENAI_YAML_PATH = ".agents/skills/baldpatch-patch/agents/openai.yaml";
const REVIEW_SKILL_PATH = ".agents/skills/baldpatch-review/SKILL.md";
const REVIEW_OPENAI_YAML_PATH = ".agents/skills/baldpatch-review/agents/openai.yaml";

describe("baldpatch-patch skill", () => {
  it("has complete trigger metadata and concise instructions", () => {
    const skill = readFileSync(SKILL_PATH, "utf8");

    assert.match(skill, /^name: baldpatch-patch$/m);
    assert.match(skill, /^description: .+Use when .+/m);
    assert.doesNotMatch(skill, /TODO|\[TODO/);
    assert.ok(skill.split(/\r?\n/).length <= 120);
  });

  it("maps every core rule to at least one eval task", () => {
    const skill = readFileSync(SKILL_PATH, "utf8");

    for (const taskId of [
      "native-date-picker",
      "debounce-without-lodash",
      "small-refactor-no-rewrite",
      "single-provider-no-plugin-architecture",
      "email-validation-without-library",
    ]) {
      assert.match(skill, new RegExp(taskId));
    }
  });

  it("treats reviewer-valued regression proof as part of safe scope", () => {
    const skill = readFileSync(SKILL_PATH, "utf8");

    assert.match(skill, /preserved behavior/i);
    assert.match(skill, /deterministic timer/i);
    assert.match(skill, /shared helper/i);
  });

  it("keeps OpenAI UI metadata aligned with the explicit skill name", () => {
    const metadata = readFileSync(OPENAI_YAML_PATH, "utf8");

    assert.match(metadata, /display_name: "Bald Patch"/);
    assert.match(
      metadata,
      /default_prompt: "Use \$baldpatch-patch to solve this with the smallest safe diff\."/,
    );
  });

  it("defines a concise advisory review skill", () => {
    const skill = readFileSync(REVIEW_SKILL_PATH, "utf8");
    const metadata = readFileSync(REVIEW_OPENAI_YAML_PATH, "utf8");

    assert.match(skill, /^name: baldpatch-review$/m);
    assert.match(skill, /^description: .+Use when .+/m);
    assert.match(skill, /node scripts\/baldpatch-review\.mjs --base main/);
    assert.match(skill, /advisory/i);
    assert.match(metadata, /default_prompt: "Use \$baldpatch-review to audit this patch for avoidable overengineering\."/);
    assert.doesNotMatch(skill, /TODO|\[TODO/);
    assert.ok(skill.split(/\r?\n/).length <= 100);
  });
});
