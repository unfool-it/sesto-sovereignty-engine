import crypto from 'crypto';
import { config } from '../config/schema.js';
import { AssetError, SecurityError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * @interface SovereignAsset
 * Represents the final, hardened asset structure.
 */
export interface SovereignAsset {
    data: Record<string, any>;
    signature: string;
    timestamp: number;
    version: string;
}

export class AssetService {
    private readonly algorithm: string;

    constructor() {
        this.algorithm = config.SOVEREIGN_SIGNING_ALGORITHM;
    }

    /**
     * Enforces the Sovereignty Threshold (S)
     * @param data - The unvetted input data object
     * @returns A sanitized record containing only allowed keys
     */
    public scrub(data: Record<string, any>): Record<string, any> {
        const allowedKeys = config.ALLOWED_SESTO_KEYS;
        const sanitized = Object.keys(data)
            .filter(key => allowedKeys.has(key))
            .reduce((obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {} as Record<string, any>);

        const entropyLoss = Object.keys(data).length - Object.keys(sanitized).length;
        if (entropyLoss > 0) {
            logger.warn({ entropyLoss }, `Sovereignty Threshold Enforced: Unauthorized keys purged.`);
        }
        
        return sanitized;
    }

    /**
     * Generates a deterministic hash of the scrubbed asset
     * @param data - The sanitized data
     * @returns A hex-encoded signature
     */
    public sign(data: Record<string, any>): string {
        try {
            const payload = JSON.stringify(data, Object.keys(data).sort());
            return crypto
                .createHmac(this.algorithm, config.API_SECRET)
                .update(payload)
                .digest('hex');
        } catch (error) {
            throw new SecurityError(`Asset signing failed: ${(error as Error).message}`);
        }
    }

    /**
     * Transforms raw input into a Sovereign Asset
     * @param input - Unvetted metadata
     */
    public async mint(input: Record<string, any>): Promise<SovereignAsset> {
        logger.info('Minting sovereign asset...');
        
        const scrubbedData = this.scrub(input);
        
        if (Object.keys(scrubbedData).length === 0) {
            throw new AssetError('Asset minting failed: No valid keys remain after sovereignty scrub.');
        }

        const asset: SovereignAsset = {
            data: scrubbedData,
            signature: this.sign(scrubbedData),
            timestamp: Date.now(),
            version: '1.0.0'
        };

        logger.info({ signature: asset.signature }, 'Asset successfully hardened.');
        return asset;
    }
}
