import { IFilm, IMultimedija } from "../../sucelja/servisi/IFilm.js";
import Baza from "../../zajednicko/sqliteBaza.js";

type Red = { [kljuc: string]: any };

const mapFilm = (red: Red): IFilm => ({
	id: Number(red["id"]),
	tmdb_id: red["tmdb_id"] == null ? null : Number(red["tmdb_id"]),
	naslov: red["naslov"],
	opis: red["opis"] ?? null,
	datum_izlaska: red["datum_izlaska"] ?? null,
	trajanje_min:
		red["trajanje_min"] == null ? null : Number(red["trajanje_min"]),
	ocjena: red["ocjena"] == null ? null : Number(red["broj_ocjena"]),
	broj_ocjena: red["broj_ocjena"] == null ? null : Number(red["broj_ocjena"]),
	slogan: red["slogan"] ?? null,
	budzet: red["budzet"] == null ? null : Number(red["budzet"]),
});

export class FilmDAO {
	private baza: Baza;
	private bazaSpremna: Promise<void>;

	constructor() {
		this.baza = new Baza("podaci/RWA2025lkanjir23.sqlite");
		this.bazaSpremna = this.baza.spoji();
	}

	async dajPoId(id: number): Promise<IFilm | null> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<Red>(
			`SELECT * FROM film WHERE id = ?`,
			[id]
		);
		return red ? mapFilm(red) : null;
	}

	async dajPoTMDBId(id: number): Promise<IFilm | null> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<Red>(
			`SELECT *
       FROM film
       WHERE tmdb_id = ?`,
			[id]
		);

		return red ? mapFilm(red) : null;
	}

	async spremiIzTmdb(
		film: any,
		opcije: {
			posterUrl?: string | null;
			pozadinaUrl?: string | null;
			videoUrl?: string | null;
			youtubeKljuc?: string | null;
		}
	): Promise<number> {
		await this.bazaSpremna;
		let postojeci = await this.dajPoTMDBId(film.id);
		let filmId: number | null = null;
		if (!postojeci) {
			await this.baza.izvrsi(
				`INSERT INTO film (tmdb_id, naslov, opis, datum_izlaska, 
        trajanje_min, ocjena, broj_ocjena, slogan, budzet)
        VALUES (?, ?, ?,?, ?, ?,?, ?, ?)`,
				[
					film?.id ?? null,
					film?.title ?? "Nema naslova",
					film?.overview ?? null,
					film?.release_date ?? null,
					Number.isFinite(film?.runtime) ? film.runtime : null,
					Number.isFinite(film?.vote_average) ? film.vote_average : null,
					Number.isFinite(film?.vote_count) ? film.vote_count : null,
					film?.tagline ?? null,
					Number.isFinite(film?.budget) ? film.budget : null,
				]
			);

			const red = await this.baza.dajJedan<{ id: number }>(
				`SELECT last_insert_rowid() as id`
			);
			filmId = red?.id ?? null;
		} else {
			filmId = postojeci.id;
			await this.baza.izvrsi(
				`UPDATE film SET naslov = ?, opis = ?, datum_izlaska = ?, 
        trajanje_min =?, ocjena = ?, broj_ocjena = ?, slogan = ?, budzet = ? 
        WHERE id = ?`,
				[
					film?.title ?? postojeci.naslov,
					film?.overview ?? postojeci.opis,
					film?.release_date ?? postojeci.datum_izlaska,
					Number.isFinite(film?.runtime)
						? film.runtime
						: postojeci.trajanje_min,
					Number.isFinite(film?.vote_average)
						? film.vote_average
						: postojeci.ocjena,
					Number.isFinite(film?.vote_count)
						? film.vote_count
						: postojeci.broj_ocjena,
					film?.tagline ?? postojeci.slogan,
					Number.isFinite(film?.budget) ? film.budget : postojeci.budzet,
					filmId,
				]
			);
		}

		if (!filmId) throw new Error("Spremanje nije uspjelo");

		const multimedija: Array<{
			tip: string;
			putanja: string;
			naziv: string | null;
			youtube_kljuc?: string | null;
		}> = [];

		if (opcije.posterUrl) {
			multimedija.push({
				tip: "slika",
				putanja: opcije.posterUrl,
				naziv: "poster",
			});
		}

		if (opcije.pozadinaUrl) {
			multimedija.push({
				tip: "slika",
				putanja: opcije.pozadinaUrl,
				naziv: "pozadina",
			});
		}

		if (opcije.videoUrl) {
			multimedija.push({
				tip: "video",
				putanja: opcije.videoUrl,
				naziv: "trailer",
				youtube_kljuc: opcije.youtubeKljuc ?? null,
			});
		}

		for (const element of multimedija) {
			await this.spremiSadrzajZaFilm(filmId, {
				putanja: element.putanja,
				naziv: element.naziv,
				tip: element.tip,
				youtube_kljuc: element.youtube_kljuc ?? null,
			});
		}

		return filmId;
	}

	public async spremiLokalni(film: {
		naslov: string;
		opis?: string;
		datum_izlaska?: string;
		trajanje_min?: number;
		ocjena?: number;
		broj_ocjena?: number;
		slogan?: string;
		budzet?: number;
	}): Promise<number> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`INSERT INTO film (tmdb_id, naslov, opis, datum_izlaska, 
			trajanje_min, ocjena, broj_ocjena, slogan, budzet)
			VALUES (NULL, ?, ?, ?,?, ?, ?,?,?)`,
			[
				film.naslov,
				film.opis ?? null,
				film.datum_izlaska ?? null,
				film.trajanje_min ?? null,
				film.ocjena ?? null,
				film.broj_ocjena ?? null,
				film.slogan ?? null,
				film.budzet ?? null,
			]
		);

		const red = await this.baza.dajJedan<{ id: number }>(
			`SELECT last_insert_rowid() as id`
		);

		if (!red?.id) throw new Error("Greska kod spremanja lokalnog filma");
		return red.id;
	}

	private async spremiSadrzajZaFilm(
		filmId: number,
		sadrzaj: {
			putanja: string;
			naziv: string | null;
			tip: string;
			youtube_kljuc?: string | null;
		}
	) {
		await this.osigurajTipSadrzaja(sadrzaj.tip);

		let sadrzajId: number | null = null;
		const postojeci = await this.baza.dajJedan<{ id: number }>(
			`SELECt id FROM sadrzaj_multimedija WHERE putanja = ? LIMIT 1`,
			[sadrzaj.putanja]
		);

		if (postojeci) sadrzajId = postojeci.id;

		if (!sadrzajId) {
			await this.baza.izvrsi(
				`INSERT INTO sadrzaj_multimedija 
        (putanja, naziv, velicina_bajt, youtube_kljuc, 
        lokalni_sadrzaj, tip_sadrzaja_id, privatan) 
        VALUES (?, ?, NULL, ?, 0, ?, 0)`,
				[
					sadrzaj.putanja,
					sadrzaj.naziv ?? null,
					sadrzaj.youtube_kljuc ?? null,
					sadrzaj.tip,
				]
			);

			const red = await this.baza.dajJedan<{ id: number }>(
				`SELECT last_insert_rowid() as id`
			);
			sadrzajId = red?.id ?? null;
		}

		if (!sadrzajId) return;

		await this.baza.izvrsi(
			`INSERT or IGNORE INTO film_multimedija 
      (film_id, sadrzaj_id) 
      VALUES (?, ?)`,
			[filmId, sadrzajId]
		);
	}

	private async osigurajTipSadrzaja(tip: string) {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`INSERT or IGNORE into tip_sadrzaja (tip) VALUES(?)`,
			[tip]
		);
	}

	public async dajMultimediju(filmId: number): Promise<Array<IMultimedija>> {
		await this.bazaSpremna;
		const redovi = await this.baza.dajSve<Red>(
			`sELECT sm.id, sm.putanja, sm.naziv, sm.youtube_kljuc, 
      sm.tip_sadrzaja_id, sm.privatan, sm.lokalni_sadrzaj, sm.velicina_bajt
      FROM sadrzaj_multimedija sm
      JOIN film_multimedija fm ON fm.sadrzaj_id = sm.id
      WHERE fm.film_id = ?`,
			[filmId]
		);

		return redovi.map((red) => ({
			id: Number(red["id"]),
			putanja: red["putanja"],
			naziv: red["naziv"] ?? null,
			youtube_kljuc: red["youtube_kljuc"] ?? null,
			tip: red["tip_sadrzaja_id"],
			privatan: Number(red["privatan"] ?? 0),
			lokalni_sadrzaj: Number(red["lokalni_sadrzaj"] ?? 0),
			velicina_bajt:
				red["velicina_bajt"] == null ? null : Number(red["velicina_bajt"]),
		}));
	}

	public async spremiLokalnuMultimediju(opcije: {
		filmId: number;
		putanja: string;
		tip: string;
		naziv?: string | null;
		youtubeKljuc?: string | null;
		velicina?: number | null;
		privatan?: number;
	}): Promise<number> {
		await this.bazaSpremna;
		await this.osigurajTipSadrzaja(opcije.tip);

		await this.baza.izvrsi(
			`INSERT INTO sadrzaj_multimedija
			(putanja, naziv, velicina_bajt, youtube_kljuc, lokalni_sadrzaj, 
			tip_sadrzaja_id, privatan)
			VALUES (?, ?, ?, ?, 1, ?, ?)`,
			[
				opcije.putanja,
				opcije.naziv ?? null,
				opcije.velicina ?? null,
				opcije.youtubeKljuc ?? null,
				opcije.tip,
				opcije.privatan ? 1 : 0,
			]
		);

		const red = await this.baza.dajJedan<{ id: number }>(
			`SELECT last_insert_rowid() as id`
		);
		const sadrzajId = red?.id;
		if (!sadrzajId)
			throw new Error("spremanje lokalne multimedije nije uspjelo");

		await this.baza.izvrsi(
			`INSERT OR IGNORE INTO film_multimedija 
			(film_id, sadrzaj_id)
			VALUES (?, ?)`,
			[opcije.filmId, sadrzajId]
		);

		return sadrzajId;
	}

	public async poveziPostojecuMultimediju(
		filmId: number,
		sadrzajId: number
	): Promise<void> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`INSERT OR IGNORE INTO film_multimedija 
			(film_id, sadrzaj_id) VALUES (?, ?)`,
			[filmId, sadrzajId]
		);
	}
}
