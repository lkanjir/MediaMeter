import { IFilmSMultimedijom } from "./IFilm.js";

export interface IKolekcija {
	id?: number;
	naziv: string;
	javna_kolekcija: number;
	slika_putanja: string | null;
	opis: string | null;
	uloga_id?: number;
}

export interface IKorisnikKolekcija {
	korisnik_id: number;
	kolekcija_id: number;
	uloga_id: number;
	korime?: string;
	uloga?: string;
}

export interface IKolekcijaSadrzaj extends IFilmSMultimedijom {
	javni_sadrzaj: number;
}
