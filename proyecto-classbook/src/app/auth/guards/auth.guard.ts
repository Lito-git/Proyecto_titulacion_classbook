// Importamos las dependencias necesarias
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {

    const token = sessionStorage.getItem('token');

    // Si no hay token, redirigimos al login
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    // Verificamos que el token no haya expirado decodificando el payload
    // sin necesidad de una librería externa (el payload es base64 estándar)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      // exp está en segundos, Date.now() en milisegundos
      if (payload.exp * 1000 < Date.now()) {
        sessionStorage.clear();
        this.router.navigate(['/login']);
        return false;
      }
    } catch {
      // Token malformado
      sessionStorage.clear();
      this.router.navigate(['/login']);
      return false;
    }

    // Verificamos que el usuario tenga el rol permitido para esta ruta
    const rolUsuario = sessionStorage.getItem('rol');
    const rolesPermitidos = route.data['roles'] as string[];

    if (rolesPermitidos && !rolesPermitidos.includes(rolUsuario || '')) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}