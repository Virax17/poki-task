import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { Pokemon } from '../../../pokedex/models/pokemon.model';
import {
  MAX_TEAM_NAME_LENGTH,
  MAX_TEAM_SIZE,
  MIN_TEAM_NAME_LENGTH,
  MIN_TEAM_SIZE,
} from '../../constants/team.constants';
import { TeamStore } from '../../state/team.store';
import { itemCountValidator } from '../../validators/pokemon-count.validator';
import { uniqueTeamNameValidator } from '../../validators/team-name.validator';
import { PokemonPickerComponent } from '../pokemon-picker/pokemon-picker.component';

@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [ReactiveFormsModule, PokemonPickerComponent],
  templateUrl: './team-form.component.html',
  styleUrl: './team-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamFormComponent {
  private readonly store = inject(TeamStore);

  readonly minNameLength = MIN_TEAM_NAME_LENGTH;
  readonly maxNameLength = MAX_TEAM_NAME_LENGTH;
  readonly maxTeamSize = MAX_TEAM_SIZE;

  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.minLength(MIN_TEAM_NAME_LENGTH),
        Validators.maxLength(MAX_TEAM_NAME_LENGTH),
      ],
      asyncValidators: [
        uniqueTeamNameValidator(() =>
          this.store.snapshot.teams.map((t) => t.name.trim().toLowerCase()),
        ),
      ],
    }),
    pokemon: new FormControl<Pokemon[]>([], {
      nonNullable: true,
      validators: [itemCountValidator(MIN_TEAM_SIZE, MAX_TEAM_SIZE)],
    }),
  });

  readonly isSubmitting = signal(false);
  readonly hasSubmitted = signal(false);

  /** Form status bridged into the template (VALID / INVALID / PENDING). */
  readonly status = toSignal(
    this.form.statusChanges.pipe(map(() => this.form.status)),
    { initialValue: this.form.status },
  );

  get name() {
    return this.form.controls.name;
  }

  get pokemon() {
    return this.form.controls.pokemon;
  }

  /** Show an error only after the field is dirty/touched (or after a submit attempt). */
  showError(control: AbstractControl): boolean {
    return control.invalid && (control.dirty || control.touched || this.hasSubmitted());
  }

  onPicked(pokemon: Pokemon): void {
    this.pokemon.setValue([...this.pokemon.value, pokemon]);
    this.pokemon.markAsDirty();
  }

  onRemoved(id: number): void {
    this.pokemon.setValue(this.pokemon.value.filter((p) => p.id !== id));
    this.pokemon.markAsDirty();
    this.pokemon.markAsTouched();
  }

  onSubmit(): void {
    this.hasSubmitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid || this.form.pending || this.isSubmitting()) return;

    const value = this.form.getRawValue();
    const input = {
      name: value.name.trim(),
      pokemonIds: value.pokemon.map((p) => p.id),
    };

    this.isSubmitting.set(true);
    this.resetForm();

    this.store.create$(input).subscribe({
      next: () => this.isSubmitting.set(false),
      error: () => {
        // The store already rolled back and showed a toast; restore the user's input.
        this.isSubmitting.set(false);
        this.form.setValue(value);
        this.form.markAllAsTouched();
      },
    });
  }

  private resetForm(): void {
    this.form.reset({ name: '', pokemon: [] });
    this.hasSubmitted.set(false);
  }
}
