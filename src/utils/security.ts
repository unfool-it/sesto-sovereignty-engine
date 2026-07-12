import crypto from 'crypto';
import { SecurityError } from './errors.js'; // Note the mandatory .js extension

export class SecurityUtils {
    private static readonly ALGORITHM = 'aes-256-gcm';
    private static readonly IV_LENGTH = 12; // Corrected to 12 bytes (96 bits)
    private static readonly AUTH_TAG_LENGTH = 16;

    static encrypt(data: string, key: string): string {
        try {
            const keyBuffer = Buffer.from(key, 'hex');
            if (keyBuffer.length !== 32) throw new SecurityError('Invalid key length. Must be 32 bytes.');

            const iv = crypto.randomBytes(this.IV_LENGTH);
            const cipher = crypto.createCipheriv(this.ALGORITHM, keyBuffer, iv);
            
            const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()]);
            const authTag = cipher.getAuthTag();

            return Buffer.concat([iv, authTag, encrypted]).toString('hex');
        } catch (error) {
            throw new SecurityError(`Encryption failed: ${(error as Error).message}`);
        }
    }

    static decrypt(cipherText: string, key: string): string {
        try {
            const data = Buffer.from(cipherText, 'hex');
            const keyBuffer = Buffer.from(key, 'hex');
            
            const iv = data.subarray(0, this.IV_LENGTH);
            const authTag = data.subarray(this.IV_LENGTH, this.IV_LENGTH + this.AUTH_TAG_LENGTH);
            const encrypted = data.subarray(this.IV_LENGTH + this.AUTH_TAG_LENGTH);

            const decipher = crypto.createDecipheriv(this.ALGORITHM, keyBuffer, iv);
            decipher.setAuthTag(authTag);

            return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
        } catch (error) {
            throw new SecurityError(`Decryption failed: ${(error as Error).message}`);
        }
    }
}
