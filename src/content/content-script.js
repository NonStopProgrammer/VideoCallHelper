// Master Orchestrator
console.log("AI Video Call Helper: Content Script Loaded");

// Wait for window load to be safe
window.addEventListener('load', () => {
  // 1. Initialize Caption Grabber
  window.captionGrabber.init();

  // 2. Inject Sidebar UI
  window.Sidebar.init();
});