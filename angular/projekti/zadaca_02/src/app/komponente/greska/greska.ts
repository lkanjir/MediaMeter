import { Component, computed, effect, input, output } from '@angular/core';

@Component({
  selector: 'app-greska',
  imports: [],
  templateUrl: './greska.html',
  styleUrl: './greska.scss',
})
export class Greska {
  poruka = input<string | null>(null);
  prikaz = computed(() => this.formatiraj(this.poruka()));
  private timeout: number | null = null;
  zatvori = output();

  constructor() {
    effect(() => {
      const tekst = this.poruka();
      if (!tekst) return;

      if (this.timeout) clearTimeout(this.timeout);
      this.timeout = setTimeout(() => {
        this.zatvori.emit();
      }, 3000);
    });
  }

  private formatiraj(poruka: string | null) {
    if (!poruka) return '';
    let tekst = poruka.trim();
    tekst = tekst.charAt(0).toLocaleUpperCase() + tekst.slice(1);
    if (!tekst.endsWith('!')) tekst += '!';

    return tekst;
  }

  ngOnDestroy() {
    if (this.timeout) clearTimeout(this.timeout);
  }
}
