const NEGATION = /\b(not|never|without|neither|nor|cannot|can't|doesn't|don't|isn't|aren't|no)\b/i;

export function validateTranslation(source, translation, glossary = [], protectedSpans = []) {
  const issues = [];
  for (const { value } of protectedSpans) {
    if (!translation.includes(value)) {
      issues.push({ code: "protected_span_missing", severity: "high", message: `Protected content may have changed or gone missing: ${value.slice(0, 70)}` });
    }
  }

  const sourceNumbers = source.match(/(?<![\p{L}\p{N}_])[-+]?\d+(?:[.,]\d+)?%?(?![\p{L}\p{N}_])/gu) || [];
  const outputNumbers = translation.match(/(?<![\p{L}\p{N}_])[-+]?\d+(?:[.,]\d+)?%?(?![\p{L}\p{N}_])/gu) || [];
  for (const number of sourceNumbers) {
    if (!outputNumbers.includes(number)) {
      issues.push({ code: "number_missing", severity: "high", message: `Numeric value not found in output: ${number}` });
    }
  }

  if (NEGATION.test(source)) {
    issues.push({ code: "negation_review", severity: "medium", message: "Source contains negation. Confirm that the translated sentence preserves the negative meaning." });
  }

  for (const entry of glossary) {
    const sourceTerm = String(entry.sourceTerm || "").trim();
    const targetTerm = String(entry.targetTerm || "").trim();
    if (!sourceTerm || !targetTerm || !new RegExp(`(^|[^\\p{L}\\p{N}_])${sourceTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^\\p{L}\\p{N}_])`, "iu").test(source)) continue;
    if (!translation.toLocaleLowerCase().includes(targetTerm.toLocaleLowerCase())) {
      issues.push({ code: "glossary_term_missing", severity: "medium", message: `Approved term may be missing: ${sourceTerm} → ${targetTerm}` });
    }
  }

  const sourceCode = (source.match(/`[^`\n]+`/g) || []);
  for (const item of sourceCode) {
    if (!translation.includes(item)) issues.push({ code: "code_span_missing", severity: "high", message: `Code span changed or missing: ${item}` });
  }

  return {
    status: issues.some((issue) => issue.severity === "high") ? "review_required" : issues.length ? "review_suggested" : "checks_passed",
    issueCount: issues.length,
    issues
  };
}
