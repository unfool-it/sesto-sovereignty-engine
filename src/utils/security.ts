/**
 * Recursive PII Scrubber
 * Implements the "Bottega Model" of direct architectural accountability.
 * Only keys explicitly allowed in the 'sesto' are preserved.
 */
export const enforceSestoTemplate = (data: unknown): any => {
  const ALLOWED_SESTO_KEYS = new Set(['title', 'body', 'author', 'version', 'metadata']);

  if (Array.isArray(data)) {
    return data.map(enforceSestoTemplate);
  }

  if (data !== null && typeof data === 'object') {
    const refined: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (ALLOWED_SESTO_KEYS.has(key)) {
        refined[key] = enforceSestoTemplate(value);
      }
      // Keys not in the sesto are dropped to prevent unmonitored harvesting
    }
    return refined;
  }

  return data;
};
