import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatInterface } from '@/components/chat/ChatInterface';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));

describe('ChatInterface Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ messages: [], usedIdeas: [] }),
      })
    ) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the initial empty state with heading and suggestion cards', () => {
    render(
      <ChatInterface
        sessionId="new"
        platforms={['INSTAGRAM']}
        connectedPlatforms={['INSTAGRAM']}
        sessions={[]}
      />
    );

    // Empty state heading
    expect(screen.getByText('What should we post about?')).toBeInTheDocument();
    expect(
      screen.getByText('Ask for ideas, paste a news link, or start from a suggestion.')
    ).toBeInTheDocument();

    // Suggestion cards
    expect(screen.getByText("Scan today's top AI model releases")).toBeInTheDocument();
    expect(
      screen.getByText('3 hot-take carousels on developer salaries vs AI tooling')
    ).toBeInTheDocument();
    expect(screen.getByText('4 practical Docker and Kubernetes tips')).toBeInTheDocument();
    expect(screen.getByText('Turn a news URL into a carousel')).toBeInTheDocument();
  });

  it('renders the composer pinned at the bottom with input and send button', () => {
    render(
      <ChatInterface
        sessionId="new"
        platforms={['INSTAGRAM']}
        connectedPlatforms={['INSTAGRAM']}
        sessions={[]}
      />
    );

    const textarea = screen.getByPlaceholderText(
      'Ask for ideas, paste a news link, or start from a suggestion...'
    );
    expect(textarea).toBeInTheDocument();

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeInTheDocument();
  });

  it('renders Channels, Live tech news, and Recent chats in the right rail', () => {
    render(
      <ChatInterface
        sessionId="new"
        platforms={['INSTAGRAM']}
        connectedPlatforms={['INSTAGRAM']}
        sessions={[
          {
            id: 'sess-1',
            title: 'Google Gemini 4 Argon',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]}
      />
    );

    expect(screen.getByText('Channels')).toBeInTheDocument();
    expect(screen.getByText('Live tech news search')).toBeInTheDocument();
    expect(screen.getByText('Recent chats')).toBeInTheDocument();
    expect(screen.getByText('Google Gemini 4 Argon')).toBeInTheDocument();
  });
});
