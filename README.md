# Mini Pokédex

A single-page Angular 21 app to browse Pokémon (PokéAPI GraphQL) and build teams (local mock GraphQL server).
Built to the conventions in `DEVELOPER_GUIDE.md` and the "Mini Pokédex" assessment brief.

## Setup

Requirements: Node 20+ and npm.

```bash
npm install
```

Run the **mock server** (teams: queries + mutations) in one terminal:

```bash
npm run mock        # json-graphql-server db.js --port 4000
```

Run the app in another terminal:

```bash
npm start           # ng serve  ->  http://localhost:4200
```

Other scripts:

```bash
npm test -- --watch=false   # unit tests (Vitest via Angular builder)
npm run build               # production build
```

> Pokémon data comes from `https://graphql.pokeapi.co/v1beta2` (no auth), the maintained successor of the brief's
> `beta.pokeapi.co/graphql/v1beta`, which was unreachable while building. Same data and operations; the only difference is
> that field names drop the `pokemon_v2_` prefix. To use the original, change `POKEAPI_GRAPHQL_URL` in
> `src/app/common/constants/constants.ts` and restore the prefixed field names in `pokemon-api.service.ts`. Teams need the mock server on port 4000;
> without it the Teams page shows its error state with a Retry button.

## Architecture

```
src/app/
  game/          "Who's that Pokémon?" quiz mini-game (page, constants, models, utils)
  battle/        turn-based battle game (engine util, constants, models, fighter component, page)
  common/        shared UI (skeleton, state-message, pagination, type-badge, toasts), utils, constants, cache service
  core/          GraphqlClientService, LoggerService, ToastService
  pokedex/       models/ constants/ services/ state/ utils/ components/ + pokedex.component (page)
  teams/         models/ constants/ services/ state/ utils/ validators/ components/ + teams.component (page)
```

- **GraphQL**: `GraphqlClientService` posts operations and converts every failure into a user-friendly `ApiError`
  (raw HTTP/GraphQL details are only logged). PokéAPI calls use `retryWithDelay()` (3 retries, 1s/2s/3s).
- **State (RxJS, no NgRx)**: `PokemonStore` and `TeamStore` hold a `BehaviorSubject` of state and expose derived
  streams through selector functions (`map` + `distinctUntilChanged` + `combineLatest`, `shareReplay(1)` on view models).
  - Pokémon search: `debounceTime(300) → distinctUntilChanged → switchMap` to the API.
  - Fetched Pokémon are cached by id and reused by the table, team picker and team summary.
  - Teams: create/delete are **optimistic**. The new team appears instantly (flagged *pending*), is swapped for the
    server copy on success, and is removed (with an error toast) on failure. Delete restores the item at its old index.
- **Signals**: UI state (`selectedPokemon`, `isPanelOpen`, `selectedTeamId`, form flags) uses `signal()`;
  `computed()` for derived values (team type distribution / total base stats, skeleton row count, pagination ranges);
  `toSignal()` bridges store selectors into templates; `effect()` persists the selected team to `localStorage`.
  Components are standalone, `OnPush`, use `inject()`, `input()` and `output()`.
- **UI states**: every async view (table, detail abilities, team list, team summary, typeahead dropdown) renders
  loading (skeleton, sized to avoid layout jumps), empty, error (message + Retry) and success.
- **Quiz** (`/game`): "Who's that Pokémon?" — guess the silhouette from four names over 10 rounds (keys 1–4 to answer, N for next).
  Reuses the cached Pokémon list via `PokemonStore.pool$`, has the same loading / error / empty states, scores streak bonuses
  and keeps the best score in `localStorage`. Round generation is a pure, unit-tested util (`round-builder.util.ts`).
- **Battle** (`/battle`): turn-based 1v1. Pick one of 8 random fighters, face a similarly-strong random opponent and trade
  Quick Attack / Strike / Blast / Guard (keys 1–4). The rules live in a pure, unit-tested engine (`battle-engine.util.ts`):
  18-type effectiveness chart, speed order (Guard has priority), accuracy, crits and damage from the real base stats. The page replays
  the resulting turn events with animations (lunge, hit flash, floating numbers, HP bars). Win streak is tracked, best streak persisted.
- **Theme**: light theme driven by CSS custom properties in `src/styles.scss`.
- **Cards view** (default) / **Table view**: the Pokédex can be shown as an animated card grid (staggered entry, floating artwork,
  stat bars that fill in, a total-power progress ring, a "Discovered N / 1025" progress bar) or as the sortable table. The choice is
  remembered in `localStorage`. Cards have a sort dropdown + direction toggle; both views share the same store, filters, pagination and states.
- **Detail panel**: slide-in panel with an ECharts radar chart that animates between Pokémon.
- **Forms**: reactive team form with required / 3–30 chars / debounced async unique-name validator, chips for 1–6 Pokémon,
  errors only after a field is dirty/touched (or after a submit attempt).

### Notes / decisions

- The Pokédex loads Pokémon in chunks of 150 (`Load more` button) because sorting by a stat needs the data client-side;
  pagination (10 / 25 / 50) is client-side over everything loaded so far. Form variants (id ≥ 10000) are excluded.
- The mock backend has no auth, so every new team belongs to trainer `1` (Ash).
- `ngx-echarts` was skipped (peer-dependency conflict with Angular 21); ECharts is used directly in `StatRadarChartComponent`.

## Tests

`npm test -- --watch=false` runs unit tests covering: optimistic create success, rollback on failure and delete restore
(`team.store.spec.ts`), pokedex selectors incl. filter/sort/paging/status (`pokemon.selectors.spec.ts`),
form validators (`team-name.validator.spec.ts`) and team stats computations (`team-stats.util.spec.ts`).

## What I'd improve with more time

- Component tests (table, picker, form) and an e2e pass that throttles / cuts the network.
- Server-side sorting and filtering (or virtual scroll) instead of loading chunks and sorting on the client.
- Keyboard navigation (arrow keys / Enter) for the typeahead listbox and focus trapping in the detail panel.
- commitlint + husky hooks to enforce the Conventional Commits format automatically.
- Persist teams per trainer and add edit support.
