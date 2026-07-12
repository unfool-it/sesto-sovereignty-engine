import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { logger } from '../utils/logger.js';
import { config } from '../config/schema.js';

export class AssetService {
    /**
     * Enforces the Sovereignty Threshold (S) by scrubbing non-permitted keys.
     * f(Di) = Di if i ∈ K, else Ø
     */
    scrub(data: Record<string, any>): Record<string, any> {
        const allowedKeys = config.ALLOWED_SESTO_KEYS;
        return Object.keys(data)
            .filter(key => allowedKeys.has(key))
            .reduce((obj, key) => {
                obj[key] = data[key];
                return obj;
            }, {} as Record<string, any>);
    }

    async generateAssetHash(data: Buffer | Readable): Promise<string> {
        const algorithm = config.SOVEREIGN_SIGNING_ALGORITHM;
        const hash = crypto.createHash(algorithm);
        const source = data instanceof Buffer ? Readable.from(data) : data;
        
        await pipeline(source, hash);
        return hash.digest('hex');
    }

    async verifyAsset(data: Buffer | Readable, expectedHash: string): Promise<boolean> {
        const actualHash = await this.generateAssetHash(data);
        const actualBuffer = Buffer.from(actualHash, 'hex');
        const expectedBuffer = Buffer.from(expectedHash, 'hex');
        
        let isValid = false;
        if (actualBuffer.length === expectedBuffer.length) {
            isValid = crypto.timingSafeEqual(actualBuffer, expectedBuffer);
        }
        
        if (!isValid) {
            logger.warn({ expected: expectedHash, actual: actualHash }, 'Asset verification failed');
        }
        return isValid;
    }
}
