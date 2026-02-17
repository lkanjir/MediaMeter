import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FilmoviServis } from '../../servisi/filmovi-servis';
import { IFilmDetalji } from '../../sucelja/film';
import { IMojaKolekcija } from '../../sucelja/kolekcija';
import { KolekcijeServis } from '../../servisi/kolekcije-servis';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { IMultimedija } from '../../sucelja/multimedija';
import { ResursiServis } from '../../servisi/resursi-servis';
import { Greska } from '../greska/greska';
import { mapirajGresku } from '../../pomocno/greska';

@Component({
  selector: 'app-detalji-filma',
  imports: [ReactiveFormsModule, Greska],
  templateUrl: './detalji-filma.html',
  styleUrl: './detalji-filma.scss',
})
export class DetaljiFilma {
  private ruta = inject(ActivatedRoute);
  private readonly filmoviServis = inject(FilmoviServis);
  private readonly kolekcijeServis = inject(KolekcijeServis);
  resursiServis = inject(ResursiServis);
  private tmdbId: number;
  greske = signal<string | null>(null);

  constructor() {
    this.tmdbId = Number(this.ruta.snapshot.paramMap.get('id'));
    if (!Number.isFinite(this.tmdbId)) this.greske.set('neispravan id filma');
  }

  film = signal<IFilmDetalji>({
    tmdb_id: 0,
    naslov: '',
    budzet: '',
    zanrovi: [],
    opis: '',
    pozadina: '',
    poster: '',
    kompanije: [],
    godina_izlaska: '',
    trajanje: '',
    slogan: '',
    ocjena: '',
  });

  private ucitajFilm() {
    this.filmoviServis.dajFilmTMDB(this.tmdbId).subscribe({
      next: (podaci) => this.film.set(podaci),
      error: (greska) =>
        this.greske.set(mapirajGresku(greska, 'greška pri dohvaćanju filma')),
    });
  }

  kolekcije = signal<IMojaKolekcija[]>([]);
  private ucitajKolekcije() {
    this.kolekcijeServis.dajMojeKolekcije().subscribe({
      next: (podaci) => this.kolekcije.set(podaci.kolekcije),
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška pri dohvaćanju kolekcija')
        ),
    });
  }

  formaKolekcija = new FormGroup({
    kolekcijaId: new FormControl<number | null>(null, Validators.required),
    javni: new FormControl<boolean>(true, { nonNullable: true }),
  });

  dodajUKolekciju() {
    if (this.formaKolekcija.invalid) {
      this.formaKolekcija.markAllAsTouched();
      return;
    }

    const id = this.formaKolekcija.controls.kolekcijaId.value;
    const javni = this.formaKolekcija.controls.javni.value;

    if (!id) return;

    this.filmoviServis.dodajFilmUKolekciju(id, this.tmdbId, javni).subscribe({
      next: () => this.dajMultimedijuZaFilm(),
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška pri dodavanju filma u kolekciju')
        ),
    });
  }

  multimedija = signal<IMultimedija[]>([]);
  pokaziMultimediju = computed<boolean>(() => this.multimedija().length > 0);

  private dajMultimedijuZaFilm() {
    const id = this.formaKolekcija.controls.kolekcijaId.value;
    if (!id) return;

    this.filmoviServis.dajMultimedijuZaFilmTMDB(id, this.tmdbId).subscribe({
      next: (podaci) => this.multimedija.set(podaci),
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška pri dohvaćanju multimedije')
        ),
    });
  }

  ngOnInit() {
    this.ucitajFilm();
    this.ucitajKolekcije();
  }
}
