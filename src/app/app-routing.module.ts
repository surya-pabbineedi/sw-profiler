import { HttpClientModule } from '@angular/common/http';
import { inject, NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { UserService } from '../common/services/user.service';

const isAuthenticatedGuard = () => inject(UserService).isAuthenticated$;

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'import'
  },
  {
    path: 'import',
    canActivate: [isAuthenticatedGuard],
    loadComponent: () => import('./pages/import-ssp/import-ssp.component').then(mod => mod.ImportSSPComponent)
  },
  {
    path: 'summary',
    canActivate: [isAuthenticatedGuard],
    loadComponent: () => import('./pages/summary/summary.component').then(mod => mod.SummaryComponent)
  },
  {
    path: 'visualize',
    canActivate: [isAuthenticatedGuard],
    loadComponent: () => import('./pages/visualize/visualize.component').then(mod => mod.VisualizeComponent)
  },
  {
    path: 'visualize-application/:appId',
    canActivate: [isAuthenticatedGuard],
    loadComponent: () => import('./pages/visualize/visualize.component').then(mod => mod.VisualizeComponent)
  }
];

@NgModule({
  imports: [HttpClientModule, RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
