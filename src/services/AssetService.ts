// File: sesto-sovereignty-engine-main/src/services/AssetService.ts
import crypto from 'node:crypto';
import { logger } from '../utils/logger.js';
import { enforceSestoTemplate } from '../utils/security.js';
import { AssetInsecureError } from '../utils/errors.js';
import { config } from '../config/schema.js';

export interface AssetPayload {
  title: string;
  body: string;
  external_scripts?: string[];
  [key: string]: any;
}

export interface SovereignAssetResponse {
  status: string;
  timestamp: string;
  fingerprint: string;
  cryptographic_seal: string;
  audit: {
    purged_elements: number;
    sovereignty_index: number;
  };
  asset: any;
}

export class AssetService {
  async hardenAsset(payload: AssetPayload): Promise<SovereignAssetResponse> {
    logger.info({ asset: payload.title }, 'Commencing asset hardening protocol');

    if (payload.external_scripts && payload.external_scripts.length > 0) {
      throw new AssetInsecureError('External script dependencies detected. Proprietary leak risk high.');
    }

    const { refined: hardenedData, purgedKeysCount } = enforceSestoTemplate(
      payload,
      config.ALLOWED_SESTO_KEYS
    );

    const totalKeys = Object.keys(payload).length;
    const sovereigntyIndex = totalKeys > 0 ? (totalKeys - purgedKeysCount) / totalKeys : 1.0;

    try {
      const fingerprint = crypto.randomUUID();
      const serializedData = JSON.stringify(hardenedData);
      
      const cryptographicSeal = crypto
        .createHmac(config.SOVEREIGN_SIGNING_ALGORITHM, config.API_SECRET)
        .update(`${fingerprint}:${serializedData}`)
        .digest('hex');

      return {
        status: 'SOVEREIGN_OWNERSHIP_ESTABLISHED',
        timestamp: new Date().toISOString(),
        fingerprint,
        cryptographic_seal: cryptographicSeal,
        audit: {
          purged_elements: purgedKeysCount,
          sovereignty_index: parseFloat(sovereigntyIndex.toFixed(4))
        },
        asset: hardenedData
      };
    } catch (err) {
      logger.error(err, 'Failed to establish cryptographic sovereignty');
      throw err;
    }
  }
}
