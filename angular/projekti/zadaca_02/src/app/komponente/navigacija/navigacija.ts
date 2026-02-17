import { Component, computed, inject } from '@angular/core';
import { AuthStanjeServis } from '../../servisi/auth-stanje-servis';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-navigacija',
  imports: [RouterLink],
  templateUrl: './navigacija.html',
  styleUrl: './navigacija.scss',
})
export class Navigacija {
  private readonly authStanje = inject(AuthStanjeServis);
  private readonly router = inject(Router);

  prijavljen = computed(() => this.authStanje.sesija()?.prijavljen ?? false);
  razinaPrava = computed(() => this.authStanje.sesija()?.razinaPrava ?? 0);

  async ngOnInit() {
    await this.authStanje.osvjezi();
  }

  async odjava() {
    await this.authStanje.odjava();
    await this.router.navigate(['/pocetna']);
  }
}
