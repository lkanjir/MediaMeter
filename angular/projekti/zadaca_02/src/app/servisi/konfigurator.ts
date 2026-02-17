import { Injectable } from '@angular/core';
import { IKonfiguracija } from '../sucelja/konfiguracija';

@Injectable({
  providedIn: 'root',
})
export class Konfigurator {
  private konf?: IKonfiguracija;
  async ucitaj(): Promise<void> {
    const rezultat = await fetch('/config.json');
    this.konf = (await rezultat.json()) as IKonfiguracija;
  }
  get vrijednost(): IKonfiguracija {
    if (!this.konf) throw new Error('Konfiguracija nije učitana');
    return this.konf;
  }
}
