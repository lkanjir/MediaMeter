import { Component, computed, inject, signal } from '@angular/core';
import { Greska } from '../greska/greska';
import { ILokalanSadrzaj } from '../../sucelja/lokalanSadrzaj';
import { SadrzajServis } from '../../servisi/sadrzaj-servis';
import { mapirajGresku } from '../../pomocno/greska';
import { DatePipe } from '@angular/common';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-sadrzaj',
  imports: [Greska, DatePipe, ReactiveFormsModule],
  templateUrl: './sadrzaj.html',
  styleUrl: './sadrzaj.scss',
})
export class Sadrzaj {
  sadrzajServis = inject(SadrzajServis);

  greske = signal<string | null>(null);
  stranica = signal<number>(1);
  ukupnoStranica = signal<number>(1);

  mozeProslaStranica = computed(() => this.stranica() > 1);
  mozeSlijedecaStranica = computed(
    () => this.stranica() < this.ukupnoStranica()
  );
  brojac = computed(() => `${this.stranica()} / ${this.ukupnoStranica()}`);

  uploadUTijeku = signal(false);

  constructor() {
    this.dajStranicu(0);
  }

  sadrzaj = signal<ILokalanSadrzaj[]>([]);
  dajStranicu(pomak: number) {
    const stranica = this.stranica() + pomak;
    this.sadrzajServis.dajLokalanSadrzaj(stranica).subscribe({
      next: (podaci) => {
        this.sadrzaj.set(podaci.sadrzaj);
        this.stranica.set(podaci.stranica);
        this.ukupnoStranica.set(podaci.ukupnoStranica);
      },
      error: (greska) =>
        this.greske.set(
          mapirajGresku(greska, 'greška pri dohvaćanju sadržaja')
        ),
    });
  }

  formatirajVelicinu(velicina: number) {
    if (velicina >= 1024 * 1024)
      return `${(velicina / (1024 * 1024)).toFixed(1)} MB`;
    return `${(velicina / 1024).toFixed(1)} KB`;
  }

  promijeniVidljivost(s: ILokalanSadrzaj) {
    this.sadrzajServis.promijeniVidljivost(s).subscribe({
      next: () => this.dajStranicu(0),
      error: (greska) => {
        this.greske.set(
          mapirajGresku(greska, 'nije moguće promijeniti vidljivost')
        );
      },
    });
  }

  forma = new FormGroup({
    naziv: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    tip: new FormControl<string>('slika', {
      nonNullable: true,
    }),
    privatno: new FormControl<boolean>(true, { nonNullable: true }),
    datoteka: new FormControl<File | null>(null, Validators.required),
  });

  get naziv() {
    return this.forma.controls.naziv;
  }
  get tip() {
    return this.forma.controls.tip;
  }
  get privatno() {
    return this.forma.controls.privatno;
  }
  get datoteka() {
    return this.forma.controls.datoteka;
  }

  datotekaOdabrana(e: Event) {
    const input = e.target as HTMLInputElement;
    const datoteka = input.files?.[0] ?? null;

    this.forma.controls.datoteka.setValue(datoteka);
    this.forma.controls.datoteka.markAsTouched();
    this.forma.controls.datoteka.updateValueAndValidity();
  }

  datotekaDodirnuta() {
    this.forma.controls.datoteka.markAsTouched();
    this.forma.controls.datoteka.updateValueAndValidity();
  }

  kreirajSadrzaj() {
    if (this.forma.invalid || this.uploadUTijeku()) {
      this.forma.markAllAsTouched();
      return;
    }
    this.uploadUTijeku.set(true);

    const datoteka = this.datoteka.value;
    if (!datoteka) {
      this.uploadUTijeku.set(false);
      return;
    }

    const limit = this.tip.value == 'video' ? 1024 * 1024 : 500 * 1024;
    if (datoteka.size > limit) {
      this.greske.set('datoteka je veća od maksimalne veličine.');
      this.uploadUTijeku.set(false);
      return;
    }

    const podaciForme = new FormData();
    podaciForme.append('naziv', this.naziv.value);
    podaciForme.append('tip', this.tip.value);

    this.privatno.value
      ? podaciForme.append('privatan', '1')
      : podaciForme.append('privatan', '');

    podaciForme.append('datoteka', datoteka);

    this.sadrzajServis.kreirajSadrzaj(podaciForme).subscribe({
      next: () => {
        this.forma.reset();
        this.dajStranicu(0);
      },
      error: (greska) => {
        this.greske.set(mapirajGresku(greska, 'greška pri uploadu datoteke'));
        this.uploadUTijeku.set(false);
      },
      complete: () => this.uploadUTijeku.set(false),
    });
  }
}
