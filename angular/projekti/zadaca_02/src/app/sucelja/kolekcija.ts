import { FormControl } from '@angular/forms';

export interface KolekcijaForma {
  naziv: FormControl<string>;
  javna: FormControl<boolean>;
  opis: FormControl<string | null>;
  slika: FormControl<File | null>;
}

export interface IKolekcija {
  id: number;
  naziv: string;
  javna_kolekcija: 1 | 0;
  slika_putanja: string;
  opis?: string | null;
}

export interface IMojaKolekcija extends IKolekcija {
  uloga_id: number;
}

export interface IMojeKolekcijeRezultat {
  kolekcije: IMojaKolekcija[];
}

export interface IKolekcijeRezultat {
  kolekcije: IKolekcija[];
  stranica: number;
  ukupnoStranica: number;
}

export interface IClanKolekcije {
  korisnik_id: number;
  kolekcija_id: number;
  uloga_id: number;
  korime: string;
  uloga: string;
}

export interface IClanoviKolekcijeRezultat {
  clanovi: IClanKolekcije[];
  stranica: number;
  ukupnoStranica: number;
}

export interface ClanForma {
  korime: FormControl<string>;
  uloga: FormControl<number>;
}
