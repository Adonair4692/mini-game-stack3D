export class InputManager {
  constructor(stage, { onAction, onVisibilityChange }) {
    this.stage = stage;
    this.onAction = onAction;
    this.onVisibilityChange = onVisibilityChange;
    this.enabled = true;
    this.lastActionAt = 0;
    this.lockMs = 90;

    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleContextMenu = this.handleContextMenu.bind(this);
    this.handleVisibility = this.handleVisibility.bind(this);

    stage.addEventListener('pointerdown', this.handlePointerDown, { passive: false });
    stage.addEventListener('contextmenu', this.handleContextMenu);
    window.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('visibilitychange', this.handleVisibility);
  }

  canAct() {
    const now = performance.now();
    if (!this.enabled || now - this.lastActionAt < this.lockMs) return false;
    this.lastActionAt = now;
    return true;
  }

  handlePointerDown(event) {
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest?.('button, input, label, .dialog')) return;
    event.preventDefault();
    if (this.canAct()) this.onAction?.('pointer');
  }

  handleKeyDown(event) {
    if (event.repeat) return;
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    if (['button', 'input', 'textarea', 'select', 'a'].includes(activeTag)) return;
    if (event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault();
    if (this.canAct()) this.onAction?.('keyboard');
  }

  handleContextMenu(event) {
    event.preventDefault();
  }

  handleVisibility() {
    this.onVisibilityChange?.(document.hidden);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  dispose() {
    this.stage.removeEventListener('pointerdown', this.handlePointerDown);
    this.stage.removeEventListener('contextmenu', this.handleContextMenu);
    window.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('visibilitychange', this.handleVisibility);
  }
}
