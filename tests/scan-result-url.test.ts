import test from "node:test";
import assert from "node:assert/strict";
import { buildScanResultHref } from "../src/lib/scan-result-url";

test("buildScanResultHref returns correct scan result path", () => {
  assert.equal(buildScanResultHref("scan_123"), "/scan/scan_123");
});

test("buildScanResultHref handles empty scan ID", () => {
  assert.equal(buildScanResultHref(""), "/scan/");
});

test("buildScanResultHref documents coerced undefined scan ID input", () => {
  assert.equal(
    buildScanResultHref(undefined as unknown as string),
    `/scan/${encodeURIComponent(String(undefined))}`,
  );
});

test("buildScanResultHref documents coerced null scan ID input", () => {
  assert.equal(
    buildScanResultHref(null as unknown as string),
    `/scan/${encodeURIComponent(String(null))}`,
  );
});

test("buildScanResultHref encodes special characters in scan ID", () => {
  const scanId = "scan id/with?special#chars";
  assert.equal(buildScanResultHref(scanId), `/scan/${encodeURIComponent(scanId)}`);
});

test("buildScanResultHref handles very long scan ID", () => {
  const scanId = "a".repeat(4096);
  assert.equal(buildScanResultHref(scanId), `/scan/${encodeURIComponent(scanId)}`);
});
