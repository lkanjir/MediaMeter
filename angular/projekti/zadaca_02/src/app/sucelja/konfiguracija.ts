import { InjectionToken } from '@angular/core';

export interface IKonfiguracija {
  api: string;
}

export const KONFIGURACIJA = new InjectionToken<IKonfiguracija>(
  'KONFIGURACIJA'
);
