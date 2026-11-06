import { Routes } from '@angular/router';

export const battleRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./battle.component').then((m) => m.BattlePage),
  },
];
