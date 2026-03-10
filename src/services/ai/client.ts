import Anthropic from "@anthropic-ai/sdk";

export const DEFAULT_MODEL = "claude-sonnet-4-6";

let _client: Anthropic | null = null;

function createClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

// Export as null if key is not configured — consumers must check before use
export const anthropic: Anthropic | null = createClient();
