export interface IKorisniciRezultat {
  korisnici: IKorisnik[];
  stranica: number;
  ukupnoStranica: number;
}

export interface IKorisnik {
  ime: string;
  prezime: string;
  adresa: string;
  nadimak: string;
  omeni: string;
  spol: string;
  datum_rodjenja: string;
  korime: string;
  email: string;
  jeBlokiran: string;
  neuspjesnePrijave: string;
  tipKorisnika: string;
}

export interface ISesija {
  prijavljen: boolean;
  korime?: string;
  tipKorisnikaId?: number;
  razinaPrava?: number;
}

export interface ISpol {
  id: number;
  naziv: string;
}

export interface IAutoriRezultat {
  autori: string[];
}
