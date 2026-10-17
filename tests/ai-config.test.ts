import { maskApiKey, getResolvedAiCredentials } from '@/lib/ai-config';

describe('AI Configuration & Task Routing', () => {
  describe('maskApiKey', () => {
    it('returns null for null, undefined, or empty string', () => {
      // Arrange & Act & Assert
      expect(maskApiKey(null)).toBeNull();
      expect(maskApiKey(undefined)).toBeNull();
      expect(maskApiKey('')).toBeNull();
    });

    it('returns dots for short keys (<= 8 chars)', () => {
      // Arrange
      const shortKey = 'secret';

      // Act
      const masked = maskApiKey(shortKey);

      // Assert
      expect(masked).toBe('••••••••');
    });

    it('masks the middle of long API keys preserving first and last 4 characters', () => {
      // Arrange
      const longKey = 'ollama_cloud_secret_key_1234';

      // Act
      const masked = maskApiKey(longKey);

      // Assert
      expect(masked).toBe('olla••••••••1234');
    });
  });

  describe('getResolvedAiCredentials fallback', () => {
    it('resolves fallback credentials when no userId is passed', async () => {
      // Arrange & Act
      const resolved = await getResolvedAiCredentials();

      // Assert
      expect(resolved).toBeDefined();
      expect(resolved.ollamaBaseUrl).toBeDefined();
      expect(resolved.routing).toBeDefined();
      expect(['higgsfield', 'composio_gemini', 'local_motion']).toContain(
        resolved.routing.reelProvider
      );
      expect(['composio_gemini', 'higgsfield', 'og_typography']).toContain(
        resolved.routing.slideProvider
      );
      expect(['ollama', 'composio_gemini', 'auto']).toContain(
        resolved.routing.textProvider
      );
    });

    it('isolates credentials per user and returns null keys when DB setting is empty', async () => {
      // Arrange & Act
      const resolved = await getResolvedAiCredentials('user-without-keys-123');

      // Assert: Must not fall back to server admin env keys for logged-in user
      expect(resolved.ollamaApiKey).toBeNull();
      expect(resolved.higgsfieldKey).toBeNull();
      expect(resolved.composioApiKey).toBeNull();
    });
  });

  describe('disconnectAiProvider', () => {
    it('disconnects an AI provider and returns updated disconnected state', async () => {
      // Arrange
      const { disconnectAiProvider } = await import('@/lib/ai-config');

      // Act
      const updatedConfig = await disconnectAiProvider('test-user-disconnect', 'ollama');

      // Assert
      expect(updatedConfig.ollama.connected).toBe(false);
      expect(updatedConfig.ollama.hasKey).toBe(false);
      expect(updatedConfig.ollama.apiKeyMasked).toBeNull();
    });
  });
});
