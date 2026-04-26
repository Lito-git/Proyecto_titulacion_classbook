// Importamos las dependencias necesarias
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

// Configuración global de la aplicación
// provideRouter registra las rutas definidas en app.routes.ts
// provideHttpClient habilita el servicio HttpClient en toda la app
// para que los servicios puedan hacer peticiones HTTP al backend
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient()
  ]
};