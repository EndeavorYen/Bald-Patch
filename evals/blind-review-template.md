# Bald Patch Blind Review

Task ID:

Patch A:

Patch B:

Reviewer:

## Questions

1. Which patch would you rather review or merge?
2. Which patch has less unnecessary scope?
3. Which patch is safer?
4. Which patch requires less human rework?
5. Would each patch be accepted or require changes?
6. Are dependency or abstraction choices justified, avoidable, or underbuilt?
7. Is each patch carrying overbuild or underbuild risk? Use `none`, `low`, `medium`, or `high`.

## Answer Format

Save one JSON file per reviewer. Use the reviewer id only for agreement tracking; do not include arm names or run ids.

```json
{
  "reviewer_id": "reviewer-1",
  "answers": [
    {
      "task_id": "task-011",
      "preferred_patch": "B",
      "confidence": 4,
      "reason": "Patch B meets the request with less rework.",
      "patches": {
        "A": {
          "decision": "request-changes",
          "expected_rework_minutes": 12,
          "scores": {
            "requirements": 3,
            "correctness": 4,
            "safety": 4,
            "tests": 3,
            "maintainability": 2
          },
          "dependency_judgment": "avoidable",
          "abstraction_judgment": "avoidable",
          "overbuild_risk": "medium",
          "underbuild_risk": "none"
        },
        "B": {
          "decision": "accept",
          "expected_rework_minutes": 3,
          "scores": {
            "requirements": 5,
            "correctness": 5,
            "safety": 5,
            "tests": 4,
            "maintainability": 5
          },
          "dependency_judgment": "none",
          "abstraction_judgment": "justified",
          "overbuild_risk": "low",
          "underbuild_risk": "none"
        }
      }
    }
  ]
}
```

## Notes

- Do not reveal which patch used Bald Patch guidance before the reviewer answers.
- Ignore commit messages and agent names.
- Record concrete reasons, not just preference.
- If a task has Patch C, include a `C` entry under `patches` too.
