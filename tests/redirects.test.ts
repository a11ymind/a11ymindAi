import test from "node:test";
import assert from "node:assert/strict";
import { safeAppRedirectPath } from "../src/lib/redirects";

test("safeAppRedirectPath keeps internal app paths", () => {
  assert.equal(safeAppRedirectPath("/dashboard?upgraded=1", "/"), "/dashboard?upgraded=1");
  assert.equal(safeAppRedirectPath("/claim/scan_123", "/"), "/claim/scan_123");
});

test("safeAppRedirectPath rejects external and malformed redirects", () => {
  assert.equal(safeAppRedirectPath("https://evil.example", "/dashboard"), "/dashboard");
  assert.equal(safeAppRedirectPath("//evil.example", "/dashboard"), "/dashboard");
  assert.equal(safeAppRedirectPath("/\\evil.example", "/dashboard"), "/dashboard");
  assert.equal(safeAppRedirectPath("javascript:alert(1)", "/dashboard"), "/dashboard");
});
