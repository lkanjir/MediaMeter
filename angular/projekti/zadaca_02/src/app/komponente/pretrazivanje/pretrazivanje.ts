import { Component, computed, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FilmoviServis } from '../../servisi/filmovi-servis';
import { IFilmTMDB, PretrazivanjeTMDBForma } from '../../sucelja/film';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { mapirajGresku } from '../../pomocno/greska';
import { Greska } from '../greska/greska';

@Component({
  selector: 'app-pretrazivanje',
  imports: [ReactiveFormsModule, DatePipe, Greska],
  templateUrl: './pretrazivanje.html',
  styleUrl: './pretrazivanje.scss',
})
export class Pretrazivanje {
  private readonly filmoviServis = inject(FilmoviServis);
  private readonly router = inject(Router);

  formaPretrazivanje = new FormGroup<PretrazivanjeTMDBForma>({
    naziv: new FormControl<string>('', {
      nonNullable: true,
      validators: Validators.required,
    }),
  });

  get naziv() {
    return this.formaPretrazivanje.controls.naziv;
  }

  filmovi = signal<IFilmTMDB[]>([]);
  stranica = signal<number>(1);
  ukupnoStranica = signal<number>(1);
  greske = signal<string | null>(null);

  mozeProslaStranica = computed(() => this.stranica() > 1);
  mozeSlijedecaStranica = computed(
    () => this.stranica() < this.ukupnoStranica()
  );
  brojac = computed(() => `${this.stranica()} / ${this.ukupnoStranica()}`);
  pokaziStranicenje = computed(() => this.ukupnoStranica() > 1);

  dajStranicu(pomak: number) {
    if (this.formaPretrazivanje.invalid) return;
    const stranica = this.stranica() + pomak;
    this.filmoviServis.dajFilmoveTMDB(this.naziv.value, stranica).subscribe({
      next: (podaci) => {
        this.filmovi.set(podaci.filmovi);
        this.stranica.set(podaci.stranica);
        this.ukupnoStranica.set(podaci.ukupnoStranica);
        console.log(podaci);
      },
      error: (greska) =>
        this.greske.set(mapirajGresku(greska, 'greška pri pretrazivanju')),
    });
  }

  pretrazi() {
    this.stranica.set(1);
    this.ukupnoStranica.set(1);

    this.dajStranicu(0);
  }

  otvoriDetaljeFilma(film: IFilmTMDB) {
    this.router.navigate(['/film', film.tmdb_id]);
  }
}
