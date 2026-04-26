import test from "node:test";
import assert from "node:assert/strict";
import { buildScanResultHref } from "../src/lib/scan-result-url";

test("buildScanResultHref omits absent flags", () => {
  assert.equal(buildScanResultHref("scan_123"), "/scan/scan_123");
});
