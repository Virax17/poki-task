import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'pokedex',
    loadChildren: () => import('./pokedex/pokedex.routes').then((m) => m.pokedexRoutes),
  },
  {
    path: 'teams',
    loadChildren: () => import('./teams/teams.routes').then((m) => m.teamsRoutes),
  },
  {
    path: 'game',
    loadChildren: () => import('./game/game.routes').then((m) => m.gameRoutes),
  },
  {
    path: 'battle',
    loadChildren: () => import('./battle/battle.routes').then((m) => m.battleRoutes),
  },
  { path: '', redirectTo: 'pokedex', pathMatch: 'full' },
  { path: '**', redirectTo: 'pokedex' },
];
