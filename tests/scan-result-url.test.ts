import test from "node:test";
import assert from "node:assert/strict";
import { buildScanResultHref } from "../src/lib/scan-result-url";

test("buildScanResultHref returns correct scan result path", () => {
  assert.equal(buildScanResultHref("scan_123"), "/scan/scan_123");
});

test("buildScanResultHref handles empty scan ID", () => {
  assert.equal(buildScanResultHref(""), "/scan/");
});

test("buildScanResultHref encodes special characters in scan ID", () => {
  const scanId = "scan id/with?special#chars";
  assert.equal(buildScanResultHref(scanId), `/scan/${encodeURIComponent(scanId)}`);
});

test("buildScanResultHref handles very long scan ID", () => {
  const scanId = "a".repeat(4096);
  assert.equal(buildScanResultHref(scanId), `/scan/${scanId}`);
});
