import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSlackWebhookUrl } from "../src/lib/slack";

test("normalizeSlackWebhookUrl accepts valid Slack webhook URLs", () => {
  assert.equal(
    normalizeSlackWebhookUrl("https://hooks.slack.com/services/T000/B000/abc123"),
    "https://hooks.slack.com/services/T000/B000/abc123",
  );
  assert.equal(
    normalizeSlackWebhookUrl("https://hooks.slack-gov.com/services/T000/B000/abc123"),
    "https://hooks.slack-gov.com/services/T000/B000/abc123",
  );
});

test("normalizeSlackWebhookUrl rejects non-Slack and malformed webhook URLs", () => {
  assert.equal(normalizeSlackWebhookUrl(""), null);
  assert.equal(normalizeSlackWebhookUrl("http://hooks.slack.com/services/T/B/C"), null);
  assert.equal(normalizeSlackWebhookUrl("https://example.com/services/T/B/C"), null);
  assert.equal(normalizeSlackWebhookUrl("https://hooks.slack.com/not-services"), null);
  assert.equal(normalizeSlackWebhookUrl("not-a-url"), null);
});
