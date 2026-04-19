import test from "node:test";
import assert from "node:assert/strict";
import {
  autoScanLabel,
  entitlementsFor,
  isAtSiteLimit,
  savedSiteLimitMessage,
} from "../src/lib/entitlements";

test("paid plans expose the expected entitlements", () => {
  const starter = entitlementsFor("STARTER");
  const pro = entitlementsFor("PRO");

  assert.equal(starter.maxSites, 1);
  assert.equal(starter.aiFixes, true);
  assert.equal(starter.aiMonthlyLimit, 100);
  assert.equal(starter.pdfExport, true);
  assert.equal(starter.shareableLink, true);
  assert.equal(starter.monitoringBadge, true);
  assert.equal(starter.autoScan, "weekly");

  assert.equal(pro.maxSites, 10);
  assert.equal(pro.aiFixes, true);
  assert.equal(pro.aiMonthlyLimit, 500);
  assert.equal(pro.pdfExport, true);
  assert.equal(pro.monitoringBadge, true);
  assert.equal(pro.autoScan, "daily");
  // Shipped flags should stay aligned with product surfaces.
  assert.equal(pro.regressionDiffs, true);
  assert.equal(pro.slackAlerts, true);
  assert.equal(pro.ciIntegration, true);
});

test("site-limit helpers match current plan rules", () => {
  assert.equal(isAtSiteLimit("FREE", 0), false);
  assert.equal(isAtSiteLimit("FREE", 1), true);
  assert.equal(isAtSiteLimit("STARTER", 1), true);
  assert.equal(isAtSiteLimit("PRO", 9), false);
  assert.equal(isAtSiteLimit("PRO", 10), true);

  assert.equal(savedSiteLimitMessage("FREE"), "Your Free plan allows 1 saved site. Upgrade to track more.");
  assert.equal(savedSiteLimitMessage("STARTER"), "Your Starter plan allows 1 saved site. Upgrade to track more.");
  assert.equal(savedSiteLimitMessage("PRO"), "You've reached the 10-site limit.");
});

test("auto-scan labels stay aligned with cadence copy", () => {
  assert.equal(autoScanLabel("none"), "Not included");
  assert.equal(autoScanLabel("monthly"), "Monthly");
  assert.equal(autoScanLabel("weekly"), "Weekly");
  assert.equal(autoScanLabel("daily"), "Daily");
});

test("free plan now includes a taste of AI fixes", () => {
  const free = entitlementsFor("FREE");
  assert.equal(free.aiFixes, true);
  assert.equal(free.aiMonthlyLimit, 3);
  assert.equal(free.monthlyScanLimit, 5);
  assert.equal(free.pdfExport, false);
  assert.equal(free.shareableLink, false);
});
