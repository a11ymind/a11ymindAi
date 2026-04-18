import test from "node:test";
import assert from "node:assert/strict";
import { getHostPolicy } from "../src/lib/host-policy";

test("does not redirect the canonical host", () => {
  const policy = getHostPolicy({
    requestUrl: new URL("https://www.a11ymind.ai/pricing?plan=pro"),
    hostHeader: "www.a11ymind.ai",
    canonicalAppUrl: "https://www.a11ymind.ai",
  });

  assert.equal(policy.redirectTo, null);
  assert.equal(policy.noindex, false);
});

test("redirects apex to canonical www host", () => {
  const policy = getHostPolicy({
    requestUrl: new URL("https://a11ymind.ai/pricing?plan=pro"),
    hostHeader: "a11ymind.ai",
    canonicalAppUrl: "https://www.a11ymind.ai",
  });

  assert.equal(
    policy.redirectTo?.toString(),
    "https://www.a11ymind.ai/pricing?plan=pro",
  );
  assert.equal(policy.noindex, false);
});

test("redirects vercel.app hosts and marks them noindex", () => {
  const policy = getHostPolicy({
    requestUrl: new URL("https://a11ymind-main.vercel.app/scan/demo"),
    hostHeader: "a11ymind-main.vercel.app",
    canonicalAppUrl: "https://www.a11ymind.ai",
  });

  assert.equal(
    policy.redirectTo?.toString(),
    "https://www.a11ymind.ai/scan/demo",
  );
  assert.equal(policy.noindex, true);
});

test("does not redirect localhost in development", () => {
  const policy = getHostPolicy({
    requestUrl: new URL("http://localhost:3000/login"),
    hostHeader: "localhost:3000",
    canonicalAppUrl: "https://www.a11ymind.ai",
  });

  assert.equal(policy.redirectTo, null);
  assert.equal(policy.noindex, false);
});
