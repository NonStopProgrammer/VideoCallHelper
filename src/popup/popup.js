document.addEventListener('DOMContentLoaded', async () => {
  const settings = await StorageUtils.getSettings();

  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('model').value = settings.model;
  document.getElementById('persona').value = settings.persona;
  document.getElementById('prompt').value = settings.prompt;
  document.getElementById('tone').value = settings.tone;

  document.getElementById('saveBtn').addEventListener('click', async () => {
    const newSettings = {
      apiKey: document.getElementById('apiKey').value.trim(),
      model: document.getElementById('model').value.trim() || window.CONSTANTS.DEFAULT_MODEL,
      persona: document.getElementById('persona').value.trim() || window.CONSTANTS.DEFAULT_PERSONA,
      prompt: document.getElementById('prompt').value.trim(),
      tone: document.getElementById('tone').value
    };

    await StorageUtils.saveSettings(newSettings);

    const status = document.getElementById('status');
    status.textContent = "Settings saved!";
    setTimeout(() => status.textContent = "", 2000);
  });
});
