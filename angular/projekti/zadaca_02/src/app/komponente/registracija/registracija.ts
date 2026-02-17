import { Component, inject, signal } from '@angular/core';
import { AuthServis } from '../../servisi/auth-servis';
import { Router } from '@angular/router';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  IRegistracija,
  RegistracijaForma,
} from '../../sucelja/prijava-registracija';
import { Greska } from '../greska/greska';
import { mapirajGresku } from '../../pomocno/greska';
import { KorisnikServis } from '../../servisi/korisnik-servis';
import { firstValueFrom, single } from 'rxjs';
import { ISpol } from '../../sucelja/korisnik';

@Component({
  selector: 'app-registracija',
  imports: [ReactiveFormsModule, Greska],
  templateUrl: './registracija.html',
  styleUrl: './registracija.scss',
})
export class Registracija {
  private readonly registracijaServis = inject(AuthServis);
  private readonly router = inject(Router);
  private readonly korisnikServis = inject(KorisnikServis);

  registracijaGreska = signal<string | null>(null);
  registracijaUTijeku = signal(false);

  datumRegex =
    /^([1-9]|0[1-9]|[12][0-9]|3[01])\.(0?[1-9]|1[0-2])\.(19|20)\d{2}\.?$/;

  spolovi = signal<ISpol[]>([]);
  spoloviUcitavanje = signal(false);
  spoloviGreska = signal<string | null>(null);

  async ngOnInit() {
    await this.ucitajSpolove();
  }

  private async ucitajSpolove() {
    this.spoloviUcitavanje.set(true);
    this.spoloviGreska.set(null);
    try {
      const spolovi = await firstValueFrom(this.korisnikServis.dajSpolove());
      this.spolovi.set(spolovi);
    } catch (greska) {
      this.spoloviGreska.set(
        mapirajGresku(greska, 'greška prilikom učitavanja spolova')
      );
    } finally {
      this.spoloviUcitavanje.set(false);
    }
  }

  formaRegistracija = new FormGroup<RegistracijaForma>({
    korime: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern('^[a-z][a-z0-9._-]{0,49}$'),
      ],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
        Validators.maxLength(100),
      ],
    }),
    lozinka: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\S.{2,255}$/)],
    }),
    ime: new FormControl<string | null>(null, [Validators.maxLength(50)]),
    prezime: new FormControl<string | null>(null, [Validators.maxLength(50)]),
    nadimak: new FormControl<string | null>(null, [Validators.maxLength(50)]),
    spol: new FormControl<string | null>(null),
    datRod: new FormControl<string | null>(null, [
      Validators.pattern(this.datumRegex),
    ]),
    adresa: new FormControl<string | null>(null, [Validators.maxLength(500)]),
    oMeni: new FormControl<string | null>(null, [Validators.maxLength(1000)]),
  });

  get korime() {
    return this.formaRegistracija.controls.korime;
  }

  get email() {
    return this.formaRegistracija.controls.email;
  }

  get lozinka() {
    return this.formaRegistracija.controls.lozinka;
  }

  get ime() {
    return this.formaRegistracija.controls.ime;
  }

  get prezime() {
    return this.formaRegistracija.controls.prezime;
  }

  get nadimak() {
    return this.formaRegistracija.controls.nadimak;
  }

  get spol() {
    return this.formaRegistracija.controls.spol;
  }

  get datRod() {
    return this.formaRegistracija.controls.datRod;
  }

  get adresa() {
    return this.formaRegistracija.controls.adresa;
  }

  get oMeni() {
    return this.formaRegistracija.controls.oMeni;
  }

  async registracija() {
    if (this.formaRegistracija.invalid || this.registracijaUTijeku()) {
      this.formaRegistracija.markAllAsTouched();
      return;
    }

    this.registracijaGreska.set(null);
    this.registracijaUTijeku.set(true);
    const tijelo: IRegistracija = {
      korime: this.korime.value,
      email: this.email.value,
      lozinka: this.lozinka.value,
      ime: this.ime.value,
      prezime: this.prezime.value,
      nadimak: this.nadimak.value,
      spol: this.spol.value,
      datRod: this.datRod.value?.replace(/\.$/, ''),
      adresa: this.adresa.value,
      omeni: this.oMeni.value,
    };

    try {
      await firstValueFrom(this.registracijaServis.registracija(tijelo));
      await this.router.navigate(['/prijava'], {
        queryParams: { registracija: 1 },
      });
    } catch (greska) {
      this.registracijaGreska.set(
        mapirajGresku(greska, 'dogodila se greška prilikom registracije')
      );
    } finally {
      this.registracijaUTijeku.set(false);
    }
  }
}
