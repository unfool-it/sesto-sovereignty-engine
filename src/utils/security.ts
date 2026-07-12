// File: sesto-sovereignty-engine-main/src/utils/security.ts

export interface PurgeResult {
  refined: any;
  purgedKeysCount: number;
}

/**
 * Defensive check to verify if a value is a plain object.
 * Prevents corruption of Dates, RegExps, and class instances.
 */
const isPlainObject = (val: unknown): val is Record<string, any> => {
  if (typeof val !== 'object' || val === null) return false;
  const proto = Object.getPrototypeOf(val);
  return proto === null || proto === Object.prototype;
};

/**
 * Recursive Sesto Template Enforcer
 * Only keys explicitly defined in the dynamic Sesto template are preserved.
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

    if (isPlainObject(node)) {
      const refined: Record<string, any> = {};
      for (const [key, value] of Object.entries(node)) {
        if (allowedKeys.has(key)) {
          refined[key] = recurse(value);
        } else {
          purgedKeysCount++;
        }
      }
      return refined;
    }

    return node;
  };

  const refined = recurse(data);
  return { refined, purgedKeysCount };
};
