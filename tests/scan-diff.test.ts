import test from "node:test";
import assert from "node:assert/strict";
import { buildRegressionDiff } from "../src/lib/scan-diff";

test("buildRegressionDiff compares affected selectors for the same axe rule", () => {
  const diff = buildRegressionDiff(
    [
      {
        axeId: "image-alt",
        impact: "critical",
        help: "Images must have alternate text",
        selector: "img.hero",
        instances: [{ selector: "img.hero" }, { selector: "img.logo" }],
      },
    ],
    [
      {
        axeId: "image-alt",
        impact: "critical",
        help: "Images must have alternate text",
        selector: "img.hero",
        instances: [{ selector: "img.hero" }, { selector: "img.avatar" }],
      },
    ],
  );

  assert.equal(diff.newCount, 1);
  assert.equal(diff.fixedCount, 1);
  assert.equal(diff.unchangedCount, 1);
  assert.equal(diff.newItems[0]?.selector, "img.logo");
  assert.equal(diff.fixedItems[0]?.selector, "img.avatar");
});

test("buildRegressionDiff falls back to rule-level comparison for legacy rows", () => {
  const diff = buildRegressionDiff(
    [{ axeId: "button-name", impact: "serious", help: "Buttons must have text" }],
    [{ axeId: "button-name", impact: "serious", help: "Buttons must have text" }],
  );

  assert.equal(diff.newCount, 0);
  assert.equal(diff.fixedCount, 0);
  assert.equal(diff.unchangedCount, 1);
});
