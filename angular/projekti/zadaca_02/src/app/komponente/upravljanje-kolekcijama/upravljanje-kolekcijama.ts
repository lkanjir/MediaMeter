import { Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { KolekcijeServis } from '../../servisi/kolekcije-servis';
import {
  ClanForma,
  IClanKolekcije,
  IKolekcija,
  KolekcijaForma,
} from '../../sucelja/kolekcija';
import { Greska } from '../greska/greska';
import { mapirajGresku } from '../../pomocno/greska';

@Component({
  selector: 'app-upravljanje-kolekcijama',
  imports: [ReactiveFormsModule, Greska],
  templateUrl: './upravljanje-kolekcijama.html',
  styleUrl: './upravljanje-kolekcijama.scss',
})
export class UpravljanjeKolekcijama {
  private readonly kolekcijeServis = inject(KolekcijeServis);
  greske = signal<string | null>(null);

  formaKreiranjeKolekcije = new FormGroup<KolekcijaForma>({
    naziv: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    javna: new FormControl<boolean>(false, {
      nonNullable: true,
    }),
    opis: new FormControl<string | null>(null, [Validators.maxLength(1000)]),
    slika: new FormControl<File | null>(null, Validators.required),
  });

  get naziv() {
    return this.formaKreiranjeKolekcije.controls.naziv;
  }

  get javna() {
    return this.formaKreiranjeKolekcije.controls.javna;
  }

  get opis() {
    return this.formaKreiranjeKolekcije.controls.opis;
  }

  get slika() {
    return this.formaKreiranjeKolekcije.controls.slika;
  }

  slikaOdabrana(e: Event) {
    const input = e.target as HTMLInputElement;
    const slika = input.files?.[0] ?? null;

    this.formaKreiranjeKolekcije.controls.slika.setValue(slika);
    this.formaKreiranjeKolekcije.controls.slika.markAllAsTouched();
    this.formaKreiranjeKolekcije.controls.slika.updateValueAndValidity();
  }

  slikaDodirnuta() {
    this.formaKreiranjeKolekcije.controls.slika.markAsTouched();
    this.formaKreiranjeKolekcije.controls.slika.updateValueAndValidity();
  }

  kreirajKolekciju() {
    if (this.formaKreiranjeKolekcije.invalid) return;

    const podaciForme = new FormData();
    podaciForme.append('naziv', this.naziv.value);
    podaciForme.append('javna', String(this.javna.value ? 1 : 0));

    if (this.opis.value) {
      podaciForme.append('opis', this.opis.value);
    }

    if (this.slika.value) {
      podaciForme.append('slika', this.slika.value);
    }

    this.kolekcijeServis.dodajKolekciju(podaciForme).subscribe({
      next: () => this.dajStranicu(0),
      error: (greska) =>
        this.greske.set(mapirajGresku(greska, 'greška pri dodavanju kolekcje')),
    });
  }

  kolekcije = signal<IKolekcija[]>([]);
  strKolekcije = signal<number>(1);
  ukupnoStrKolekcije = signal<number>(1);
  brojac = computed(
    () => `${this.strKolekcije()} / ${this.ukupnoStrKolekcije()}`
  );

  dajStranicu(pomak: number) {
    const stranica = this.strKolekcije() + pomak;
    this.kolekcijeServis.dajStranicu(stranica).subscribe({
      next: (podaci) => {
        this.kolekcije.set(podaci.kolekcije);
        this.strKolekcije.set(podaci.stranica);
        this.ukupnoStrKolekcije.set(podaci.ukupnoStranica);
      },
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška pri dohvaćanju kolekcija')
        ),
    });
  }

  odabranaKolekcija = signal<IKolekcija | null>(null);
  clanoviKolekcije = signal<IClanKolekcije[] | null>(null);

  strClanovi = signal<number>(1);
  ukupnoStrClanovi = signal<number>(1);
  brojacClanovi = computed(
    () => `${this.strClanovi()} / ${this.ukupnoStrClanovi()}`
  );

  odaberi(odabrana: IKolekcija) {
    this.odabranaKolekcija.set(odabrana);
    this.strClanovi.set(1);
    this.clanoviKolekcije.set(null);

    this.kolekcijeServis.dajClanove(odabrana.id, 1).subscribe({
      next: (podaci) => {
        this.clanoviKolekcije.set(podaci.clanovi);
        this.strClanovi.set(podaci.stranica);
        this.ukupnoStrClanovi.set(podaci.ukupnoStranica);
      },
      error: (greska) =>
        this.greske.set(mapirajGresku(greska, 'greška pri dohvaćanju članova')),
    });
  }

  obrisiClanaIzKolekcije(clan: IClanKolekcije) {
    const kolekcija = this.odabranaKolekcija();
    if (!kolekcija) return;

    this.kolekcijeServis.obrisiClana(clan, kolekcija).subscribe({
      next: () => this.dajStranicuClanova(0),
      error: (greska) =>
        this.greske.set(mapirajGresku(greska, 'greška pri birsanju člana')),
    });
  }

  mozeProsleKolekcije = computed(() => this.strKolekcije() > 1);
  mozeSlijedceKolekcije = computed(
    () => this.strKolekcije() < this.ukupnoStrKolekcije()
  );

  formClanovi = new FormGroup<ClanForma>({
    korime: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    uloga: new FormControl<number>(2, { nonNullable: true }),
  });

  get korime() {
    return this.formClanovi.controls.korime;
  }

  get uloga() {
    return this.formClanovi.controls.uloga;
  }

  dajStranicuClanova(pomak: number) {
    const kolekcija = this.odabranaKolekcija();
    if (!kolekcija) return;

    const stranica = this.strClanovi() + pomak;
    this.kolekcijeServis.dajClanove(kolekcija.id, stranica).subscribe({
      next: (podaci) => {
        this.clanoviKolekcije.set(podaci.clanovi);
        this.strClanovi.set(podaci.stranica);
        this.ukupnoStrClanovi.set(podaci.ukupnoStranica);
      },
      error: (greska) =>
        this.greske.set(mapirajGresku(greska, 'greška pri dohvaćanju članova')),
    });
  }

  mozeProsleClanove = computed(() => this.strClanovi() > 1);
  mozeSlijedeceClanove = computed(
    () => this.strClanovi() < this.ukupnoStrClanovi()
  );

  dodajClana() {
    const kolekcijaId = this.odabranaKolekcija()?.id;
    if (!kolekcijaId || this.formClanovi.invalid) {
      this.formClanovi.markAllAsTouched();
      return;
    }

    this.kolekcijeServis
      .dodajClanaUKolekciju(this.korime.value, this.uloga.value, kolekcijaId)
      .subscribe({
        next: () => this.dajStranicuClanova(0),
        error: (greska) =>
          this.greske.set(mapirajGresku(greska, 'greška pri dodavanju člana')),
      });
  }

  ngOnInit() {
    this.dajStranicu(0);
  }
}
