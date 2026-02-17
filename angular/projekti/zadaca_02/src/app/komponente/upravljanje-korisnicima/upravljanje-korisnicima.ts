import { Component, computed, inject, signal } from '@angular/core';
import { KorisnikServis } from '../../servisi/korisnik-servis';
import { IKorisnik } from '../../sucelja/korisnik';
import { Greska } from '../greska/greska';
import { mapirajGresku } from '../../pomocno/greska';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-upravljanje-korisnicima',
  imports: [Greska, DatePipe],
  templateUrl: './upravljanje-korisnicima.html',
  styleUrl: './upravljanje-korisnicima.scss',
})
export class UpravljanjeKorisnicima {
  private readonly korisnikServis = inject(KorisnikServis);

  korisnici = signal<IKorisnik[]>([]);
  odabraniKorisnik = signal<IKorisnik | null>(null);

  stranica = signal<number>(1);
  ukupnoStranica = signal<number>(1);
  brojac = computed(() => `${this.stranica()} / ${this.ukupnoStranica()}`);

  tekstBlokiraj = computed(() =>
    this.odabraniKorisnik()?.jeBlokiran == 'Da' ? 'Odblokiraj' : 'Blokiraj'
  );
  tekstPromijeniUlogu = computed(() => {
    const tip = this.odabraniKorisnik()?.tipKorisnika.toLocaleLowerCase();
    if (tip?.includes('admin')) return 'Uloga se ne može mijenjati';
    else
      return tip?.includes('moderator')
        ? 'Postavi ulogu običnog korisnika'
        : 'Postavi ulogu moderatora';
  });

  gumbiUkljuceni = computed<boolean>(() => {
    return this.odabraniKorisnik()
      ?.tipKorisnika.toLocaleLowerCase()
      .includes('admin')
      ? false
      : true;
  });

  greske = signal<string | null>(null);

  mozeProslaStranica = computed(() => this.stranica() > 1);
  mozeSlijedecaStranica = computed(
    () => this.stranica() < this.ukupnoStranica()
  );

  dajStranicu(pomak: number) {
    const stranica = this.stranica() + pomak;
    this.korisnikServis.dajStranicu(stranica).subscribe({
      next: (podaci) => {
        this.korisnici.set(podaci.korisnici);
        this.stranica.set(podaci.stranica);
        this.ukupnoStranica.set(podaci.ukupnoStranica);
        this.odabraniKorisnik.set(null);
        this.greske.set(null);
      },
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška pri učitavanju podataka korisnika')
        ),
    });
  }
  promijeniUloguKorisnika() {
    const korisnik = this.odabraniKorisnik();
    if (!korisnik) return;

    let novaUloga;
    const tip = this.odabraniKorisnik()?.tipKorisnika.toLocaleLowerCase();
    if (tip?.includes('admin')) {
      this.greske.set('nije moguće mijenjati uloge administratora');
      return;
    }

    if (tip?.includes('moderator')) novaUloga = 'registrirani korisnik';
    else novaUloga = 'moderator';

    this.korisnikServis.promijeniUlogu(korisnik, novaUloga).subscribe({
      next: () => this.dajStranicu(0),
      error: (greska) =>
        this.greske.set(mapirajGresku(greska, 'greška kod promjene uloge')),
    });
  }

  blokirajKorisnika() {
    const korisnik = this.odabraniKorisnik();
    if (!korisnik) return;

    this.korisnikServis.blokiraj(korisnik).subscribe({
      next: () => this.dajStranicu(0),
      error: (greska) =>
        this.greske.set(
          mapirajGresku(
            greska,
            'greška pri blokiranju / odblokiranju korisnika'
          )
        ),
    });
  }

  format(polje: string) {
    console.log(polje);
    return polje == '' ? '-' : polje;
  }

  odaberi(odabran: IKorisnik) {
    this.odabraniKorisnik.set(odabran);
  }

  ngOnInit() {
    this.dajStranicu(0);
  }
}
