// src/services/AssetService.ts
import crypto from 'crypto';
import { config } from '../config/schema.js';
import { AssetError, SecurityError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { deepSort } from '../utils/serialization.js';

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
     * Recursively enforces the Sovereignty Threshold (S).
     * Purges unvetted keys and neutralizes script content in strings.
     */
    public scrub(data: any): any {
        if (data === null || typeof data !== 'object') {
            // Neutralize scripts in strings
            if (typeof data === 'string') {
                return data.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '[VULNERABILITY_PURGED]');
            }
            return data;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.scrub(item));
        }

        const allowedKeys = config.ALLOWED_SESTO_KEYS;
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            if (allowedKeys.has(key)) {
                sanitized[key] = this.scrub(value);
            } else {
                logger.warn({ key }, 'Unauthorized key purged at recursive depth.');
            }
        }

        return sanitized;
    }

    /**
     * Generates a deterministic signature using deep-sorted keys.
     */
    public sign(data: Record<string, any>): string {
        try {
            const deterministicData = deepSort(data);
            const payload = JSON.stringify(deterministicData);
            
            return crypto
                .createHmac(this.algorithm, config.API_SECRET)
                .update(payload)
                .digest('hex');
        } catch (error) {
            throw new SecurityError(`Cryptographic signing failed: ${(error as Error).message}`);
        }
    }

    public async mint(input: Record<string, any>): Promise<SovereignAsset> {
        logger.info('Commencing sovereign minting process...');
        
        const scrubbedData = this.scrub(input);
        
        if (Object.keys(scrubbedData).length === 0) {
            throw new AssetError('Minting aborted: Resulting object is empty after sovereignty scrub.');
        }

        const asset: SovereignAsset = {
            data: scrubbedData,
            signature: this.sign(scrubbedData),
            timestamp: Date.now(),
            version: '1.1.0'
        };

        logger.info({ signature: asset.signature }, 'Asset integrity verified.');
        return asset;
    }
}
