import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

/** Sunburst stage showing the mystery Pokémon, a draining round timer and reveal effects. */
@Component({
  selector: 'app-quiz-stage',
  standalone: true,
  templateUrl: './quiz-stage.component.html',
  styleUrl: './quiz-stage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizStageComponent {
  readonly artUrl = input.required<string>();
  /** Small sprite used if the artwork fails to load. */
  readonly fallbackUrl = input.required<string>();
  readonly name = input.required<string>();
  readonly revealed = input(false);
  /** `true` correct, `false` wrong / timed out, `null` not revealed yet. */
  readonly correct = input<boolean | null>(null);
  readonly durationMs = input(10000);

  readonly artFailed = signal(false);
  readonly sparkles = [0, 1, 2, 3, 4, 5, 6, 7];
}
