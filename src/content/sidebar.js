/* src/content/sidebar.js */

const WIDGET_W  = 460;
const WIDGET_H  = 480;
const BTN_H     = 40;
const BTN_GAP   = 12; // gap between button top and widget bottom

const Sidebar = {
  async init() {
    const url      = chrome.runtime.getURL('src/content/sidebar.html');
    const response = await fetch(url);
    const html     = await response.text();
    document.body.insertAdjacentHTML('beforeend', html);

    // Show the persona name in the header
    const { persona } = await chrome.storage.local.get("persona");
    if (persona) {
      const titleEl = document.getElementById('sc-title');
      if (titleEl) titleEl.textContent = persona;
    }

    // Position launcher at center-bottom using explicit pixels so drag works
    const launcher = document.getElementById('sc-launcher');
    launcher.style.left   = `${Math.round((window.innerWidth - 120) / 2)}px`;
    launcher.style.bottom = '24px';

    this.attachListeners();
    this.makeDraggable();
    this.attachKeyboardShortcut();
  },

  // ── Drag ─────────────────────────────────────────────────────────────────
  // The header is the drag handle. We track hasMoved separately from the
  // launcher click handler so a real drag never also opens/closes the widget.
  makeDraggable() {
    const launcher = document.getElementById('sc-launcher');
    const header   = document.querySelector('.sc-header');
    const widget   = document.getElementById('sc-widget');

    let isDragging  = false;
    let dragTarget  = null; // 'launcher' | 'widget'
    let startX, startY;
    let initLauncherLeft, initLauncherTop;
    let initWidgetLeft,   initWidgetTop;
    this._launcherMoved = false; // read in click handler

    // Helper: resolve current pixel position of an element (handles bottom/right offsets)
    const getPos = (el) => {
      const rect = el.getBoundingClientRect();
      return { left: rect.left, top: rect.top };
    };

    const onDown = (e, target) => {
      isDragging  = true;
      dragTarget  = target;
      this._launcherMoved = false;
      startX = e.clientX;
      startY = e.clientY;

      const lPos = getPos(launcher);
      initLauncherLeft = lPos.left;
      initLauncherTop  = window.innerHeight - launcher.getBoundingClientRect().bottom + parseInt(launcher.style.bottom || 24);

      if (widget.classList.contains('visible')) {
        const wPos = getPos(widget);
        initWidgetLeft = wPos.left;
        initWidgetTop  = wPos.top;
      }

      e.preventDefault();
    };

    launcher.addEventListener('mousedown', (e) => onDown(e, 'launcher'));
    header.addEventListener('mousedown',   (e) => onDown(e, 'widget'));

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) this._launcherMoved = true;

      // Move the launcher
      const newLauncherLeft = initLauncherLeft + dx;
      const rect = launcher.getBoundingClientRect();
      const currentBottom = parseFloat(launcher.style.bottom) || 24;
      const newLauncherTop = initLauncherTop - dy; // bottom is inverted

      launcher.style.left   = `${newLauncherLeft}px`;
      launcher.style.bottom = `${newLauncherTop}px`;
      launcher.style.right  = 'auto';

      // Move the widget alongside
      if (widget.classList.contains('visible')) {
        widget.style.left   = `${initWidgetLeft + dx}px`;
        widget.style.top    = `${initWidgetTop  + dy}px`;
        widget.style.bottom = 'auto';
        widget.style.right  = 'auto';
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });
  },

  // ── Widget open/close ─────────────────────────────────────────────────────
  _openWidget() {
    const launcher = document.getElementById('sc-launcher');
    const widget   = document.getElementById('sc-widget');

    // Position widget centered horizontally, sitting just above the launcher
    const lRect  = launcher.getBoundingClientRect();
    let left = lRect.left + lRect.width / 2 - WIDGET_W / 2;
    let top  = lRect.top - WIDGET_H - BTN_GAP;

    // Clamp to viewport
    left = Math.max(8, Math.min(left, window.innerWidth  - WIDGET_W - 8));
    top  = Math.max(8, Math.min(top,  window.innerHeight - WIDGET_H - 8));

    widget.style.left   = `${left}px`;
    widget.style.top    = `${top}px`;
    widget.style.bottom = 'auto';
    widget.style.right  = 'auto';
    widget.classList.add('visible');
  },

  _closeWidget() {
    document.getElementById('sc-widget').classList.remove('visible');
  },

  _toggleWidget() {
    const widget = document.getElementById('sc-widget');
    if (widget.classList.contains('visible')) {
      this._closeWidget();
    } else {
      this._openWidget();
    }
  },

  // ── Event Listeners ───────────────────────────────────────────────────────
  attachListeners() {
    const launcher   = document.getElementById('sc-launcher');
    const closeBtn   = document.getElementById('sc-close');
    const clearBtn   = document.getElementById('sc-clear');
    const triggerBtn = document.getElementById('sc-trigger-btn');
    const historyDiv = document.getElementById('sc-history');

    // Launcher click — ignore if the user was dragging
    launcher.addEventListener('click', () => {
      if (this._launcherMoved) {
        this._launcherMoved = false;
        return;
      }
      this._toggleWidget();
    });

    closeBtn.addEventListener('click', () => this._closeWidget());

    clearBtn.addEventListener('click', () => {
      historyDiv.innerHTML = '<div class="sc-placeholder">History cleared.</div>';
    });

    triggerBtn.addEventListener('click', () => this._generate(triggerBtn));
  },

  // ── Alt+A keyboard shortcut ───────────────────────────────────────────────
  attachKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        const widget = document.getElementById('sc-widget');
        if (!widget.classList.contains('visible')) this._openWidget();
        this._generate(document.getElementById('sc-trigger-btn'));
      }
    });
  },

  // ── Generate Answer ───────────────────────────────────────────────────────
  _generate(triggerBtn) {
    const captions = window.captionGrabber.getRecentCaptions();

    if (!captions || captions.trim().length < 2) {
      this.addMessage("Can't read captions yet — make sure captions are enabled in the meeting and someone has spoken.", "error");
      return;
    }

    triggerBtn.disabled    = true;
    triggerBtn.textContent = "Thinking…";

    chrome.runtime.sendMessage(
      { action: "GENERATE_RESPONSE", payload: { recentCaptions: captions } },
      (response) => {
        triggerBtn.disabled    = false;
        triggerBtn.innerHTML   = '⚡ Generate Answer <span class="sc-hotkey">Alt+A</span>';

        if (chrome.runtime.lastError) {
          this.addMessage("Extension error — try refreshing the page.", "error");
          return;
        }

        if (response.error) {
          this.addMessage(response.error, "error");
        } else {
          this.addMessage(response.text);
        }
      }
    );
  },

  // ── Add Message ───────────────────────────────────────────────────────────
  addMessage(text, type = "normal") {
    const historyDiv  = document.getElementById('sc-history');
    const placeholder = historyDiv.querySelector('.sc-placeholder');
    if (placeholder) placeholder.remove();

    const div       = document.createElement('div');
    div.className   = `sc-msg ${type}`;
    div.textContent = text;

    // Copy button (only on normal AI responses)
    if (type === "normal") {
      const copyBtn       = document.createElement('button');
      copyBtn.className   = 'sc-copy-btn';
      copyBtn.textContent = 'Copy';
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'Copied!';
          copyBtn.classList.add('copied');
          setTimeout(() => {
            copyBtn.textContent = 'Copy';
            copyBtn.classList.remove('copied');
          }, 1500);
        });
      });
      div.appendChild(copyBtn);
    }

    // Newest response at the top (column-reverse makes it appear at bottom visually)
    historyDiv.prepend(div);
  }
};

window.Sidebar = Sidebar;
