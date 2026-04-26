import test from "node:test";
import assert from "node:assert/strict";
import { internalWorkerUrl } from "../src/lib/internal-worker-url";

const originalEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NODE_ENV: process.env.NODE_ENV,
};

test.afterEach(() => {
  setEnv("NEXT_PUBLIC_APP_URL", originalEnv.NEXT_PUBLIC_APP_URL);
  setEnv("NEXTAUTH_URL", originalEnv.NEXTAUTH_URL);
  setEnv("NODE_ENV", originalEnv.NODE_ENV);
});

test("internalWorkerUrl uses the configured app origin instead of request host input", () => {
  setEnv("NEXT_PUBLIC_APP_URL", "https://www.a11ymind.ai/app?ignored=1");
  setEnv("NEXTAUTH_URL", undefined);
  setEnv("NODE_ENV", "production");

  assert.equal(
    internalWorkerUrl("/api/internal/scan-worker"),
    "https://www.a11ymind.ai/api/internal/scan-worker",
  );
});

test("internalWorkerUrl rejects local production origins", () => {
  setEnv("NEXT_PUBLIC_APP_URL", "http://127.0.0.1:3000");
  setEnv("NEXTAUTH_URL", undefined);
  setEnv("NODE_ENV", "production");

  assert.throws(
    () => internalWorkerUrl("/api/internal/scan-worker"),
    /local address/i,
  );
});

function setEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
