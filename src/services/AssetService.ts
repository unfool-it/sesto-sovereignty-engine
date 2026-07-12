// File: sesto-sovereignty-engine-main/src/services/AssetService.ts
import crypto from 'node:crypto';
import { logger } from '../utils/logger.js';
import { enforceSestoTemplate } from '../utils/security.js';
import { AssetInsecureError } from '../utils/errors.js';
import { EnvSchema } from '../config/schema.js';

const env = EnvSchema.parse(process.env);

export interface AssetPayload {
  title: string;
  body: string;
  external_scripts?: string[];
  [key: string]: any; // Allows arbitrary keys to pass through to the Sesto filter
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
  /**
   * Hardens the digital asset by purging external dependencies,
   * enforcing the Venetian Sesto templates, and applying a cryptographic seal.
   */
  async hardenAsset(payload: AssetPayload): Promise<SovereignAssetResponse> {
    logger.info({ asset: payload.title }, 'Commencing asset hardening protocol');

    // 1. Check for "Security Degradation" (External Scripts)
    if (payload.external_scripts && payload.external_scripts.length > 0) {
      throw new AssetInsecureError('External script dependencies detected. Proprietary leak risk high.');
    }

    // 2. Perform Recursive Sesto Enforcement (PII Scrubbing & Telemetry Purge)
    const { refined: hardenedData, purgedKeysCount } = enforceSestoTemplate(
      payload,
      env.ALLOWED_SESTO_KEYS
    );

    // 3. Calculate Sovereignty Index (S)
    // S = Preserved Keys / Total Keys Ingested
    const totalKeys = Object.keys(payload).length;
    const sovereigntyIndex = totalKeys > 0 ? (totalKeys - purgedKeysCount) / totalKeys : 1.0;

    // 4. Establish Cryptographic Sovereignty via "The Doge's Seal" (HMAC Signature)
    try {
      const fingerprint = crypto.randomUUID();
      const serializedData = JSON.stringify(hardenedData);
      
      const cryptographicSeal = crypto
        .createHmac(env.SOVEREIGN_SIGNING_ALGORITHM, env.API_SECRET)
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
