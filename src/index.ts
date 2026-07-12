// src/index.ts
import { logger } from './utils/logger.js';
import { config } from './config/schema.js';
import { AssetService } from './services/AssetService.js';
import { VaultService } from './services/VaultService.js';

async function bootstrap() {
    logger.info('🏛️ Sesto Sovereignty Engine | Initializing Institutional Core', { 
        env: config.NODE_ENV,
        port: config.PORT 
    });

    try {
        const assetService = new AssetService();
        const vaultService = new VaultService();

        // Prepare Sovereign Storage
        await vaultService.initialize();

        // Simulate High-Entropy Wilderness Data
        const externalPayload = {
            title: "Arsenal Structural Integrity Report",
            author: "Chief Architect",
            metadata: {
                version: "XV-II",
                telemetry_beacon: "882-110", // Should be purged recursively
                notes: "Verified by <script>alert('malice')</script> Senate." // Script should be neutralized
            },
            unvetted_system_key: "DELETE_ALL" // Should be purged
        };

        // Execution of the Sovereignty Protocol
        const asset = await assetService.mint(externalPayload);
        const archivePath = await vaultService.archive(asset);
        
        logger.info({ archivePath }, 'Sovereign Asset securely archived.');

        const shutdown = async (signal: string) => {
            logger.info(`Protocol ${signal} received. Harmonizing state and exiting...`);
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        logger.info('Sesto Engine active. Sovereignty Threshold: SECURE.');
    } catch (error) {
        logger.fatal({ 
            error: error instanceof Error ? error.message : 'Unknown Failure',
            stack: error instanceof Error ? error.stack : undefined 
        }, 'Critical Engine Failure.');
        process.exit(1);
    }
}

bootstrap().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
