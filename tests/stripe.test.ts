import test from "node:test";
import assert from "node:assert/strict";
import { isStripeMissingCustomerError } from "../src/lib/stripe";

test("detects stale Stripe customer errors", () => {
  assert.equal(
    isStripeMissingCustomerError({
      type: "StripeInvalidRequestError",
      message: "No such customer: 'cus_123'",
      code: "resource_missing",
      param: "customer",
    }),
    true,
  );

  assert.equal(
    isStripeMissingCustomerError({
      raw: {
        message: "No such customer: 'cus_456'",
        code: "resource_missing",
        param: "customer",
      },
    }),
    true,
  );
});

test("ignores unrelated Stripe errors", () => {
  assert.equal(
    isStripeMissingCustomerError({
      message: "No such price: 'price_123'",
      code: "resource_missing",
      param: "line_items[0][price]",
    }),
    false,
  );

  assert.equal(isStripeMissingCustomerError(new Error("boom")), false);
});
