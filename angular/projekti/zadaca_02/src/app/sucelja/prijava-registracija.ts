import { FormControl } from '@angular/forms';

export interface PrijavaForma {
  korime: FormControl<string>;
  lozinka: FormControl<string>;
}

export interface IPrijava {
  korime: string;
  lozinka: string;
}

export interface RegistracijaForma {
  korime: FormControl<string>;
  email: FormControl<string>;
  lozinka: FormControl<string>;
  ime: FormControl<string | null>;
  prezime: FormControl<string | null>;
  nadimak: FormControl<string | null>;
  spol: FormControl<string | null>;
  datRod: FormControl<string | null>;
  adresa: FormControl<string | null>;
  oMeni: FormControl<string | null>;
}

export interface IRegistracija {
  korime: string;
  email: string;
  lozinka: string;
  ime?: string | null;
  prezime?: string | null;
  nadimak?: string | null;
  spol?: string | null;
  datRod?: string | null;
  adresa?: string | null;
  omeni?: string | null;
}
