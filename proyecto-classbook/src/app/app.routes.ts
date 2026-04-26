// Importamos las dependencias necesarias
import { Routes } from '@angular/router';
import { AuthGuard } from './auth/guards/auth.guard';

// Definimos las rutas principales de la aplicación
// Cada módulo de rol se carga con lazy loading (loadChildren)
// lo que significa que solo se descarga cuando el usuario navega a esa ruta
export const routes: Routes = [
  // Ruta por defecto redirige al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Módulo de autenticación (login)
  {
    path: 'login',
    loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule)
  },

  // Módulo del estudiante, protegido por AuthGuard con rol 'estudiante'
  {
    path: 'estudiante',
    loadChildren: () => import('./estudiante/estudiante.module').then(m => m.EstudianteModule),
    canActivate: [AuthGuard],
    data: { roles: ['estudiante'] }
  },

  // Módulo del docente, protegido por AuthGuard con rol 'docente'
  {
    path: 'docente',
    loadChildren: () => import('./docente/docente.module').then(m => m.DocenteModule),
    canActivate: [AuthGuard],
    data: { roles: ['docente'] }
  },

  // Módulo del inspector, protegido por AuthGuard con rol 'inspector'
  {
    path: 'inspector',
    loadChildren: () => import('./inspector/inspector.module').then(m => m.InspectorModule),
    canActivate: [AuthGuard],
    data: { roles: ['inspector'] }
  },

  // Módulo del administrador, protegido por AuthGuard con rol 'administrador'
  {
    path: 'administrador',
    loadChildren: () => import('./administrador/administrador.module').then(m => m.AdministradorModule),
    canActivate: [AuthGuard],
    data: { roles: ['administrador'] }
  },

  // Cualquier ruta no definida redirige al login
  { path: '**', redirectTo: 'login' }
];