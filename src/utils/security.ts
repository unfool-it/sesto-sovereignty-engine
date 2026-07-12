// File: sesto-sovereignty-engine-main/src/utils/security.ts

export interface PurgeResult {
  refined: any;
  purgedKeysCount: number;
}

/**
 * Recursive Sesto Template Enforcer
 * Implements the "Bottega Model" of direct architectural accountability.
 * Only keys explicitly defined in the dynamic Sesto template are preserved.
 * All other keys are purged, and their occurrences are audited.
 */
export const enforceSestoTemplate = (
  data: unknown,
  allowedKeys: Set<string>
): PurgeResult => {
  let purgedKeysCount = 0;

  const recurse = (node: unknown): any => {
    if (Array.isArray(node)) {
      return node.map(recurse);
    }

    if (node !== null && typeof node === 'object') {
      const refined: Record<string, any> = {};
      for (const [key, value] of Object.entries(node)) {
        if (allowedKeys.has(key)) {
          refined[key] = recurse(value);
        } else {
          purgedKeysCount++;
          // Unvetted keys are dropped to prevent unmonitored data harvesting
        }
      }
      return refined;
    }

    return node;
  };

  const refined = recurse(data);
  return { refined, purgedKeysCount };
};
