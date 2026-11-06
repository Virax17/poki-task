import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { POKEMON_TYPES } from '../../constants/pokedex.constants';

@Component({
  selector: 'app-pokemon-filters',
  standalone: true,
  templateUrl: './pokemon-filters.component.html',
  styleUrl: './pokemon-filters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokemonFiltersComponent {
  readonly typeFilter = input<string | null>(null);

  readonly searchChange = output<string>();
  readonly typeChange = output<string | null>();

  readonly types = POKEMON_TYPES;
  readonly text = signal('');

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.text.set(value);
    this.searchChange.emit(value);
  }

  clearSearch(): void {
    this.text.set('');
    this.searchChange.emit('');
  }

  onTypeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.typeChange.emit(value || null);
  }
}
