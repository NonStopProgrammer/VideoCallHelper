/* src/background/background.js */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GENERATE_RESPONSE") {
    handleGenerateResponse(request.payload, sendResponse);
    return true; // Keep channel open for async response
  }
});

async function handleGenerateResponse(payload, sendResponse) {
  const { apiKey, model, persona, prompt, tone } = await chrome.storage.local.get([
    "apiKey", "model", "persona", "prompt", "tone"
  ]);

  if (!apiKey) {
    sendResponse({ error: "No API key found. Open the extension settings and add your OpenRouter API key." });
    return;
  }

  const resolvedModel   = model   || "openai/gpt-4o-mini";
  const resolvedPersona = persona || "Professional";
  const resolvedGoal    = prompt  || "Help me respond clearly and helpfully.";
  const resolvedTone    = tone    || "Professional";

  // ─── System Prompt ───────────────────────────────────────────────────────────
  // The AI reads the live transcript, identifies the most recent question or
  // statement, classifies its type, then generates a ready-to-say response.
  // Classification covers interviews, technical discussions, sales, and casual talk.
  const systemPrompt = `
You are a real-time conversation coach assisting a ${resolvedPersona} during a live video call.

USER CONTEXT: "${resolvedGoal}"
RESPONSE TONE: ${resolvedTone}

════════════════════════════════
LIVE TRANSCRIPT  (oldest → newest, most recent at the BOTTOM)
════════════════════════════════
${payload.recentCaptions}
════════════════════════════════

YOUR TASK — follow these steps exactly:

STEP 1 — IDENTIFY
  Look at the LAST 1–3 lines of the transcript.
  Find the most recent question or statement directed at the user.
  Ignore filler words, stutters, and repeated phrases.

STEP 2 — CLASSIFY the type of question/statement:

  [BEHAVIORAL]   "Tell me about a time…", "Describe a situation…", "How did you handle…"
  [TECHNICAL]    Questions about tools, systems, code, data, architecture, processes
  [SITUATIONAL]  "What would you do if…", "How would you approach…"
  [OPINION]      "What do you think about…", "What's your view on…"
  [INTRO]        "Tell me about yourself", "Walk me through your background"
  [SMALL TALK]   Greetings, casual conversation, pleasantries
  [OTHER]        Anything that doesn't fit the above

STEP 3 — GENERATE a ready-to-say response using the right format:

  [BEHAVIORAL]   Use STAR structure — Situation (1 sentence), Task (1 sentence),
                 Action (1–2 sentences), Result (1 sentence). Total: 4–5 sentences.

  [TECHNICAL]    Give a direct, accurate answer. Use concrete examples or numbers
                 if helpful. 2–4 sentences.

  [SITUATIONAL]  Outline your approach step-by-step. 3–4 sentences.

  [OPINION]      State a clear position with one supporting reason. 2–3 sentences.

  [INTRO]        A confident professional introduction: current role, key strengths,
                 relevant experience, what you bring. 3–5 sentences.

  [SMALL TALK]   A warm, natural 1–2 sentence reply.

  [OTHER]        A clear, helpful 2–3 sentence response.

RULES:
- Write in FIRST PERSON — as if the user is saying the words.
- Do NOT prefix with labels like "[BEHAVIORAL]:" in your output.
- Do NOT say "Here is a response:" or any meta-commentary.
- Do NOT say "Waiting for conversation" — if any text exists, be helpful.
- Keep it natural — avoid sounding like a scripted essay.
- Match the persona: a ${resolvedPersona} speaks with domain-specific confidence.
  `.trim();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://github.com/video-call-helper",
        "X-Title": "AI Video Call Helper"
      },
      body: JSON.stringify({
        model: resolvedModel,
        messages: [{ role: "system", content: systemPrompt }]
      })
    });

    const data = await response.json();

    if (data.error) {
      sendResponse({ error: "OpenRouter Error: " + data.error.message });
    } else {
      sendResponse({ text: data.choices[0].message.content });
    }
  } catch (err) {
    sendResponse({ error: "Network Error: Could not reach OpenRouter." });
  }
}
