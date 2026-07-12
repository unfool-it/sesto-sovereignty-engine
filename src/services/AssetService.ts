import crypto from 'crypto';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { logger } from '../utils/logger';

export class AssetService {
    async generateAssetHash(data: Buffer | Readable): Promise<string> {
        const hash = crypto.createHash('sha256');
        const source = data instanceof Buffer ? Readable.from(data) : data;
        
        await pipeline(source, hash);
        return hash.digest('hex');
    }

    async verifyAsset(data: Buffer | Readable, expectedHash: string): Promise<boolean> {
        const actualHash = await this.generateAssetHash(data);
        const isValid = actualHash === expectedHash;
        
        if (!isValid) {
            logger.warn({ expected: expectedHash, actual: actualHash }, 'Asset verification failed');
        } else {
            logger.info('Asset verified successfully');
        }
        
        return isValid;
    }
}
