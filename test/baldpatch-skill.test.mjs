import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const SKILL_PATH = ".agents/skills/baldpatch-patch/SKILL.md";
const OPENAI_YAML_PATH = ".agents/skills/baldpatch-patch/agents/openai.yaml";
const REVIEW_SKILL_PATH = ".agents/skills/baldpatch-review/SKILL.md";
const REVIEW_OPENAI_YAML_PATH = ".agents/skills/baldpatch-review/agents/openai.yaml";
const M5_DESIGN_PATH = "docs/m5-holdout-design.md";
const POSTURE_PATH = "docs/posture.md";

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
    assert.match(skill, /deterministic proof/i);
    assert.match(skill, /injected scheduler or timer path/i);
    assert.match(skill, /shared helper/i);
  });

  it("contains post-M5 reviewer-proof wording with downside constraints", () => {
    const skill = readFileSync(SKILL_PATH, "utf8");

    assert.match(skill, /Post-M5 Constraints/i);
    assert.match(skill, /negative or mixed evidence/i);
    assert.match(skill, /conditional risk checks/i);
    assert.match(skill, /Do not replace existing high-signal focused tests/i);
    assert.match(skill, /smallest public behavior test/i);
    assert.match(skill, /do not add or export a helper solely/i);
    assert.match(skill, /injected scheduler or timer path/i);
    assert.match(skill, /accepted\/rejected boundary/i);
    assert.match(skill, /meaningful default contract/i);
    assert.match(skill, /raw or terse CLI output/i);
    assert.match(skill, /preserve existing wrapper call paths/i);
    assert.match(skill, /explicitly asks to collapse them/i);
  });

  it("marks the live patch skill as frozen after M9", () => {
    const skill = readFileSync(SKILL_PATH, "utf8");

    assert.match(skill, /Post-M9 Freeze/i);
    assert.match(skill, /Stable \(post-M5, frozen after M9\)/i);
    assert.match(skill, /Do not tune this skill's wording/i);
    assert.match(skill, /timer-proof addendum/i);
  });

  it("documents the post-M9 project posture and stop rule", () => {
    const posture = readFileSync(POSTURE_PATH, "utf8");

    assert.match(posture, /anti-overbuild eval and review evidence system/i);
    assert.match(posture, /E1: Eval Discrimination/i);
    assert.match(posture, /E2: Realistic Task Suite/i);
    assert.match(posture, /E3: Review Evidence Productization/i);
    assert.match(posture, /Stop Rule/i);
    assert.match(posture, /stop skill research/i);
  });

  it("documents the M5 holdout design before claiming generalization", () => {
    const design = readFileSync(M5_DESIGN_PATH, "utf8");

    assert.match(design, /Run 12 tasks/i);
    assert.match(design, /at least half holdout/i);
    assert.match(design, /old skill/i);
    assert.match(design, /natural-baseline/i);
    assert.match(design, /prompt-control/i);
    assert.match(design, /helper extraction/i);
    assert.match(design, /timer proof/i);
    assert.match(design, /validation boundaries/i);
    assert.match(design, /form defaults/i);
    assert.match(design, /output labels/i);
    assert.match(design, /wrapper preservation/i);
    assert.match(design, /Do not run external M5/i);
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
