import test from "node:test";
import assert from "node:assert/strict";
import { protectSpans, restoreSpans } from "../src/services/protected-spans.service.js";
import { validateTranslation } from "../src/services/quality.service.js";

test("protected content round-trips without mutation", () => {
  const source = "Use TCP with 256 bits, `user_id`, O(n log n), and https://example.com/api.";
  const protectedResult = protectSpans(source);
  assert.notEqual(protectedResult.text, source);
  assert.equal(restoreSpans(protectedResult.text, protectedResult.spans), source);
});

test("protected tokens are unique for a large number of spans", () => {
  const source = Array.from({ length: 800 }, (_, index) => `value ${index} ms`).join(", ");
  const result = protectSpans(source);
  const tokens = result.spans.map((span) => span.token);
  assert.equal(new Set(tokens).size, tokens.length);
  assert.equal(restoreSpans(result.text, result.spans), source);
});

test("QA flags a missing protected formula", () => {
  const source = "The algorithm runs in O(n log n).";
  const protectedResult = protectSpans(source);
  const output = restoreSpans(protectedResult.text.replace(protectedResult.spans[0].token, ""), protectedResult.spans);
  const report = validateTranslation(source, output, [], protectedResult.spans);
  assert.equal(report.status, "review_required");
  assert.ok(report.issues.some((issue) => issue.code === "protected_span_missing"));
});

test("QA flags a missing approved glossary term", () => {
  const report = validateTranslation("TCP congestion control adjusts the rate.", "टीसीपी दर समायोजित करता है।", [{ sourceTerm: "congestion control", targetTerm: "कंजेशन कंट्रोल" }], []);
  assert.ok(report.issues.some((issue) => issue.code === "glossary_term_missing"));
});

test("QA flags numeric values that disappear", () => {
  const report = validateTranslation("Set the timeout to 37 seconds.", "समय सीमा निर्धारित करें।", [], []);
  assert.ok(report.issues.some((issue) => issue.code === "number_missing"));
});
