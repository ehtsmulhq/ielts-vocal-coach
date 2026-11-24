/**
 * Extracts and parses JSON from model responses, tolerating markdown fences,
 * leading/trailing commentary, trailing commas and stray control characters.
 */
export function safeParseJson<T>(raw: string): T {
  let text = raw.trim();

  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = text.lastIndexOf("}");
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = text.lastIndexOf("]");
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const extracted = text.substring(startIdx, endIdx + 1);
      try {
        return JSON.parse(extracted) as T;
      } catch {
        const sanitized = extracted
          .replace(/,\s*([}\]])/g, "$1")
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "");
        return JSON.parse(sanitized) as T;
      }
    }

    throw new Error(`Failed to parse structured JSON from model response: ${text.slice(0, 150)}...`);
  }
}
