import test from "node:test";
import assert from "node:assert/strict";
import { buildScanResultHref } from "../src/lib/scan-result-url";

test("buildScanResultHref omits absent flags", () => {
  assert.equal(buildScanResultHref("scan_123"), "/scan/scan_123");
});

test("buildScanResultHref includes relevant AI entitlement flags", () => {
  const href = buildScanResultHref("scan_123", {
    aiEnabled: false,
    aiUsageCurrent: 12,
    aiUsageLimit: 20,
    aiUsageRemaining: 8,
    requiresUpgradeForAI: true,
    aiLimitReached: false,
  });

  assert.equal(
    href,
    "/scan/scan_123?aiEnabled=0&aiUsageCurrent=12&aiUsageLimit=20&aiUsageRemaining=8&requiresUpgradeForAI=1",
  );
});

test("buildScanResultHref includes login and limit flags when set", () => {
  const href = buildScanResultHref("scan_abc", {
    aiEnabled: true,
    requiresLoginForAI: true,
    aiLimitReached: true,
  });

  assert.equal(
    href,
    "/scan/scan_abc?aiEnabled=1&requiresLoginForAI=1&aiLimitReached=1",
  );
});
