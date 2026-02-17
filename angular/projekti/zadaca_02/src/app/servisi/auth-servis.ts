import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { KONFIGURACIJA } from '../sucelja/konfiguracija';
import { Observable } from 'rxjs';
import { IPrijava, IRegistracija } from '../sucelja/prijava-registracija';
import { ISesija } from '../sucelja/korisnik';

@Injectable({
  providedIn: 'root',
})
export class AuthServis {
  private http = inject(HttpClient);
  private readonly konf = inject(KONFIGURACIJA);

  prijava(korime: string, lozinka: string): Observable<void> {
    const tijelo: IPrijava = {
      korime: korime,
      lozinka: lozinka,
    };

    return this.http.post<void>(
      this.konf.api + '/javno/korisnici/prijava',
      tijelo,
      {
        withCredentials: true,
      }
    );
  }

  registracija(tijelo: IRegistracija): Observable<void> {
    return this.http.post<void>(
      this.konf.api + '/javno/korisnici/registracija',
      tijelo,
      {
        withCredentials: true,
      }
    );
  }

  sesija(): Observable<ISesija> {
    return this.http.get<ISesija>(this.konf.api + '/javno/sesija', {
      withCredentials: true,
    });
  }

  odjava(): Observable<void> {
    return this.http.post<void>(
      this.konf.api + '/javno/korisnici/odjava',
      {},
      { withCredentials: true }
    );
  }
}
