import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PrijavaForma } from '../../sucelja/prijava-registracija';
import { AuthStanjeServis } from '../../servisi/auth-stanje-servis';
import { Greska } from '../greska/greska';
import { mapirajGresku } from '../../pomocno/greska';

@Component({
  selector: 'app-prijava',
  imports: [ReactiveFormsModule, RouterLink, Greska],
  templateUrl: './prijava.html',
  styleUrl: './prijava.scss',
})
export class Prijava {
  private readonly authStanje = inject(AuthStanjeServis);
  private readonly router = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  prijavaGreska = signal<string | null>(null);
  prijavaUTijeku = signal(false);
  registracijskaPoruka = signal<string | null>(null);

  constructor() {
    const registracija = Number(
      this.ruta.snapshot.queryParamMap.get('registracija')
    );

    console.log(registracija);

    if (registracija)
      this.registracijskaPoruka.set(
        'Aktivacijski mail poslan. Aktivirajte račun prije prijave.'
      );
    else this.registracijskaPoruka.set(null);
  }

  formaPrijava = new FormGroup<PrijavaForma>({
    korime: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern('^[a-z][a-z0-9._-]{0,49}$'),
      ],
    }),
    lozinka: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\S.{2,255}$/)],
    }),
  });

  get korime() {
    return this.formaPrijava.controls.korime;
  }
  get lozinka() {
    return this.formaPrijava.controls.lozinka;
  }

  async prijava() {
    if (this.formaPrijava.invalid || this.prijavaUTijeku()) {
      this.formaPrijava.markAsTouched();
      return;
    }

    this.prijavaGreska.set(null);
    this.prijavaUTijeku.set(true);

    try {
      await this.authStanje.prijava(this.korime.value, this.lozinka.value);
      await this.router.navigate(['/pocetna']);
    } catch (greska) {
      this.prijavaGreska.set(
        mapirajGresku(greska, 'dogodila se greška prilikom prijave')
      );
    } finally {
      this.prijavaUTijeku.set(false);
    }
  }
}
