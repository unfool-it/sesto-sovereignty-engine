// src/utils/serialization.ts
/**
 * Ensures recursive deterministic ordering of object keys.
 * Critical for cryptographic signature consistency.
 */
export function deepSort(obj: any): any {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }

    const sortedKeys = Object.keys(obj).sort();
    const result: Record<string, any> = {};

    for (const key of sortedKeys) {
        result[key] = deepSort(obj[key]);
    }

    return result;
}
