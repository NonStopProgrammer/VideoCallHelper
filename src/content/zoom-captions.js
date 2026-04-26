/* src/content/zoom-captions.js
 *
 * Zoom Web Client caption grabber.
 * Exposes the same window.captionGrabber interface as meet-captions.js.
 *
 * IMPORTANT: Zoom's web client (app.zoom.us/wc/) must be used — the desktop
 * Zoom app is a native process that Chrome extensions cannot access.
 *
 * Captions must be enabled inside the meeting:
 *   Zoom toolbar → "CC" (Closed Captions) or "Live Transcript" button.
 *
 * Zoom uses React with hashed class names that can change on deploys.
 * We try several known selectors then fall back to position-based scanning.
 */

class ZoomCaptionGrabber {
  constructor() {
    this.buffer      = [];
    this.isListening = false;
    this.observer    = null;
    this.captionNode = null;
    this.pollId      = null;
  }

  init() {
    console.log("AI Helper: Initializing Zoom Caption Grabber...");
    this.findCaptionContainer();
  }

  findCaptionContainer() {
    // Ordered from most-specific to least-specific.
    // Zoom ships hashed React class names so we mix exact + wildcard attribute selectors.
    const selectors = [
      // Live Transcript panel (side panel, richer text)
      '[class*="live-transcription-subtitle__text"]',
      '[class*="live-transcription-message__text"]',
      '[class*="live-transcription-message__content"]',
      '[class*="liveTranscription"]',
      '[class*="live-transcription"]',
      // Closed Captions overlay (bottom of video)
      '[class*="caption-text"]',
      '[class*="video-caption"]',
      '[class*="meeting-subtitle"]',
      '[class*="subtitle-text"]',
      '[class*="caption"]',
      // Generic fallbacks
      '[aria-live="polite"]',
      '[aria-live="assertive"]'
    ];

    let attempts = 0;
    const maxAttempts = 60; // 2 min max wait

    this.pollId = setInterval(() => {
      attempts++;
      let foundNode = null;

      // 1. Selector search
      for (const selector of selectors) {
        try {
          const el = document.querySelector(selector);
          if (el) {
            foundNode = el;
            console.log(`AI Helper: Zoom captions found via selector: ${selector}`);
            break;
          }
        } catch (_) { /* invalid selector — skip */ }
      }

      // 2. Position-based fallback (captions always appear in the lower half)
      if (!foundNode) {
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
          const text = div.innerText || div.textContent || "";
          if (text.trim().length < 3) continue;
          const rect = div.getBoundingClientRect();
          if (
            rect.bottom > window.innerHeight * 0.5 &&
            rect.width   > 200 &&
            rect.height  < 250 &&
            (div.getAttribute('aria-live') ||
             div.className.toLowerCase().includes('caption') ||
             div.className.toLowerCase().includes('transcript') ||
             div.className.toLowerCase().includes('subtitle'))
          ) {
            foundNode = div;
            console.log("AI Helper: Zoom captions found via position scan.");
            break;
          }
        }
      }

      if (foundNode) {
        clearInterval(this.pollId);
        this.captionNode = foundNode;
        this.startObserving(foundNode);
      } else if (attempts >= maxAttempts) {
        clearInterval(this.pollId);
        console.warn("AI Helper: Could not find Zoom captions. Enable 'Live Transcript' or 'CC' inside the meeting.");
      }
    }, 2000);
  }

  startObserving(targetNode) {
    console.log("AI Helper: Zoom — locked onto captions. Listening...");
    this.isListening = true;

    // Also observe the parent one level up to catch Zoom's React re-renders
    const observeTarget = targetNode.parentElement || targetNode;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach((node) => {
            const text = node.innerText || node.textContent;
            if (text) this.processText(text);
          });
        } else if (mutation.type === 'characterData') {
          this.processText(mutation.target.textContent);
        } else if (mutation.type === 'childList' && mutation.target) {
          // Catch full React sub-tree replacements
          const text = mutation.target.innerText || mutation.target.textContent;
          if (text) this.processText(text);
        }
      });
    });

    this.observer.observe(observeTarget, {
      childList:     true,
      subtree:       true,
      characterData: true
    });
  }

  processText(rawText) {
    if (!rawText) return;
    const text = rawText.trim();
    if (text.length < 2) return;

    if (this.buffer.length > 0) {
      const last = this.buffer[this.buffer.length - 1];

      // Rolling update: "Hello" → "Hello World" — replace in place
      if (text.startsWith(last.text) || text.includes(last.text)) {
        last.text = text;
        last.time = Date.now();
        return;
      }
      // Correction: old text supersedes new — ignore
      if (last.text.includes(text)) return;
      // Exact duplicate
      if (last.text === text) return;
    }

    console.log("Zoom caption:", text);
    this.buffer.push({ text, time: Date.now() });
    if (this.buffer.length > 25) this.buffer.shift();
  }

  getRecentCaptions() {
    const cutoff = Date.now() - 90_000;
    return this.buffer
      .filter(item => item.time >= cutoff)
      .map(item => item.text)
      .join("\n");
  }
}

window.captionGrabber = new ZoomCaptionGrabber();
