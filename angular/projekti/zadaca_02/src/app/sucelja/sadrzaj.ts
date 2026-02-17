import { FormControl } from '@angular/forms';
import { IKolekcija } from './kolekcija';
import { IMultimedija } from './multimedija';

export interface ISadrzaj {
  id: number;
  tmdb_id: number | null;
  naslov: string;
  opis: string | null;
  datum_izlaska: string | number;
  trajanje_min: number;
  ocjena: number;
  broj_ocjena: number | null;
  slogan: string | null;
  budzet: string | number | null;
  javni_sadrzaj: 0 | 1;
  multimedija: IMultimedija[];
}

export interface ISadrzajRezultat {
  kolekcija: IKolekcija;
  sadrzaj: ISadrzaj[];
}

export interface IJavniSadrzaj {
  sadrzaj_id: number;
  naziv: string;
  putanja: string;
  tip: string;
  youtube_kljuc: string | null;
  kreirano: string;
  autor: string;
  film_id: number | null;
  film_naslov: string | null;
  kolekcija_id: number | null;
  kolekcija_naziv: string | null;
}

export interface IJavniSadrzajFilteri {
  naziv?: string;
  autor?: string;
  datumOd?: string;
  datumDo?: string;
}

export interface IJavniSadrzajZahtjev extends IJavniSadrzajFilteri {
  stranica: number;
}

export interface IJavniSadrzajRezultat {
  sadrzaj: IJavniSadrzaj[];
  stranica: number;
  ukupnoStranica: number;
}
