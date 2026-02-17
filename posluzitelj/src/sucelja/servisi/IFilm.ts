export interface IFilm {
	id: number;
	tmdb_id: number | null;
	naslov: string;
	opis: string | null;
	datum_izlaska: string | null;
	trajanje_min: number | null;
	ocjena: number | null;
	broj_ocjena: number | null;
	slogan: string | null;
	budzet: number | null;
}

export interface ICitljvFilm {
	tmdb_id: number | null;
	naslov: string;
	budzet: string;
	zanrovi: Array<string>;
	opis: string;
	pozadina: string;
	poster: string;
	kompanije: Array<string>;
	godina_izlaska: string;
	trajanje: string;
	slogan: string;
	ocjena: string;
}

export interface IMultimedija {
	id?: number;
	putanja: string;
	naziv: string | null;
	tip: string;
	youtube_kljuc: string | null;
	privatan: number;
	lokalni_sadrzaj: number;
	velicina_bajt?: number | null;
}

export interface IFilmSMultimedijom extends IFilm {
	multimedija: Array<IMultimedija>;
}
