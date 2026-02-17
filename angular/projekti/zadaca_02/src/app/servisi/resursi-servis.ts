import { inject, Injectable } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root',
})
export class ResursiServis {
  private urlCistac = inject(DomSanitizer);

  dajYoutubeUrl(kljuc: string): SafeResourceUrl {
    return this.urlCistac.bypassSecurityTrustResourceUrl(
      `https://www.youtube.com/embed/${kljuc}`
    );
  }
}
