import { FormControl } from '@angular/forms';

export interface IFilmTMDB {
  tmdb_id: number;
  naslov: string;
  datum_izlaska: string;
  ocjena: number;
  poster: string;
}

export interface ITMDBRezultat {
  stranica: number;
  filmovi: IFilmTMDB[];
  ukupnoStranica: number;
}

export interface PretrazivanjeTMDBForma {
  naziv: FormControl<string>;
}

export interface IFilmDetalji {
  tmdb_id: number;
  naslov: string;
  budzet: string;
  zanrovi: string[];
  opis: string;
  pozadina: string;
  poster: string;
  kompanije: string[];
  godina_izlaska: string;
  trajanje: string;
  slogan: string;
  ocjena: string;
}

