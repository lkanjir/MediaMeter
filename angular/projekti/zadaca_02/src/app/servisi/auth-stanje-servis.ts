import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthServis } from './auth-servis';
import { ISesija } from '../sucelja/korisnik';
import { first, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthStanjeServis {
  private readonly auth = inject(AuthServis);
  private sesijaSignal = signal<ISesija | null>(null);
  private ucitavaSignal = signal(false);

  sesija = computed(() => this.sesijaSignal());
  ucitava = computed(() => this.ucitavaSignal());

  async prijava(korime: string, lozinka: string): Promise<void> {
    await firstValueFrom(this.auth.prijava(korime, lozinka));
    await this.osvjezi();
  }

  async osvjezi(): Promise<void> {
    if (this.ucitavaSignal()) return;
    this.ucitavaSignal.set(true);

    try {
      const podaci = await firstValueFrom(this.auth.sesija());
      this.sesijaSignal.set(podaci);
    } catch {
      this.sesijaSignal.set({ prijavljen: false });
    } finally {
      this.ucitavaSignal.set(false);
    }
  }

  async odjava(): Promise<void> {
    await firstValueFrom(this.auth.odjava());
    await this.osvjezi();
  }
}
