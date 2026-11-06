import { FormControl } from '@angular/forms';
import { firstValueFrom, isObservable, Observable } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { itemCountValidator } from './pokemon-count.validator';
import { uniqueTeamNameValidator } from './team-name.validator';

async function run(validator: ReturnType<typeof uniqueTeamNameValidator>, value: string) {
  const result = validator(new FormControl(value));
  return firstValueFrom(result as Observable<unknown>);
}

describe('uniqueTeamNameValidator', () => {
  const validator = uniqueTeamNameValidator(() => ['kanto starters'], 0);

  it('flags a name that already exists (case-insensitive, trimmed)', async () => {
    expect(await run(validator, '  KANTO Starters ')).toEqual({ nameTaken: true });
  });

  it('accepts a new name', async () => {
    expect(await run(validator, 'Johto Squad')).toBeNull();
  });

  it('skips the check for an empty value', async () => {
    expect(isObservable(validator(new FormControl('')))).toBe(true);
    expect(await run(validator, '')).toBeNull();
  });
});

describe('itemCountValidator', () => {
  const validator = itemCountValidator(1, 6);

  it('requires at least the minimum and at most the maximum', () => {
    expect(validator(new FormControl([]))?.['minItems']).toBeTruthy();
    expect(validator(new FormControl([1]))).toBeNull();
    expect(validator(new FormControl([1, 2, 3, 4, 5, 6, 7]))?.['maxItems']).toBeTruthy();
  });
});
