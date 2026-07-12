import { logger } from './utils/logger';
import { config } from './config/schema';
import { AssetService } from './services/AssetService';

async function bootstrap() {
    logger.info('Initializing Sesto Sovereignty Engine...', { version: process.env.npm_package_version });

    try {
        const assetService = new AssetService();
        
        // Signal Handling for Graceful Shutdown
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}. Shutting down gracefully...`);
            // Close database connections or file streams here
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        logger.info('Engine started successfully.', { node_env: config.NODE_ENV });
    } catch (error) {
        logger.error('Critical Engine Failure:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
}

bootstrap().catch((err) => {
    console.error('Fatal startup error:', err);
    process.exit(1);
});
