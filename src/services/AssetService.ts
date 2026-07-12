import crypto from 'crypto';
import { logger } from '../utils/logger';
import { AssetError } from '../utils/errors';

export interface AssetMetadata {
    id: string;
    hash: string;
    timestamp: number;
}

export class AssetService {
    async generateAssetHash(data: Buffer): Promise<string> {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    async verifyAsset(data: Buffer, expectedHash: string): Promise<boolean> {
        const actualHash = await this.generateAssetHash(data);
        const isValid = actualHash === expectedHash;
        
        if (!isValid) {
            logger.warn('Asset verification failed', { expected: expectedHash, actual: actualHash });
        } else {
            logger.info('Asset verified successfully');
        }
        
        return isValid;
    }
}
