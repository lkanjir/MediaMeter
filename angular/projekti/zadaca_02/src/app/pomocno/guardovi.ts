import { inject } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthStanjeServis } from '../servisi/auth-stanje-servis';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthStanjeServis);
  const router = inject(Router);

  await auth.osvjezi();
  const prijavljen = auth.sesija()?.prijavljen ?? false;
  return prijavljen ? true : router.createUrlTree(['/pocetna']);
};

export const ulogaGuard: CanActivateFn = async (
  ruta: ActivatedRouteSnapshot
) => {
  const auth = inject(AuthStanjeServis);
  const router = inject(Router);

  await auth.osvjezi();
  const minRazina = ruta.data?.['minRazina'] as number | null;
  if (!minRazina) return true;

  const razina = auth.sesija()?.razinaPrava ?? 0;
  return razina >= minRazina ? true : router.createUrlTree(['/pocetna']);
};
