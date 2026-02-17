export interface IJavniSadrzaj {
	sadrzaj_id: number;
	naziv: string;
	putanja: string;
	tip: string;
	youtube_kljuc: string | null;
	kreirano: string;
	autor: string;
	film_id: number | null;
	film_naslov: string | null;
	kolekcija_id: number | null;
	kolekcija_naziv: string | null;
}
