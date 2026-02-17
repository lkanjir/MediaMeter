import { Component, inject, signal } from '@angular/core';
import { Greska } from '../greska/greska';
import { KolekcijeServis } from '../../servisi/kolekcije-servis';
import { IMojaKolekcija } from '../../sucelja/kolekcija';
import { mapirajGresku } from '../../pomocno/greska';
import { SadrzajServis } from '../../servisi/sadrzaj-servis';
import { ISadrzaj } from '../../sucelja/sadrzaj';
import { DatePipe } from '@angular/common';
import { ResursiServis } from '../../servisi/resursi-servis';
import { ILokalanSadrzaj } from '../../sucelja/lokalanSadrzaj';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FilmoviServis } from '../../servisi/filmovi-servis';
import { normalizirajDatum } from '../../pomocno/datum';

type Tip = 'slika' | 'video';

@Component({
  selector: 'app-moje-kolekcije',
  imports: [Greska, DatePipe, ReactiveFormsModule],
  templateUrl: './moje-kolekcije.html',
  styleUrl: './moje-kolekcije.scss',
})
export class MojeKolekcije {
  private readonly kolekcijeServis = inject(KolekcijeServis);
  private readonly sadrzajServis = inject(SadrzajServis);
  readonly resursiServis = inject(ResursiServis);
  private readonly filmoviServis = inject(FilmoviServis);

  greske = signal<string | null>(null);
  kolekcije = signal<IMojaKolekcija[]>([]);
  odabranaKolekcija = signal<IMojaKolekcija | null>(null);
  sadrzajKolekcije = signal<ISadrzaj[]>([]);
  mojSadrzaj = signal<ILokalanSadrzaj[]>([]);

  odabranaSlika = signal<Record<number, number>>({});
  odabraniVideo = signal<Record<number, number>>({});

  formaPostavke = new FormGroup({
    javna: new FormControl<boolean>(false, { nonNullable: true }),
    slika: new FormControl<File | null>(null),
  });

  datumRegex =
    /^([1-9]|0[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[0-2])\.(19|20)\d{2}\.?$/;

  odaberiKolekciju(kolekcija: IMojaKolekcija) {
    this.odabranaKolekcija.set(kolekcija);
    this.formaPostavke.reset({
      javna: this.odabranaKolekcija()?.javna_kolekcija ? true : false,
    });
    this.dajDetaljeKolekcije();
  }

  private dajDetaljeKolekcije() {
    const kolekcija = this.odabranaKolekcija();
    if (!kolekcija) return;
    this.sadrzajServis.dajSadrzajKolekcije(kolekcija).subscribe({
      next: (podaci) => this.sadrzajKolekcije.set(podaci.sadrzaj),
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška pri dohvaćanju sadržaja')
        ),
    });
  }

