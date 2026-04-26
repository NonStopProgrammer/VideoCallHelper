const StorageUtils = {
  async getSettings() {
    const result = await chrome.storage.local.get(["apiKey", "model", "persona", "prompt", "tone"]);
    return {
      apiKey: result.apiKey || "",
      model: result.model || window.CONSTANTS.DEFAULT_MODEL,
      persona: result.persona || window.CONSTANTS.DEFAULT_PERSONA,
      prompt: result.prompt || window.CONSTANTS.DEFAULT_PROMPT,
      tone: result.tone || window.CONSTANTS.DEFAULT_TONE
    };
  },

  async saveSettings(settings) {
    await chrome.storage.local.set(settings);
  }
};
if (typeof window !== "undefined") window.StorageUtils = StorageUtils;
