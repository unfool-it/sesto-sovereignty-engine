// src/utils/security.ts
import crypto from 'crypto';
import { SecurityError } from './errors.js';
import { config } from '../config/schema.js';

/**
 * SecurityUtils: Provides hardened cryptographic operations.
 * Implements HKDF for key derivation to ensure distinct keys for 
 * encryption and signing, adhering to cryptographic best practices.
 */
export class SecurityUtils {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly IV_LENGTH = 12;
    private static readonly AUTH_TAG_LENGTH = 16;
    private static readonly KEY_LENGTH = 32;

    /**
     * Derives a sub-key from the master API_SECRET.
     * @param info - Context-specific string for key separation.
     */
    private static deriveKey(info: string): Buffer {
        return crypto.hkdfSync(
            'sha256',
            config.API_SECRET,
            '',
            info,
            this.KEY_LENGTH
        );
    }

    /**
     * Encrypts plaintext using AES-256-GCM with a derived key.
     */
    static encrypt(data: string): string {
        try {
            const key = this.deriveKey('sesto-encryption-v1');
            const iv = crypto.randomBytes(this.IV_LENGTH);
            const cipher = crypto.createCipheriv(this.ALGORITHM, key, iv);
            
            const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
            const authTag = cipher.getAuthTag();

            // Structure: IV (12) | AuthTag (16) | Ciphertext
            return Buffer.concat([iv, authTag, encrypted]).toString('hex');
        } catch (error) {
            throw new SecurityError(`Encryption phase failure: ${(error as Error).message}`);
        }
    }

    /**
     * Decrypts ciphertext and validates integrity via AuthTag.
     */
    static decrypt(cipherText: string): string {
        try {
            const data = Buffer.from(cipherText, 'hex');
            const key = this.deriveKey('sesto-encryption-v1');
            
            const iv = data.subarray(0, this.IV_LENGTH);
            const authTag = data.subarray(this.IV_LENGTH, this.IV_LENGTH + this.AUTH_TAG_LENGTH);
            const encrypted = data.subarray(this.IV_LENGTH + this.AUTH_TAG_LENGTH);

            const decipher = crypto.createDecipheriv(this.ALGORITHM, key, iv);
            decipher.setAuthTag(authTag);

            return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
        } catch (error) {
            throw new SecurityError(`Decryption phase failure: integrity check failed or invalid key.`);
        }
    }

    /**
     * Generates an HMAC signature using a derived signing key.
     */
    static sign(payload: string): string {
        const signingKey = this.deriveKey('sesto-signing-v1');
        return crypto
            .createHmac(config.SOVEREIGN_SIGNING_ALGORITHM, signingKey)
            .update(payload)
            .digest('hex');
    }
}

// src/services/AssetService.ts
import { config } from '../config/schema.js';
import { AssetError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { deepSort } from '../utils/serialization.js';
import { SecurityUtils } from '../utils/security.js';

export interface SovereigntyMetrics {
    originalKeyCount: number;
    purgedKeyCount: number;
    privacyIntegrityFactor: number; // P
}

export interface SovereignAsset {
    data: Record<string, any>;
    signature: string;
    timestamp: number;
    version: string;
    metrics: SovereigntyMetrics;
}

/**
 * AssetService: The engine of the Sovereignty Threshold protocol.
 * Responsible for recursive scrubbing and asset minting.
 */
export class AssetService {
    /**
     * Recursively purges unvetted keys and neutralizes script vectors.
     * Enforces the mathematical S transformation.
     */
    private scrubRecursively(data: any, stats: { total: number; purged: number }): any {
        if (data === null || typeof data !== 'object') {
            if (typeof data === 'string') {
                // Neutralize scripts and event handlers
                return data
                    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '[VULNERABILITY_PURGED]')
                    .replace(/on\w+="[^"]*"/gim, '[HANDLER_PURGED]')
                    .replace(/javascript:/gim, '[URI_VEC_PURGED]');
            }
            return data;
        }

        if (Array.isArray(data)) {
            return data.map(item => this.scrubRecursively(item, stats));
        }

        const allowedKeys = config.ALLOWED_SESTO_KEYS;
        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            stats.total++;
            if (allowedKeys.has(key)) {
                sanitized[key] = this.scrubRecursively(value, stats);
            } else {
                stats.purged++;
                logger.warn({ key }, 'Institutional non-compliance: Key purged.');
            }
        }

        return sanitized;
    }

    /**
     * Mints a new Sovereign Asset from raw data.
     * @param input - The unvetted wilderness data.
     */
    public async mint(input: Record<string, any>): Promise<SovereignAsset> {
        logger.info('Initiating Sovereign Minting Protocol...');

        const stats = { total: 0, purged: 0 };
        const scrubbedData = this.scrubRecursively(input, stats);

        if (Object.keys(scrubbedData).length === 0) {
            throw new AssetError('Minting aborted: Data failed the Sovereignty Threshold.');
        }

        const pFactor = stats.total > 0 ? (stats.total - stats.purged) / stats.total : 1;
        const deterministicPayload = JSON.stringify(deepSort(scrubbedData));

        const asset: SovereignAsset = {
            data: scrubbedData,
            signature: SecurityUtils.sign(deterministicPayload),
            timestamp: Date.now(),
            version: '1.2.0',
            metrics: {
                originalKeyCount: stats.total,
                purgedKeyCount: stats.purged,
                privacyIntegrityFactor: pFactor
            }
        };

        logger.info({ 
            signature: asset.signature, 
            P: asset.metrics.privacyIntegrityFactor 
        }, 'Sovereign Asset validated and signed.');

        return asset;
    }
}
