import test from "node:test";
import assert from "node:assert/strict";
import {
  canRetryScan,
  MAX_SCAN_ATTEMPTS,
  retryAttemptsRemaining,
} from "../src/lib/scan-retry";

test("canRetryScan allows failed scans below max attempts", () => {
  assert.equal(canRetryScan({ status: "FAILED", attemptCount: 0 }), true);
  assert.equal(canRetryScan({ status: "FAILED", attemptCount: 1 }), true);
});

test("canRetryScan blocks non-failed scans and exhausted failures", () => {
  assert.equal(canRetryScan({ status: "PENDING", attemptCount: 0 }), false);
  assert.equal(canRetryScan({ status: "RUNNING", attemptCount: 1 }), false);
  assert.equal(canRetryScan({ status: "COMPLETED", attemptCount: 1 }), false);
  assert.equal(
    canRetryScan({ status: "FAILED", attemptCount: MAX_SCAN_ATTEMPTS }),
    false,
  );
});

test("retryAttemptsRemaining never returns below zero", () => {
  assert.equal(retryAttemptsRemaining({ attemptCount: 0 }), MAX_SCAN_ATTEMPTS);
  assert.equal(retryAttemptsRemaining({ attemptCount: 1 }), MAX_SCAN_ATTEMPTS - 1);
  assert.equal(retryAttemptsRemaining({ attemptCount: 99 }), 0);
});
