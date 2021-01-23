

import crypto from 'crypto';
import { performance } from 'perf_hooks';

export default class PerformanceTracker {
  private static performanceTimes: Record<string, number | undefined> = {};
  private static enabled = false;

  static isEnabled(): boolean {
    return this.enabled;
  }

  static enable(): void {
    this.enabled = true;
  }

  protected tag: string = crypto.randomBytes(20).toString('hex');

  protected startTimer(tag = this.tag): void {
    if (!PerformanceTracker.enabled) return;
    PerformanceTracker.performanceTimes[tag] = performance.now();
  }

  protected pauseTimer(tag = this.tag): void {
    if (!PerformanceTracker.enabled) return;

    PerformanceTracker.performanceTimes[tag] = this.stopTimer();
  }

  protected unpauseTimer(tag = this.tag): void {
    if (!PerformanceTracker.enabled) return;
    const elapsedTime = PerformanceTracker.performanceTimes[tag];
    if (!elapsedTime) throw new Error('Timer not paused');

    PerformanceTracker.performanceTimes[tag] = performance.now() - elapsedTime;
  }

  protected stopTimer(tag = this.tag): number {
    if (!PerformanceTracker.enabled) return 0;
    const startTime = PerformanceTracker.performanceTimes[tag];
    if (!startTime) throw new Error('Timer not started');

    const totalTime = performance.now() - startTime;
    PerformanceTracker.performanceTimes[tag] = undefined;

    return totalTime;
  }

  protected stopAndPrintTime(tag = this.tag): void {
    if (!PerformanceTracker.enabled) return;
    console.log(`[${tag}] Took ${this.stopTimer(tag)}ms`);
  }
}
