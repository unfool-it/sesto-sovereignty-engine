// src/utils/sanitizer.ts
/**
 * InstitutionalSanitizer: A hardened string processor.
 * Replaces dangerous HTML/Script vectors with inert placeholders.
 */
export class InstitutionalSanitizer {
    private static readonly VECTORS = [
        { regex: /<script\b[^>]*>([\s\S]*?)<\/script>/gim, label: 'SCRIPT' },
        { regex: /on\w+="[^"]*"/gim, label: 'EVENT_HANDLER' },
        { regex: /javascript:/gim, label: 'JS_URI' },
        { regex: /<iframe\b[^>]*>([\s\S]*?)<\/iframe>/gim, label: 'IFRAME' },
        { regex: /<object\b[^>]*>([\s\S]*?)<\/object>/gim, label: 'OBJECT' },
        { regex: /data:[^,]+,.*$/gim, label: 'DATA_URI' }
    ];

    public static neutralize(input: string): string {
        let sanitized = input;
        for (const vector of this.VECTORS) {
            sanitized = sanitized.replace(vector.regex, `[VULNERABILITY_PURGED:${vector.label}]`);
        }
        return sanitized;
    }
}
