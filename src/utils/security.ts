/**
 * Context-Aware Recursive PII Scrubber
 * Implements the "Bottega Model" of direct architectural accountability.
 * Only keys explicitly allowed in the 'sesto' are preserved at the root level.
 * Nested structures within allowed container keys (e.g., 'metadata') are preserved
 * but sanitized of common PII patterns.
 */
const ALLOWED_ROOT_KEYS = new Set(['title', 'body', 'author', 'version', 'metadata']);

const PII_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api_?key/i,
  /credit_?card/i,
  /ssn/i
];

export const enforceSestoTemplate = (data: unknown, isRoot = true): any => {
  if (Array.isArray(data)) {
    return data.map(item => enforceSestoTemplate(item, false));
  }

  if (data !== null && typeof data === 'object') {
    const refined: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (isRoot) {
        // At the root level, strictly enforce the Sesto template keys
        if (ALLOWED_ROOT_KEYS.has(key)) {
          refined[key] = enforceSestoTemplate(value, false);
        }
      } else {
        // In nested structures, preserve keys but redact potential PII keys
        const isPiiKey = PII_PATTERNS.some(pattern => pattern.test(key));
        if (!isPiiKey) {
          refined[key] = enforceSestoTemplate(value, false);
        } else {
          refined[key] = '[REDACTED_SOVEREIGN_DATA]';
        }
      }
    }
    return refined;
  }

  return data;
};
