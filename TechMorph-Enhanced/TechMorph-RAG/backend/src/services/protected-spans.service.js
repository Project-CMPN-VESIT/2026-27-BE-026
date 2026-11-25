const PATTERNS = [
  /```[\s\S]*?```/g,
  /`[^`\n]+`/g,
  /https?:\/\/[^\s)]+/gi,
  /\b[A-Za-z]:\\(?:[^\\\s]+\\?)+/g,
  /\b(?:[A-Za-z_][A-Za-z0-9_]*\.)+[A-Za-z_][A-Za-z0-9_]*\b/g,
  /\b[A-Z][A-Z0-9_-]{1,}\b/g,
  /\b(?:0x[\da-f]+|\d+(?:\.\d+)?(?:\s?(?:%|ms|s|sec|seconds?|mV|V|kV|mA|A|kA|Hz|kHz|MHz|GHz|KB|MB|GB|TB|bit|bits|byte|bytes|kg|g|mm|cm|m|km|°C|°F|Pa|kPa|MPa|bar))?)\b/gi,
  /\bO\([^\n)]{1,80}\)/g,
  /\b[A-Za-z]_[A-Za-z0-9]+\b/g,
  /\b[A-Za-z_][A-Za-z0-9_]*\s*=\s*(?:[-+]?\d+(?:\.\d+)?|[A-Za-z_][A-Za-z0-9_]*(?:\s*[+\-*/]\s*[A-Za-z0-9_]+)*)/g,
  /\b\d+\s*[=<>≤≥]\s*\d+\b/g,
  /[∑∫√π∞]/g
];

function alphaToken(index) {
  let value = "";
  let number = index;
  do { value = String.fromCharCode(97 + (number % 26)) + value; number = Math.floor(number / 26) - 1; } while (number >= 0);
  return `⟦tmhold${value}⟧`;
}

export function protectSpans(input) {
  const spans = [];
  let text = input;
  for (const pattern of PATTERNS) {
    text = text.replace(pattern, (match) => {
      const token = alphaToken(spans.length);
      spans.push({ token, value: match });
      return token;
    });
  }
  return { text, spans };
}

export function restoreSpans(text, spans) {
  let output = text;
  for (const { token, value } of spans) {
    output = output.split(token).join(value);
  }
  return output;
}
