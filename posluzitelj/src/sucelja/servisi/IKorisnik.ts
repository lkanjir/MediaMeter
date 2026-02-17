import { Session } from "express-session";

export interface IKorisnik {
	ime?: string | null;
	prezime?: string | null;
	adresa?: string | null;
	nadimak?: string | null;
	omeni?: string | null;
	spolId?: number | null;
	datrod?: string | null;
	email: string;
	korime: string;
	hashLozinke: string;
	sol: string;

	jeBlokiran: boolean;
	neuspjesnePrijave: number;
	tipKorisnikaId: number;

	jeAktivan: boolean;
	aktivacijskiKod: string | null;
}

export interface IKorisnikCitljivo {
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

export interface RWASesija extends Session {
	korime: string;
	tipKorisnikaId: number;
	greskaTekst?: string | null;
}
