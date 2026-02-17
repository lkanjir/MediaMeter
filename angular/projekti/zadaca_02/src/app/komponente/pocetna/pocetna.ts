import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Greska } from '../greska/greska';
import { KolekcijeServis } from '../../servisi/kolekcije-servis';
import { SadrzajServis } from '../../servisi/sadrzaj-servis';
import { AuthStanjeServis } from '../../servisi/auth-stanje-servis';
import { ResursiServis } from '../../servisi/resursi-servis';
import { IKolekcija } from '../../sucelja/kolekcija';
import {
  IJavniSadrzaj,
  IJavniSadrzajFilteri,
  ISadrzaj,
} from '../../sucelja/sadrzaj';
import { mapirajGresku } from '../../pomocno/greska';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { normalizirajDatum } from '../../pomocno/datum';

type Tab = 'kolekcije' | 'sadrzaj';

@Component({
  selector: 'app-pocetna',
  imports: [Greska, DatePipe, ReactiveFormsModule],
  templateUrl: './pocetna.html',
  styleUrl: './pocetna.scss',
})
export class Pocetna {
  private readonly kolekcijeSrvis = inject(KolekcijeServis);
  private readonly sadrzajServis = inject(SadrzajServis);
  private readonly authStanjeServis = inject(AuthStanjeServis);
  resursiServis = inject(ResursiServis);

