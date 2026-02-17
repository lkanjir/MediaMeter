import { Routes } from '@angular/router';
import { Prijava } from './komponente/prijava/prijava';
import { Registracija } from './komponente/registracija/registracija';
import { UpravljanjeKorisnicima } from './komponente/upravljanje-korisnicima/upravljanje-korisnicima';
import { UpravljanjeKolekcijama } from './komponente/upravljanje-kolekcijama/upravljanje-kolekcijama';
import { Pretrazivanje } from './komponente/pretrazivanje/pretrazivanje';
import { DetaljiFilma } from './komponente/detalji-filma/detalji-filma';
import { Pocetna } from './komponente/pocetna/pocetna';
import { authGuard, ulogaGuard } from './pomocno/guardovi';
import { Sadrzaj } from './komponente/sadrzaj/sadrzaj';
import { MojeKolekcije } from './komponente/moje-kolekcije/moje-kolekcije';

export const routes: Routes = [
  { path: '', redirectTo: 'pocetna', pathMatch: 'full' },
  { path: 'pocetna', component: Pocetna },
  { path: 'prijava', component: Prijava },
  { path: 'registracija', component: Registracija },
  {
    path: 'admin',
    component: UpravljanjeKorisnicima,
    canActivate: [authGuard, ulogaGuard],
    data: { minRazina: 3 },
  },
  {
    path: 'moderator',
    component: UpravljanjeKolekcijama,
    canActivate: [authGuard, ulogaGuard],
    data: { minRazina: 2 },
  },
  { path: 'pretrazivanje', component: Pretrazivanje, canActivate: [authGuard] },
  { path: 'film/:id', component: DetaljiFilma, canActivate: [authGuard] },
  { path: 'moj-sadrzaj', component: Sadrzaj, canActivate: [authGuard] },
  { path: 'kolekcije', component: MojeKolekcije, canActivate: [authGuard] },
  { path: '**', redirectTo: 'pocetna' },
];
