# Bald Patch Closure Plan

> **TL;DR** — Close this phase by making Bald Patch a reusable anti-overbuild
> eval and review evidence toolkit. Do not chase more live skill wording changes
> unless E1/E2/E3 first produce a stronger evidence surface.

## Closure Objective

Bald Patch should be ready to cite, reuse, or archive without implying that the
live `$baldpatch-patch` skill is proven. The finished project should make three
claims easy to verify:

- M1-M9 did not prove durable reviewer preference, lower expected rework, or
  smaller patches from the live skill.
- The mature assets are advisory evidence tooling: the eval harness,
  scope/review tooling, blind review packet flow, scoring, and evidence reports.
- Future skill work requires better task discrimination, realistic holdouts, and
  complete blind review evidence before any live wording change.

## Definition Of Done

The project can close this phase when these are all true:

- README, posture, final report, and closure plan describe the post-M9 decision
  in the same terms.
- `$baldpatch-patch` is clearly frozen and no live skill wording is changed after
  M9.
- E1, E2, and E3 have concrete issue-linked plans with acceptance gates.
- Mature, experimental, historical, and deferred assets are documented.
- Local verification passes: `npm test`, `git diff --check`, `scope-lint`, and
  `baldpatch-review`.
- A final evidence-freeze tag, suggested as `v0.1-evidence-freeze`, points at
  the closure commit.

## E1: Eval Discrimination

Issue: [#59](https://github.com/EndeavorYen/Bald-Patch/issues/59)

Goal: decide which tasks can produce meaningful reviewer signal and which tasks
should be retired as wording tie-breakers.

Deliverables:

- Audit every M1-M9 task for behavioral contrast, reviewer-visible risk, and
  expected rework contrast.
- Mark each task as keep, revise, retire, or use only as historical evidence.
- Add a reviewer prompt checklist that separates correctness, underbuild,
  overbuild, risk, and rework.
- Define a minimum discrimination gate before any new external eval is allowed.

Exit gate: at least one proposed future suite has reviewer-visible tradeoffs that
are not mostly test-name or equivalent-patch tie-breaks.

## E2: Realistic Task Suite

Issue: [#60](https://github.com/EndeavorYen/Bald-Patch/issues/60)

Goal: design larger but still fully verifiable repo slices that better match real
review pressure than the micro fixtures.

Deliverables:

- Specify 6-12 realistic tasks with setup, expected behavior, verification, and
  known downside risks.
- Include positive and negative cases for helpers, wrappers, validation,
  semantic output, timers, and dependency restraint.
- Keep every task resettable and runnable without hidden services.
- State the primary comparison and success gate before any coding eval runs.

Exit gate: the suite is ready for review without sending prompts or diffs to an
external model yet.

## E3: Review Evidence Productization

Issue: [#61](https://github.com/EndeavorYen/Bald-Patch/issues/61)

Goal: make the review evidence flow usable without reading the whole M1-M9
history.

Deliverables:

- Add a short review-evidence runbook for building, applying, decoding, and
  scoring blind packets.
- Provide a compact summary template for reviewer votes, expected rework,
  underbuild risk, overbuild risk, and scope evidence.
- Make example commands current and consistent with local scripts.
- Keep review and scope outputs advisory, not blocking automation.

Exit gate: a maintainer can run the evidence flow from a clean checkout and
understand the output without opening historical reports.

## Stop And Restart Rules

Stop skill research if E1/E2 cannot produce a higher-discrimination holdout. In
that case, close Bald Patch as an eval and review toolkit.

Restart skill research only if a written proposal passes the restart criteria in
[posture.md](posture.md): better task discrimination, complete three-reviewer
blind review, no added underbuild or overbuild risk, and a predeclared reviewer
value gain such as lower expected rework.

## Out Of Scope

- No hooks, plugins, or always-on automation from current evidence.
- No new external eval round before E1/E2/E3 produce a written design.
- No claim that Bald Patch reliably produces smaller or more reviewable patches.
- No live `$baldpatch-patch` wording change from the M9 timer result.
