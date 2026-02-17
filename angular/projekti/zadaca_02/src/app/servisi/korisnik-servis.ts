import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { KONFIGURACIJA } from '../sucelja/konfiguracija';
import { Observable } from 'rxjs';
import { IKorisniciRezultat, IKorisnik, ISpol } from '../sucelja/korisnik';

@Injectable({
  providedIn: 'root',
})
export class KorisnikServis {
  private http = inject(HttpClient);
  private readonly konf = inject(KONFIGURACIJA);

  dajStranicu(stranica: number): Observable<IKorisniciRezultat> {
    return this.http.get<IKorisniciRezultat>(
      this.konf.api + `/korisnici?stranica=${stranica}`,
      { withCredentials: true }
    );
  }

  blokiraj(korisnik: IKorisnik) {
    const jeBlokiran = korisnik.jeBlokiran == 'Da';
    let ruta =
      this.konf.api +
      `/korisnici/${encodeURIComponent(korisnik.korime)}${
        jeBlokiran ? '/odblokiraj' : '/blokiraj'
      }`;

    return this.http.post(ruta, { withCredentials: true });
  }

  promijeniUlogu(korisnik: IKorisnik, novaUloga: string) {
    const tijelo: { uloga: string } = { uloga: novaUloga };
    return this.http.post(
      this.konf.api + `/korisnici/${encodeURIComponent(korisnik.korime)}/uloga`,
      tijelo,
      { withCredentials: true }
    );
  }

  dajSpolove(): Observable<ISpol[]> {
    return this.http.get<ISpol[]>(this.konf.api + '/javno/spolovi');
  }
}
