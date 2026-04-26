// Importamos las dependencias necesarias
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {

    // Obtenemos el token guardado en sessionStorage
    const token = sessionStorage.getItem('token');

    // Si no hay token, redirigimos al login
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Obtenemos el rol del usuario guardado en sessionStorage
    const rolUsuario = sessionStorage.getItem('rol');

    // Obtenemos los roles permitidos definidos en la ruta
    const rolesPermitidos = route.data['roles'] as string[];

    // Si la ruta tiene roles definidos y el usuario no tiene el rol correcto
    // lo redirigimos al login
    if (rolesPermitidos && !rolesPermitidos.includes(rolUsuario || '')) {
      this.router.navigate(['/login']);
      return false;
    }

    // Si todo está bien, permitimos el acceso
    return true;
  }
}