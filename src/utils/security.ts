import { SovereigntyError } from './errors.js';

// Hoisted to module level to prevent garbage collection storms
const ALLOWED_SESTO_KEYS = new Set(['title', 'body', 'author', 'version', 'metadata']);
const MAX_RECURSION_DEPTH = 20;

/**
 * Recursive PII Scrubber with Depth Guard
 * Implements the "Bottega Model" of direct architectural accountability.
 * Only keys explicitly allowed in the 'sesto' are preserved.
 */
export const enforceSestoTemplate = (data: unknown, depth = 0): any => {
  if (depth > MAX_RECURSION_DEPTH) {
    throw new SovereigntyError(
      'Payload depth exceeds the maximum allowed sovereignty threshold. Potential recursion attack vector.',
      400
    );
  }

  if (Array.isArray(data)) {
    return data.map((item) => enforceSestoTemplate(item, depth + 1));
  }

  if (data !== null && typeof data === 'object') {
    const refined: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (ALLOWED_SESTO_KEYS.has(key)) {
        refined[key] = enforceSestoTemplate(value, depth + 1);
      }
    }
    return refined;
  }

  return data;
};
