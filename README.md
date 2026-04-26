# AI Video Call Helper

A Chrome extension that gives you real-time AI-powered response suggestions during Google Meet and Zoom video calls — for any role or persona.

Works for interviews, technical discussions, sales calls, stakeholder meetings, and more. Press **Alt+A** to get a suggestion without touching your mouse.

---

## How it works

The extension does **not** record audio. It reads the live caption text that Google Meet or Zoom renders on screen, buffers the last 90 seconds of speech, and sends that transcript to an AI model via [OpenRouter](https://openrouter.ai). The AI identifies the most recent question or statement, classifies it (behavioral, technical, situational, etc.), and returns a ready-to-say response.

```
Meeting captions (DOM text)
  → Caption observer detects new text
  → Buffer last 90s of speech
  → Alt+A pressed
  → Transcript sent to OpenRouter API
  → AI generates a persona-aware suggestion
  → Response shown in floating panel
```

**Captions must be enabled inside the meeting** — the extension reads whatever the platform renders, not raw audio.

---

## Installation

This extension is not published to the Chrome Web Store. Install it in developer mode in under a minute.

### Step 1 — Download the extension

Clone or download this repository to your computer.

```
git clone https://github.com/your-username/video-call-helper-app.git
```

Or download the ZIP from GitHub and extract it to a folder you'll remember.

### Step 2 — Open Chrome Extensions

Open Google Chrome and go to:

```
chrome://extensions
```

### Step 3 — Enable Developer Mode

In the top-right corner of the Extensions page, toggle **Developer mode** on.

### Step 4 — Load the extension

Click **Load unpacked** and select the root folder of this project (the folder that contains `manifest.json`).

The extension will appear in your Chrome toolbar as **AI Video Call Helper**.

### Step 5 — Get an OpenRouter API key

1. Go to [openrouter.ai](https://openrouter.ai) and create a free account.
2. Navigate to **Keys** and create a new API key.
3. Copy the key — it starts with `sk-or-`.

---

## Configuration

Click the extension icon in the Chrome toolbar to open the settings popup.

| Field | Description |
|---|---|
| **OpenRouter API Key** | Your `sk-or-...` key from openrouter.ai |
| **AI Model** | The model to use. Type any OpenRouter model ID or pick from the suggestions |
| **Your Persona / Role** | Tells the AI who you are — e.g. `Data Engineer`, `Software Engineer Candidate`, `Product Manager` |
| **Your Goal for This Call** | What you want help with — e.g. `Help me answer technical questions clearly` |
| **Response Tone** | Professional, Direct, Friendly, Consultative, Technical, or Concise |

Click **Save Settings** after making changes.

### Recommended models

| Use case | Model ID |
|---|---|
| Fast and cheap (default) | `openai/gpt-4o-mini` |
| Best quality | `anthropic/claude-3.5-sonnet` |
| Fast + smart | `anthropic/claude-3-haiku` |
| Free tier | `meta-llama/llama-3.1-70b-instruct` |

Any model available on OpenRouter can be used — just paste its model ID.

---

## Using the extension

### Google Meet

1. Join a meeting at [meet.google.com](https://meet.google.com).
2. Enable captions — click the **CC** button in the meeting toolbar (bottom bar).
3. The **⚡ AI** button appears at the bottom-center of your screen.

### Zoom Web Client

1. Join a Zoom meeting by choosing **"Join from your browser"** — do not open the Zoom desktop app. The desktop app is a separate native program that Chrome extensions cannot access.
2. Inside the meeting, enable captions — click **Live Transcript** or **CC** in the Zoom toolbar.
3. The **⚡ AI** button appears at the bottom-center of your screen.

> Zoom link tip: If clicking a Zoom link auto-launches the desktop app, copy the meeting URL, open a new Chrome tab, paste it, and choose "Join from your browser" on the page that loads.

### Getting a suggestion

| Action | What happens |
|---|---|
| Press **Alt+A** | Opens the panel (if hidden) and immediately generates a suggestion |
| Click **⚡ AI** button | Opens / closes the panel |
| Click **⚡ Generate Answer** | Generates a suggestion from the panel |
| Hover a response → **Copy** | Copies the full response text to clipboard |
| Click **🗑** | Clears the response history |
| Click **−** | Minimizes the panel |
| Drag the **⚡ AI** button | Repositions the button anywhere on screen |
| Drag the **panel header** | Repositions the panel independently |

### How the AI responds

The AI automatically detects the type of question and formats its response accordingly:

| Question type | Example | AI format |
|---|---|---|
| Behavioral | "Tell me about a time you handled a conflict" | STAR method (Situation, Task, Action, Result) |
| Technical | "How does your ETL handle schema changes?" | Direct answer with concrete detail |
| Situational | "What would you do if the pipeline fails?" | Step-by-step approach |
| Opinion | "What's your view on microservices?" | Clear stance + reasoning |
| Introduction | "Tell me about yourself" | Confident professional intro |
| Small talk | "How are you doing?" | Natural, brief reply |

Responses are written in **first person** — ready to say out loud without rephrasing.

---

## Interview tips

- Set **Persona** to your role and level — e.g. `Senior Data Engineer candidate`. The AI will match the depth of its answers to that level.
- Set **Goal** to `Help me answer interview questions confidently and concisely`.
- Set **Tone** to `Professional` or `Direct`.
- Press **Alt+A** within a few seconds of the interviewer finishing their question — the most recent speech is always at the bottom of the transcript buffer.
- Use **Copy** to paste a response into a notes doc alongside the call if you want to review it later.

---

## Troubleshooting

**The ⚡ AI button doesn't appear**
- Make sure the extension is loaded and enabled at `chrome://extensions`.
- Refresh the meeting tab after loading or updating the extension.
- For Zoom: confirm you are using the web client (`app.zoom.us/wc/...`), not the desktop app.

**"Can't read captions yet"**
- Enable captions inside the meeting (CC or Live Transcript button).
- Wait for someone to speak — the extension needs at least one caption line before it can help.

**"OpenRouter Error" or "No API key found"**
- Open the extension popup and check that your API key is saved.
- Confirm the key is valid at [openrouter.ai/keys](https://openrouter.ai/keys).
- Make sure your OpenRouter account has credits or a free-tier model selected.

**Zoom captions not detected**
- Zoom's web client uses React and its class names can change after a platform update. If captions are visible on screen but the extension can't find them, open an issue with the class name of the caption element (right-click the caption text → Inspect).

**Response is cut off or too short**
- Try a more capable model such as `anthropic/claude-3.5-sonnet`.
- For long technical questions, click **Alt+A** while the question is still fresh — the buffer holds the last 90 seconds.

---

## Project structure

```
video-call-helper-app/
├── manifest.json                   # Extension config (permissions, URLs, scripts)
├── assets/                         # Extension icons
└── src/
    ├── background/
    │   └── background.js           # Service worker — calls OpenRouter API
    ├── content/
    │   ├── content-script.js       # Orchestrator — initialises captions + sidebar
    │   ├── meet-captions.js        # Google Meet caption observer
    │   ├── zoom-captions.js        # Zoom web client caption observer
    │   ├── sidebar.js              # Floating panel logic
    │   ├── sidebar.html            # Floating panel markup
    │   └── sidebar.css             # Floating panel styles
    ├── popup/
    │   ├── popup.html              # Settings popup
    │   ├── popup.js                # Settings save/load
    │   └── popup.css               # Settings popup styles
    └── utils/
        ├── constants.js            # Shared defaults
        └── storage.js              # Chrome storage wrapper
```

---

## Supported platforms

| Platform | Supported | Notes |
|---|---|---|
| Google Meet | Yes | Enable CC in meeting toolbar |
| Zoom Web Client | Yes | Join via browser, not desktop app; enable Live Transcript |
| Zoom Desktop App | No | Native apps are outside Chrome's reach |
| Microsoft Teams | No | Not yet implemented |

---

## Privacy

- No audio is recorded or transmitted.
- Caption text (the last 90 seconds of spoken words) is sent to OpenRouter to generate a response. It is not stored by this extension.
- Your API key is stored locally in Chrome's extension storage on your device only.
- Review [OpenRouter's privacy policy](https://openrouter.ai/privacy) for how they handle API requests.
