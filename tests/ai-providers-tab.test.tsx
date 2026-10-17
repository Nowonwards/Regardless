import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AiProvidersTab } from '@/components/settings/AiProvidersTab';

describe('AiProvidersTab', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation((url) => {
      if (url === '/api/settings/ai') {
        return Promise.resolve({
          json: () =>
            Promise.resolve({
              config: {
                ollama: {
                  connected: true,
                  hasKey: true,
                  apiKeyMasked: 'olla••••••••1234',
                  baseUrl: 'https://api.ollama.com',
                  model: 'gemma4:31b',
                },
                higgsfield: {
                  connected: true,
                  hasKey: true,
                  apiKeyMasked: 'higg••••••••5678',
                  model: 'bytedance/seedance-2.5/text-to-video',
                },
                composio: {
                  connected: false,
                  hasKey: false,
                  apiKeyMasked: null,
                  model: 'gemini-2.5-flash',
                },
                routing: {
                  reelProvider: 'higgsfield',
                  slideProvider: 'composio_gemini',
                  textProvider: 'ollama',
                },
              },
            }),
        });
      }
      return Promise.resolve({ json: () => Promise.resolve({}) });
    }) as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the AI provider connection cards and routing matrix', async () => {
    // Arrange & Act
    render(<AiProvidersTab />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('AI Provider Connections')).toBeInTheDocument();
      expect(screen.getAllByText('Ollama Cloud').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Higgsfield AI').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Composio (Gemini & Veo)')).toBeInTheDocument();
      expect(screen.getByText('AI Task Routing Matrix')).toBeInTheDocument();
      expect(screen.getByText('1. Reel Creation & Video Engine')).toBeInTheDocument();
      expect(screen.getByText('2. Images for Carousel Slides')).toBeInTheDocument();
      expect(screen.getByText('3. Text, Post Copy & Ideation Chat')).toBeInTheDocument();
      expect(screen.getByText('2 OF 3 CONNECTED')).toBeInTheDocument();
    });
  });
});
