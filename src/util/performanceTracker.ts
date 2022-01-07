/**
  React Native Decompiler
  Copyright (C) 2020-2022 Richard Fu, Numan and contributors
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.
  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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
