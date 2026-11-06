import { Routes } from '@angular/router';

export const gameRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./game.component').then((m) => m.GamePage),
  },
];
