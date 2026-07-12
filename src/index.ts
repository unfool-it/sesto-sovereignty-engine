// src/index.ts
import { logger } from './utils/logger.js';
import { config } from './config/schema.js';
import { AssetService } from './services/AssetService.js';

async function bootstrap() {
    logger.info('Initializing Sesto Sovereignty Engine...', { version: '1.1.0' });

    try {
        const assetService = new AssetService();

        // Demonstration of Sovereign Minting
        // This simulates receiving data from the "External Wilderness"
        const externalData = {
            title: "Venetian Galley Blueprints",
            author: "Arsenal Master",
            telemetry_id: "UA-99021-X", // This should be purged
            unvetted_script: "alert('pwned')", // This should be purged
            metadata: { structural_integrity: "high" }
        };

        const sovereignAsset = await assetService.mint(externalData);
        
        logger.info(sovereignAsset, 'Sovereign Asset produced and verified.');
        
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Purging memory and shutting down...`);
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        logger.info('Engine standing by. Sovereignty status: OPTIMAL.');
    } catch (error) {
        logger.error('Critical Engine Failure:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

bootstrap().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
