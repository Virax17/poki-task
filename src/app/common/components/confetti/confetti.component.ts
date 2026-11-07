import { ChangeDetectionStrategy, Component, input } from '@angular/core';

interface Piece {
  left: number;
  delay: number;
  duration: number;
  hue: number;
  size: number;
  spin: number;
}

/** One-shot confetti rain. Re-create the component (e.g. via `@if`) to replay it. */
@Component({
  selector: 'app-confetti',
  standalone: true,
  templateUrl: './confetti.component.html',
  styleUrl: './confetti.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfettiComponent {
  readonly count = input(36);

  /** Random layout generated once per instance. */
  readonly pieces: Piece[] = Array.from({ length: 60 }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 1.8,
    hue: Math.floor(Math.random() * 360),
    size: 6 + Math.random() * 7,
    spin: 180 + Math.random() * 540,
  }));
}
