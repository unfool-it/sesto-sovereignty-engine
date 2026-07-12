// src/services/AssetService.ts
import { config } from '../config/schema.js';
import { AssetError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { deepSort } from '../utils/serialization.js';
import { SecurityUtils } from '../utils/security.js';
import { InstitutionalSanitizer } from '../utils/sanitizer.js';

export interface SovereigntyMetrics {
    originalKeyCount: number;
    purgedKeyCount: number;
    privacyIntegrityFactor: number; 
}

export interface SovereignAsset {
    data: Record<string, any>;
    signature: string;
    timestamp: number;
    version: string;
    metrics: SovereigntyMetrics;
}

export class AssetService {
    private readonly MAX_DEPTH = 10;
    private readonly MIN_P_THRESHOLD = 0.5; // Institutional minimum

    /**
     * Recursive scrubbing with depth-guard and enhanced neutralization.
     */
    private scrubRecursively(
        data: any, 
        stats: { total: number; purged: number }, 
        depth: number = 0
    ): any {
        if (depth > this.MAX_DEPTH) {
            throw new AssetError('Sovereignty Violation: Maximum recursion depth exceeded.');
        }

        if (data === null || typeof data !== 'object') {
            if (typeof data === 'string') {
                return InstitutionalSanitizer.neutralize(data);
            }
            return data;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.scrubRecursively(item, stats, depth + 1));
        }

        const allowedKeys = config.ALLOWED_SESTO_KEYS;
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            stats.total++;
            if (allowedKeys.has(key)) {
                sanitized[key] = this.scrubRecursively(value, stats, depth + 1);
            } else {
                stats.purged++;
                logger.warn({ key, depth }, 'Key purged: Institutional non-compliance.');
            }
        }

        return sanitized;
    }

    /**
     * Mints a Sovereign Asset. Enforces the P-Factor Threshold.
     */
    public async mint(input: Record<string, any>): Promise<SovereignAsset> {
        logger.info('Commencing Sovereign Minting Protocol...');

        const stats = { total: 0, purged: 0 };
        const scrubbedData = this.scrubRecursively(input, stats);

        const pFactor = stats.total > 0 ? (stats.total - stats.purged) / stats.total : 1;

        if (pFactor < this.MIN_P_THRESHOLD) {
            throw new AssetError(`Minting Aborted: Privacy Integrity Factor (${pFactor.toFixed(2)}) below institutional threshold.`);
        }

        if (Object.keys(scrubbedData).length === 0) {
            throw new AssetError('Minting Aborted: Resulting object is void.');
        }

        const deterministicPayload = JSON.stringify(deepSort(scrubbedData));

        const asset: SovereignAsset = {
            data: scrubbedData,
            signature: SecurityUtils.sign(deterministicPayload),
            timestamp: Date.now(),
            version: '1.2.1',
            metrics: {
                originalKeyCount: stats.total,
                purgedKeyCount: stats.purged,
                privacyIntegrityFactor: pFactor
            }
        };

        logger.info({ 
            signature: asset.signature, 
            P: asset.metrics.privacyIntegrityFactor 
        }, 'Asset successfully minted and signed.');

        return asset;
    }
}
