import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';

// Definimos las rutas principales de la aplicación
// Cada módulo de enrutamiento por rol se carga con lazy loading (loadChildren)
// para que solo se cargue cuando el usuario navega a esa ruta
export const routes: Routes = [
  // Ruta por defecto redirige al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Rutas de autenticación (login y recuperar contraseña)
  {
    path: 'login',
    loadChildren: () => import('./auth/auth-routing.module')
      .then(m => m.AuthRoutingModule)
  },

  // Rutas del estudiante, protegidas por AuthGuard con rol 'estudiante'
  {
    path: 'estudiante',
    loadChildren: () => import('./estudiante/estudiante-routing.module')
      .then(m => m.EstudianteRoutingModule),
    canActivate: [AuthGuard],
    data: { roles: ['estudiante'] }
  },

  // Rutas del docente, protegidas por AuthGuard con rol 'docente'
  {
    path: 'docente',
    loadChildren: () => import('./docente/docente-routing.module')
      .then(m => m.DocenteRoutingModule),
    canActivate: [AuthGuard],
    data: { roles: ['docente'] }
  },

  // Rutas del inspector, protegidas por AuthGuard con rol 'inspector'
  {
    path: 'inspector',
    loadChildren: () => import('./inspector/inspector-routing.module')
      .then(m => m.InspectorRoutingModule),
    canActivate: [AuthGuard],
    data: { roles: ['inspector'] }
  },

  // Rutas del administrador, protegidas por AuthGuard con rol 'administrador'
  {
    path: 'administrador',
    loadChildren: () => import('./administrador/administrador-routing.module')
      .then(m => m.AdministradorRoutingModule),
    canActivate: [AuthGuard],
    data: { roles: ['administrador'] }
  },

  // Cualquier ruta no definida redirige al login
  { path: '**', redirectTo: 'login' }
];