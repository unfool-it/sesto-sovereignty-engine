// src/services/AssetService.ts (Refined)
import { config } from '../config/schema.js';

export class AssetService {
    /**
     * Enforces the Sovereignty Threshold (S)
     * Rejects any data not explicitly defined in the Sesto Template.
     */
    scrub(data: Record<string, any>): Record<string, any> {
        const allowedKeys = config.ALLOWED_SESTO_KEYS;
        const sanitized = Object.keys(data)
            .filter(key => allowedKeys.has(key))
            .reduce((obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {} as Record<string, any>);

        const entropyLoss = Object.keys(data).length - Object.keys(sanitized).length;
        if (entropyLoss > 0) {
            // Log the purge without leaking the unvetted data
            console.log(`[SOVEREIGNTY_LOG] Purged ${entropyLoss} unauthorized metadata keys.`);
        }
        
        return sanitized;
    }
    // ... existing hash and verify methods
}
