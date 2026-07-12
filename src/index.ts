// src/index.ts
import { logger } from './utils/logger.js';
import { config } from './config/schema.js';
import { AssetService } from './services/AssetService.js';

async function bootstrap() {
    logger.info('Initializing Sesto Sovereignty Engine...', { version: '1.1.0' });

    try {
        const assetService = new AssetService();
        
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Purging memory and shutting down...`);
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        logger.info('Engine started successfully.', { 
            node_env: config.NODE_ENV,
            sovereignty_status: 'ACTIVE' 
        });
    } catch (error) {
        logger.error('Critical Engine Failure:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

bootstrap().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