  datumRegex =
    /^([1-9]|0[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[0-2])\.(19|20)\d{2}\.?$/;

  greske = signal<string | null>(null);
  prijavljen = computed(
    () => this.authStanjeServis.sesija()?.prijavljen ?? false
  );

  kolekcije = signal<IKolekcija[]>([]);
  odabranaKolekcija = signal<IKolekcija | null>(null);
  sadrzajKolekcije = signal<ISadrzaj[]>([]);

  stranica = signal<number>(1);
  ukupnoStranica = signal<number>(1);
  mozeProslaStranica = computed(() => this.stranica() > 1);
  mozeSlijedecaStranica = computed(
    () => this.stranica() < this.ukupnoStranica()
  );
  brojac = computed(() => `${this.stranica()} / ${this.ukupnoStranica()}`);

  dajStranicu(pomak: number) {
    const stranica = this.stranica() + pomak;
    this.kolekcijeSrvis.dajJavneKolekcije(stranica).subscribe({
      next: (podaci) => {
        this.kolekcije.set(podaci.kolekcije);
        this.stranica.set(podaci.stranica);
        this.ukupnoStranica.set(podaci.ukupnoStranica);
      },
      error: (greska) => {
        this.greske.set(
          mapirajGresku(greska, 'greška pri dohvaćanju kolekcija')
        );
      },
    });
  }

  aktivanTab = signal<Tab>('kolekcije');

  dajSliku(kolekcija: IKolekcija | null): string {
    if (!kolekcija) return '/resursi/poster.png';
    if (!kolekcija.slika_putanja) return '/resursi/poster.png';
    return kolekcija.slika_putanja;
  }

  odaberiKolekciju(id: number) {
    this.sadrzajServis.dajJavniSadrzajKolekcije(id).subscribe({
      next: (podaci) => {
        this.odabranaKolekcija.set(podaci.kolekcija);
        this.sadrzajKolekcije.set(podaci.sadrzaj);
      },
      error: (greska) => {
        this.greske.set(
          mapirajGresku(greska, 'greška pri dohvaćanju sadržaja')
        );
      },
    });
  }

  autori = signal<string[]>([]);

  postaviTab(tab: Tab) {
    if (!this.prijavljen()) {
      this.aktivanTab.set('kolekcije');
      return;
    }

    this.aktivanTab.set(tab);
    if (tab == 'sadrzaj' && !this.autori().length) this.dajAutore();
  }

  private dajAutore() {
    this.sadrzajServis.dajAutore().subscribe({
      next: (podaci) => this.autori.set(podaci.autori),
      error: (greska) =>
        this.greske.set(mapirajGresku(greska, 'greška pri dohvaćanju autora')),
    });
  }

  forma = new FormGroup({
    naziv: new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.minLength(3),
    }),
    autor: new FormControl<string>('', { nonNullable: true }),
    datumOd: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.pattern(this.datumRegex)],
    }),
    datumDo: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.pattern(this.datumRegex)],
    }),
  });

  sadrzaj = signal<IJavniSadrzaj[]>([]);
  stranicaSadrzaj = signal<number>(1);
  ukupnoStranicaSadrzaj = signal<number>(1);
  mozeProslaStranicaSadrzaj = computed(() => this.stranicaSadrzaj() > 1);
  mozeSlijedecaStranicaSadrzaj = computed(
    () => this.stranicaSadrzaj() < this.ukupnoStranicaSadrzaj()
  );
  brojacSadrzaj = computed(
    () => `${this.stranicaSadrzaj()} / ${this.ukupnoStranicaSadrzaj()}`
  );

  aktivniFilteri = signal<IJavniSadrzajFilteri | null>(null);
  pretrazivanjeGotovo = signal<boolean>(false);

  pretrazi() {
    this.pretrazivanjeGotovo.set(false);
    if (this.forma.invalid) {
      this.forma.markAllAsTouched();
      return;
    }

    const naziv = this.forma.controls.naziv.value.trim();
    const autor = this.forma.controls.autor.value;
    const datumOd = this.forma.controls.datumOd.value.trim();
    const datumDo = this.forma.controls.datumDo.value.trim();

    if (naziv && naziv.length < 3) {
      this.greske.set('Naziv treba imati minimalno 3 znaka');
      return;
    }

    if (!naziv && !autor && !datumOd && !datumDo) {
      this.greske.set('Odaberite barem jedan filter');
      this.aktivniFilteri.set(null);
      this.sadrzaj.set([]);
      this.stranicaSadrzaj.set(1);
      this.ukupnoStranicaSadrzaj.set(1);
      return;
    }

    const datumOdBackend = datumOd ? normalizirajDatum(datumOd) : null;
    const datumDoBackend = datumDo ? normalizirajDatum(datumDo) : null;

    if (datumOdBackend && datumDoBackend && datumOdBackend > datumDoBackend) {
      this.greske.set('Datum OD ne može biti veći od datuma DO');
      return;
    }

    const filteri: IJavniSadrzajFilteri = {};
    if (naziv) filteri.naziv = naziv;
    if (autor) filteri.autor = autor;
    if (datumOdBackend) filteri.datumOd = datumOdBackend;
    if (datumDoBackend) filteri.datumDo = datumDoBackend;

    this.aktivniFilteri.set(filteri);
    this.stranicaSadrzaj.set(1);
    this.ukupnoStranicaSadrzaj.set(1);
    this.dajStranicuSadrzaj(0);
  }

  dajStranicuSadrzaj(pomak: number) {
    const filter = this.aktivniFilteri();
    if (!filter) return;

    const stranica = this.stranicaSadrzaj() + pomak;
    this.sadrzajServis
      .dajJavniSadrzaj({ ...filter, stranica: stranica })
      .subscribe({
        next: (podaci) => {
          this.sadrzaj.set(podaci.sadrzaj);
          this.stranicaSadrzaj.set(podaci.stranica);
          this.ukupnoStranicaSadrzaj.set(podaci.ukupnoStranica);
          this.pretrazivanjeGotovo.set(true);
        },
        error: (greska) => {
          this.pretrazivanjeGotovo.set(false);
          this.greske.set(
            mapirajGresku(greska, 'greška kod dohvaćanja sadržaja')
          );
        },
      });
  }

  prebaciNaKolekcije(idKolekcije: number) {
    this.postaviTab('kolekcije');
    this.odaberiKolekciju(idKolekcije);
  }

  ngOnInit() {
    this.dajStranicu(0);
  }
}
