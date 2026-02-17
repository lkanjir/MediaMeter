import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { KONFIGURACIJA } from '../sucelja/konfiguracija';
import {
  ILokalanSadrzaj,
  ILokalanSadrzajRezultat,
} from '../sucelja/lokalanSadrzaj';
import { Observable } from 'rxjs';
import { IKolekcija, IMojaKolekcija } from '../sucelja/kolekcija';
import {
  IJavniSadrzaj,
  IJavniSadrzajRezultat,
  IJavniSadrzajZahtjev,
  ISadrzajRezultat,
} from '../sucelja/sadrzaj';
import { IAutoriRezultat } from '../sucelja/korisnik';

@Injectable({
  providedIn: 'root',
})
export class SadrzajServis {
  private http = inject(HttpClient);
  private readonly konf = inject(KONFIGURACIJA);

  dajLokalanSadrzaj(
    stranica: number = 1,
    svi: boolean = false
  ): Observable<ILokalanSadrzajRezultat> {
    const ruta = svi ? 'svi=1' : `stranica=${stranica}`;

    return this.http.get<ILokalanSadrzajRezultat>(
      this.konf.api + `/korisnici/moj-sadrzaj?${ruta}`,
      { withCredentials: true }
    );
  }

  promijeniVidljivost(sadrzaj: ILokalanSadrzaj) {
    return this.http.patch(
      this.konf.api + `/korisnici/moj-sadrzaj/${sadrzaj.id}`,
      { privatan: sadrzaj.privatan ? 0 : 1 },
      { withCredentials: true }
    );
  }

  kreirajSadrzaj(podaci: FormData) {
    return this.http.post(this.konf.api + '/korisnici/moj-sadrzaj', podaci, {
      withCredentials: true,
    });
  }

  dajSadrzajKolekcije(kolekcija: IMojaKolekcija): Observable<ISadrzajRezultat> {
    return this.http.get<ISadrzajRezultat>(
      this.konf.api + `/kolekcije/${kolekcija.id}/sadrzaj`,
      {
        withCredentials: true,
      }
    );
  }

  dajJavniSadrzajKolekcije(id: number): Observable<ISadrzajRezultat> {
    return this.http.get<ISadrzajRezultat>(
      this.konf.api + `/javno/kolekcije/${id}/sadrzaj`
    );
  }

  dajAutore(): Observable<IAutoriRezultat> {
    return this.http.get<IAutoriRezultat>(
      this.konf.api + '/korisnici/javni-sadrzaj/autori',
      { withCredentials: true }
    );
  }

  dajJavniSadrzaj(
    upit: IJavniSadrzajZahtjev
  ): Observable<IJavniSadrzajRezultat> {
    let params = new HttpParams().set('stranica', upit.stranica);

    if (upit.naziv) params = params.set('naziv', upit.naziv);
    if (upit.autor) params = params.set('autor', upit.autor);
    if (upit.datumOd) params = params.set('datumOd', upit.datumOd);
    if (upit.datumDo) params = params.set('datumDo', upit.datumDo);

    return this.http.get<IJavniSadrzajRezultat>(
      this.konf.api + `/korisnici/javni-sadrzaj`,
      { withCredentials: true, params }
    );
  }
}
