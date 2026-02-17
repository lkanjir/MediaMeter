import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { KONFIGURACIJA } from '../sucelja/konfiguracija';
import { EMPTY, Observable } from 'rxjs';
import {
  IClanKolekcije,
  IClanoviKolekcijeRezultat,
  IKolekcija,
  IKolekcijeRezultat,
  IMojeKolekcijeRezultat,
} from '../sucelja/kolekcija';
import { withComponentInputBinding } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class KolekcijeServis {
  private http = inject(HttpClient);
  private readonly konf = inject(KONFIGURACIJA);

  dajStranicu(stranica: number): Observable<IKolekcijeRezultat> {
    return this.http.get<IKolekcijeRezultat>(
      this.konf.api + `/kolekcije?stranica=${stranica}`,
      { withCredentials: true }
    );
  }

  dajClanove(
    kolekcijaId: number,
    stranica: number
  ): Observable<IClanoviKolekcijeRezultat> {
    return this.http.get<IClanoviKolekcijeRezultat>(
      this.konf.api +
        `/kolekcije/${kolekcijaId}/korisnici?stranica=${stranica}`,
      { withCredentials: true }
    );
  }

  obrisiClana(clan: IClanKolekcije, kolekcija: IKolekcija | null) {
    if (!kolekcija) return EMPTY;
    return this.http.delete(
      this.konf.api + `/kolekcije/${kolekcija.id}/korisnici/${clan.korime}`,
      { withCredentials: true }
    );
  }

  dodajKolekciju(podaci: FormData) {
    return this.http.post(this.konf.api + '/kolekcije', podaci, {
      withCredentials: true,
    });
  }

  dodajClanaUKolekciju(korime: string, ulogaId: number, kolekcijaId: number) {
    return this.http.post(
      this.konf.api + `/kolekcije/${kolekcijaId}/korisnici`,
      { korime: korime, uloga_id: ulogaId },
      { withCredentials: true }
    );
  }

  dajMojeKolekcije(): Observable<IMojeKolekcijeRezultat> {
    return this.http.get<IMojeKolekcijeRezultat>(
      this.konf.api + '/korisnici/moje-kolekcije',
      { withCredentials: true }
    );
  }

  dajJavneKolekcije(stranica: number): Observable<IKolekcijeRezultat> {
    return this.http.get<IKolekcijeRezultat>(
      this.konf.api + `/javno/kolekcije?stranica=${stranica}`
    );
  }

  azurirajKolekciju(kolekcijaId: number, podaci: FormData) {
    return this.http.put(this.konf.api + `/kolekcije/${kolekcijaId}`, podaci, {
      withCredentials: true,
    });
  }
}
