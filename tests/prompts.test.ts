import { createIdeationPrompt, formatChatTitle, IDEATION_SYSTEM_PROMPT } from '@/lib/agents/prompts';

describe('Ideation Prompts & Search Grounding', () => {
  it('creates ideation prompt with mandatory search grounding and target platforms', () => {
    // Arrange
    const userMessage = "let's create instagram posts ideas on gemini 4 argon";
    const history = [{ role: 'assistant', content: 'What would you like to post about?' }];
    const platforms = ['INSTAGRAM'];
    const fakeSearchResults =
      '### Verified Tech News / Live Search Results (Query: "gemini 4 argon")\n' +
      'Summary: Gemini 4 Argon is now available in GitHub Copilot and Google Antigravity.';

    // Act
    const prompt = createIdeationPrompt(
      userMessage,
      history,
      platforms,
      undefined,
      fakeSearchResults
    );

    // Assert
    expect(prompt.length).toBeGreaterThanOrEqual(3);
    expect(prompt[0].role).toBe('system');
    expect(prompt[0].content).toContain('REAL-TIME SEARCH GROUND TRUTH (CRITICAL)');
    expect(prompt[0].content).toContain(
      'NEVER claim, hypothesize, or hallucinate that "there is no tech news circulating"'
    );

    const lastMessage = prompt[prompt.length - 1];
    expect(lastMessage.role).toBe('user');
    expect(lastMessage.content).toContain('Target Platforms (MANDATORY): INSTAGRAM');
    expect(lastMessage.content).toContain('Verified Real-Time Search Results');
    expect(lastMessage.content).toContain('Gemini 4 Argon is now available in GitHub Copilot');
    expect(lastMessage.content).toContain('Do not question their authenticity or claim the topic does not exist.');
    expect(lastMessage.content).toContain(`User Request: ${userMessage}`);
  });

  it('formats clean chat titles from user prompt and search query', () => {
    // Arrange & Act
    const titleFromSearch = formatChatTitle('give me ideas', 'gemini 4 argon news');
    const titleFromMessage = formatChatTitle("let's create instagram posts ideas on gemini 4 argon");

    // Assert
    expect(titleFromSearch).toBe('Gemini 4 Argon');
    expect(titleFromMessage).toBe('Gemini 4 Argon');
  });

  it('contains strict JSON block requirements in system prompt', () => {
    // Assert
    expect(IDEATION_SYSTEM_PROMPT).toContain('MANDATORY STRUCTURED IDEAS');
    expect(IDEATION_SYSTEM_PROMPT).toContain('```json');
  });
});
