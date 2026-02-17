import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { KONFIGURACIJA } from '../sucelja/konfiguracija';
import { map, Observable } from 'rxjs';
import { IFilmDetalji, ITMDBRezultat } from '../sucelja/film';
import { IMultimedija } from '../sucelja/multimedija';
import { ISadrzaj, ISadrzajRezultat } from '../sucelja/sadrzaj';

@Injectable({
  providedIn: 'root',
})
export class FilmoviServis {
  private http = inject(HttpClient);
  private readonly konf = inject(KONFIGURACIJA);

  dajFilmoveTMDB(naziv: string, stranica: number): Observable<ITMDBRezultat> {
    const putanja =
      this.konf.api +
      `/tmdb/filmovi?naziv=${encodeURIComponent(
        naziv.trim()
      )}&stranica=${encodeURIComponent(stranica)}`;

    return this.http
      .get<ITMDBRezultat>(putanja, { withCredentials: true })
      .pipe(
        map((podaci) => ({
          ...podaci,
          filmovi: podaci.filmovi.filter(
            (film) => !film.poster.endsWith('null')
          ),
        }))
      );
  }

  dajFilmTMDB(id: number): Observable<IFilmDetalji> {
    return this.http.get<IFilmDetalji>(this.konf.api + `/tmdb/filmovi/${id}`, {
      withCredentials: true,
    });
  }

  dodajFilmUKolekciju(idKolekcije: number, idFilma: number, javno: boolean) {
    return this.http.post(
      this.konf.api + `/kolekcije/${idKolekcije}/sadrzaj`,
      {
        tmdb_id: idFilma,
        javni_sadrzaj: javno ? 1 : 0,
      },
      { withCredentials: true }
    );
  }

  dajMultimedijuZaFilmTMDB(
    idKolekcije: number,
    idFilma: number
  ): Observable<IMultimedija[]> {
    return this.http
      .get<ISadrzajRezultat>(
        this.konf.api + `/kolekcije/${idKolekcije}/sadrzaj`,
        { withCredentials: true }
      )
      .pipe(
        map((podaci) => {
          const film = podaci.sadrzaj.find((s) => s.tmdb_id == idFilma);
          return film?.multimedija ?? [];
        })
      );
  }

  povezSadrzaj(kolekcijaId: number, filmId: number, sadrzajId: number) {
    return this.http.post(
      this.konf.api + `/kolekcije/${kolekcijaId}/sadrzaj/${filmId}/povezi`,
      { sadrzaj_id: sadrzajId },
      { withCredentials: true }
    );
  }

  promijeniVidljivost(kolekcijaId: number, filmId: number, javno: boolean) {
    return this.http.patch(
      this.konf.api + `/kolekcije/${kolekcijaId}/sadrzaj/${filmId}`,
      { javni_sadrzaj: javno ? 1 : 0 },
      { withCredentials: true }
    );
  }

  obrisiFilm(kolekcijaId: number, filmId: number) {
    return this.http.delete(
      this.konf.api + `/kolekcije/${kolekcijaId}/sadrzaj/${filmId}`,
      { withCredentials: true }
    );
  }

  dodajLokalniFilm(
    kolekcijaId: number,
    podaci: {
      naslov: string;
      godina?: string;
      trajanje?: number | null;
      ocjena?: number | null;
      opis?: string | null;
      javni_sadrzaj: 0 | 1;
    }
  ) {
    return this.http.post(
      this.konf.api + `/kolekcije/${kolekcijaId}/sadrzaj/lokalni`,
      podaci,
      { withCredentials: true }
    );
  }
}
