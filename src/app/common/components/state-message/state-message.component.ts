import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Shared "empty" / "error" message block.
 * Error variant exposes a Retry button via the `retry` output.
 */
@Component({
  selector: 'app-state-message',
  standalone: true,
  templateUrl: './state-message.component.html',
  styleUrl: './state-message.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateMessageComponent {
  readonly kind = input<'empty' | 'error'>('empty');
  readonly title = input<string>('');
  readonly message = input<string>('');
  readonly retry = output<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
