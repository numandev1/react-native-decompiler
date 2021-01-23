

import CliProgress from 'cli-progress';

export default class ProgressBar {
  private static instance?: ProgressBar;
  private progressBar = new CliProgress.SingleBar({ etaBuffer: 200 }, CliProgress.Presets.shades_classic);
  private static disabled = false;

  static getInstance(): ProgressBar {
    if (!this.instance) {
      this.instance = new ProgressBar();
    }
    return this.instance;
  }

  static disable(): void {
    ProgressBar.disabled = true;
  }

  private constructor() {}

  /**
   * Starts the progress bar and set the total and initial value
   * @param startValue The initial value
   * @param total The max value
   */
  start(startValue: number, total: number): void {
    if (ProgressBar.disabled) return;
    this.progressBar.start(total, startValue);
  }

  /**
   * Increments the progress bar
   * @param amount The amount to increment, default = 1
   */
  increment(amount?: number): void {
    if (ProgressBar.disabled) return;
    this.progressBar.increment(amount);
  }

  /**
   * Stops the progress bar
   */
  stop(): void {
    if (ProgressBar.disabled) return;
    this.progressBar.stop();
  }
}
