import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  value: T;
}

/** Safe wrapper around localStorage (never throws; ignores quota / private-mode errors). */
@Injectable({ providedIn: 'root' })
export class CacheService {
  /**
   * Reads a value from localStorage.
   * @param key Storage key.
   * @returns The stored value, or `null` when missing or corrupt.
   */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return (JSON.parse(raw) as CacheEntry<T>).value;
    } catch {
      this.remove(key);
      return null;
    }
  }

  /**
   * Writes a value to localStorage.
   * @param key Storage key.
   * @param value JSON-serialisable value.
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify({ value } satisfies CacheEntry<T>));
    } catch {
      // Ignore storage write failures (quota exceeded, private mode, etc.)
    }
  }

  /**
   * Removes a key from localStorage.
   * @param key Storage key.
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }
}
