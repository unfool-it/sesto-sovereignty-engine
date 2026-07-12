import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { logger } from '../utils/logger.js';
import { config } from '../config/schema.js';

export class AssetService {
    async generateAssetHash(data: Buffer | Readable): Promise<string> {
        // Dynamically utilize the configured algorithm
        const algorithm = config.SOVEREIGN_SIGNING_ALGORITHM;
        const hash = crypto.createHash(algorithm);
        const source = data instanceof Buffer ? Readable.from(data) : data;
        
        await pipeline(source, hash);
        return hash.digest('hex');
    }

    async verifyAsset(data: Buffer | Readable, expectedHash: string): Promise<boolean> {
        const actualHash = await this.generateAssetHash(data);
        
        // Prevent timing attacks via constant-time comparison
        const actualBuffer = Buffer.from(actualHash, 'hex');
        const expectedBuffer = Buffer.from(expectedHash, 'hex');
        
        let isValid = false;
        if (actualBuffer.length === expectedBuffer.length) {
            isValid = crypto.timingSafeEqual(actualBuffer, expectedBuffer);
        }
        
        if (!isValid) {
            logger.warn({ expected: expectedHash, actual: actualHash }, 'Asset verification failed');
        } else {
            logger.info('Asset verified successfully');
        }
        
        return isValid;
    }
}