  private ucitajKolekcije() {
    this.kolekcijeServis.dajMojeKolekcije().subscribe({
      next: (podaci) => {
        this.kolekcije.set(podaci.kolekcije);
        const odabarana = this.odabranaKolekcija();
        if (odabarana) {
          const osvjezena = podaci.kolekcije.find((k) => k.id == odabarana.id);
          if (osvjezena) this.odabranaKolekcija.set(osvjezena);
        } else if (podaci.kolekcije.length) {
          this.odaberiKolekciju(podaci.kolekcije[0]);
        }
      },
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška pri dohvaćanju kolekcija')
        ),
    });
  }

  private ucitajMojSadrzaj() {
    this.sadrzajServis.dajLokalanSadrzaj(undefined, true).subscribe({
      next: (podaci) => this.mojSadrzaj.set(podaci.sadrzaj),
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška pri dohvaćanju korisničkih sadržaja')
        ),
    });
  }

  filtrirajSadrzajPoTipu(tip: Tip) {
    return this.mojSadrzaj().filter((s) => s.tip == tip);
  }

  posatviNovuSliku(e: Event) {
    const input = e.target as HTMLInputElement;
    const datoteka = input.files && input.files.length ? input.files[0] : null;
    this.formaPostavke.controls.slika.setValue(datoteka);
  }

  spremiPostavkeKolekcije() {
    const kolekcija = this.odabranaKolekcija();
    if (!kolekcija) return;

    const podaci = new FormData();
    podaci.set('javna', this.formaPostavke.controls.javna.value ? '1' : '0');
    const slika = this.formaPostavke.controls.slika.value;
    if (slika) podaci.set('slika', slika);

    this.kolekcijeServis.azurirajKolekciju(kolekcija.id, podaci).subscribe({
      next: () => {
        this.ucitajKolekcije();
        this.dajDetaljeKolekcije();
      },
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška kod ažuriranja kolekcije')
        ),
    });
  }

  postaviOdabranuSliku(filmId: number, target: EventTarget | null) {
    if (!target) return;
    const vrijednost: string = (target as HTMLSelectElement).value;
    const id = Number(vrijednost);
    this.odabranaSlika.set({ ...this.odabranaSlika(), [filmId]: id });
  }

  dodajSlikuZaFilm(filmId: number) {
    const kolekcija = this.odabranaKolekcija();
    const sadrzajId = this.odabranaSlika()[filmId];

    if (!kolekcija || !sadrzajId) {
      this.greske.set('Odaberite sliku');
      return;
    }

    this.filmoviServis.povezSadrzaj(kolekcija.id, filmId, sadrzajId).subscribe({
      next: () => this.dajDetaljeKolekcije(),
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška kod povezivanja sadržaja i filma')
        ),
    });
  }

  postaviOdabraniVideo(filmId: number, target: EventTarget | null) {
    if (!target) return;
    const vrijednost: string = (target as HTMLSelectElement).value;
    const id = Number(vrijednost);
    this.odabraniVideo.set({ ...this.odabraniVideo(), [filmId]: id });
  }

  dodajVideoZaFilm(filmId: number) {
    const kolekcija = this.odabranaKolekcija();
    const sadrzajId = this.odabraniVideo()[filmId];

    if (!kolekcija || !sadrzajId) {
      this.greske.set('Odaberite video');
      return;
    }

    this.filmoviServis.povezSadrzaj(kolekcija.id, filmId, sadrzajId).subscribe({
      next: () => this.dajDetaljeKolekcije(),
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška kod povezivanja sadržaja i filma')
        ),
    });
  }

  promijeniVidljivost(filmId: number, javno: boolean) {
    const kolekcija = this.odabranaKolekcija();
    if (!kolekcija) return;

    this.filmoviServis
      .promijeniVidljivost(kolekcija.id, filmId, javno)
      .subscribe({
        next: () => this.dajDetaljeKolekcije(),
        error: (greska) =>
          this.greske.set(mapirajGresku(greska, 'greška kod ažuriranja')),
      });
  }

  obrisiFilm(filmId: number) {
    const kolekcija = this.odabranaKolekcija();
    if (!kolekcija) return;

    this.filmoviServis.obrisiFilm(kolekcija.id, filmId).subscribe({
      next: () => this.dajDetaljeKolekcije(),
      error: (greska) =>
        this.greske.set(mapirajGresku(greska, 'greška kod brisanja')),
    });
  }

  formaFilm = new FormGroup({
    naslov: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    datum: new FormControl<string>('', Validators.pattern(this.datumRegex)),
    trajanje: new FormControl<number | null>(null),
    ocjena: new FormControl<number | null>(null),
    opis: new FormControl<string>(''),
    javni: new FormControl<boolean>(true, { nonNullable: true }),
  });

  dodajLokalniFilm() {
    if (this.formaFilm.invalid) {
      this.formaFilm.markAllAsTouched();
      return;
    }

    const kolekcija = this.odabranaKolekcija();
    if (!kolekcija) return;

    const datumStr = this.formaFilm.controls.datum.value?.trim();
    const datum = datumStr ? normalizirajDatum(datumStr) : undefined;

    this.filmoviServis
      .dodajLokalniFilm(kolekcija.id, {
        naslov: this.formaFilm.controls.naslov.value.trim(),
        godina: datum,
        trajanje: this.formaFilm.controls.trajanje.value,
        ocjena: this.formaFilm.controls.ocjena.value,
        opis: this.formaFilm.controls.opis.value,
        javni_sadrzaj: this.formaFilm.controls.javni.value ? 1 : 0,
      })
      .subscribe({
        next: () => {
          this.formaFilm.reset();
          this.dajDetaljeKolekcije();
        },
        error: (greska) =>
          this.greske.set(mapirajGresku(greska, 'greška kod dodavanja filma')),
      });
  }

  ngOnInit() {
    this.ucitajMojSadrzaj();
    this.ucitajKolekcije();
  }
}
