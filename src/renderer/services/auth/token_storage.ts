import electronSettings from "electron-settings";
import log from "electron-log";

const TOKENS_KEY = "accounts.tokens";

/**
 * TokenStorage handles secure storage of Firebase refresh tokens using OS-level encryption
 * via Electron's safeStorage API (Keychain on macOS, DPAPI on Windows, libsecret on Linux).
 */
export class TokenStorage {
  private isAvailable: boolean | null = null;

  /**
   * Check if encryption is available on this system
   */
  async checkEncryptionAvailable(): Promise<boolean> {
    if (this.isAvailable !== null) {
      return this.isAvailable;
    }

    try {
      this.isAvailable = await window.electron.common.isEncryptionAvailable();
      return this.isAvailable;
    } catch (err) {
      log.error("Failed to check encryption availability:", err);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Store an encrypted refresh token for an account
   */
  async storeToken(uid: string, refreshToken: string): Promise<void> {
    const available = await this.checkEncryptionAvailable();
    if (!available) {
      throw new Error("Encryption is not available on this system");
    }

    try {
      // Encrypt using OS keychain via IPC
      const encrypted = await window.electron.common.encryptString(refreshToken);

      // Store encrypted token in electron-settings
      await electronSettings.set(`${TOKENS_KEY}.${uid}`, encrypted);

      log.info(`Stored encrypted token for account: ${uid}`);
    } catch (err) {
      log.error(`Failed to store token for account ${uid}:`, err);
      throw new Error("Failed to encrypt and store token");
    }
  }

  /**
   * Retrieve and decrypt a refresh token for an account
   */
  async getToken(uid: string): Promise<string | null> {
    const available = await this.checkEncryptionAvailable();
    if (!available) {
      log.warn("Encryption not available, cannot retrieve token");
      return null;
    }

    try {
      // Get encrypted data from storage
      const encrypted = (await electronSettings.get(`${TOKENS_KEY}.${uid}`)) as string | undefined;

      if (!encrypted) {
        return null;
      }

      // Decrypt using OS keychain via IPC
      const token = await window.electron.common.decryptString(encrypted);

      return token;
    } catch (err) {
      log.error(`Failed to decrypt token for account ${uid}:`, err);
      // Token might be corrupted or from different machine
      return null;
    }
  }

  /**
   * Remove a token from storage
   */
  async removeToken(uid: string): Promise<void> {
    try {
      await electronSettings.unset(`${TOKENS_KEY}.${uid}`);
      log.info(`Removed token for account: ${uid}`);
    } catch (err) {
      log.error(`Failed to remove token for account ${uid}:`, err);
      throw err;
    }
  }

  /**
   * Get all stored token UIDs
   */
  async getAllTokenUids(): Promise<string[]> {
    try {
      const tokens = (await electronSettings.get(TOKENS_KEY)) as Record<string, string> | undefined;
      return tokens ? Object.keys(tokens) : [];
    } catch (err) {
      log.error("Failed to get all token UIDs:", err);
      return [];
    }
  }

  /**
   * Clear all stored tokens (use with caution)
   */
  async clearAllTokens(): Promise<void> {
    try {
      await electronSettings.unset(TOKENS_KEY);
      log.info("Cleared all stored tokens");
    } catch (err) {
      log.error("Failed to clear tokens:", err);
      throw err;
    }
  }
}

// Export a singleton instance
export const tokenStorage = new TokenStorage();

