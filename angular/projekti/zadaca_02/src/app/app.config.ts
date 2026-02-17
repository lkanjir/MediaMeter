import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { Konfigurator } from './servisi/konfigurator';
import { KONFIGURACIJA } from './sucelja/konfiguracija';
import { provideHttpClient, withFetch } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAppInitializer(() => inject(Konfigurator).ucitaj()),
    {
      provide: KONFIGURACIJA,
      useFactory: () => inject(Konfigurator).vrijednost,
    },
    provideHttpClient(withFetch()),
  ],
};
