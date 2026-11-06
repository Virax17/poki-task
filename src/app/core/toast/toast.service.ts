import { Injectable, signal } from '@angular/core';
import { TOAST_DURATION_MS } from '../../common/constants/constants';

export type ToastKind = 'success' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

/** Global, signal-based toast notifications. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private nextId = 1;

  /**
   * Shows a success toast.
   * @param message Text to display.
   */
  success(message: string): void {
    this.show('success', message);
  }

  /**
   * Shows an error toast.
   * @param message Text to display.
   */
  error(message: string): void {
    this.show('error', message);
  }

  /**
   * Removes a toast immediately.
   * @param id Toast identifier.
   */
  dismiss(id: number): void {
    this.toasts.set(this.toasts().filter((toast) => toast.id !== id));
  }

  private show(kind: ToastKind, message: string): void {
    const id = this.nextId++;
    this.toasts.set([...this.toasts(), { id, kind, message }]);
    setTimeout(() => this.dismiss(id), TOAST_DURATION_MS);
  }
}
