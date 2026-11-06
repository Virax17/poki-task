import { Injectable } from '@angular/core';

/** Thin console wrapper so logging can be swapped or silenced in one place. */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  /**
   * Logs an error with optional structured context.
   * @param message Human-readable description.
   * @param context Extra data for debugging.
   */
  error(message: string, context?: unknown): void {
    console.error(`[app] ${message}`, context ?? '');
  }
}
