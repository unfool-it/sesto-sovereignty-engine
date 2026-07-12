// src/services/VaultService.ts
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../utils/logger.js';
import { SovereignAsset } from './AssetService.js';
import { SovereigntyError } from '../utils/errors.js';

export class VaultService {
    private readonly storagePath: string;

    constructor() {
        this.storagePath = path.join(process.cwd(), 'vault');
    }

    /**
     * Initializes the sovereign storage directory.
     */
    public async initialize(): Promise<void> {
        try {
            await fs.mkdir(this.storagePath, { recursive: true });
            logger.info({ path: this.storagePath }, 'Vault initialized.');
        } catch (error) {
            throw new SovereigntyError(`Vault initialization failed: ${(error as Error).message}`);
        }
    }

    /**
     * Persists a Sovereign Asset to the institutional record.
     */
    public async archive(asset: SovereignAsset): Promise<string> {
        const fileName = `asset_${asset.signature.slice(0, 16)}_${asset.timestamp}.json`;
        const filePath = path.join(this.storagePath, fileName);

        try {
            await fs.writeFile(filePath, JSON.stringify(asset, null, 2), 'utf8');
            logger.info({ fileName }, 'Asset archived to sovereign vault.');
            return filePath;
        } catch (error) {
            throw new SovereigntyError(`Archival failed: ${(error as Error).message}`);
        }
    }
}
