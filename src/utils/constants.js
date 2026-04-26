const CONSTANTS = {
  DEFAULT_PERSONA: "General Assistant",
  DEFAULT_PROMPT: "Help me respond clearly and helpfully to what was just said.",
  DEFAULT_TONE: "Professional",
  DEFAULT_MODEL: "openai/gpt-4o-mini",
  MAX_CONTEXT_CHARS: 2000,
  Events: {
    GENERATE: "GENERATE_RESPONSE",
    SUMMARIZE: "SUMMARIZE_CONTEXT",
    UPDATE_SIDEBAR: "UPDATE_SIDEBAR_UI"
  }
};
if (typeof window !== "undefined") window.CONSTANTS = CONSTANTS;
