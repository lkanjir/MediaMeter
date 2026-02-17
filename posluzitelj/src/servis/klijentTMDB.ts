import { ICitljvFilm } from "../sucelja/servisi/IFilm.js";
import { ITMDBParametri } from "../sucelja/servisi/ITMDBParametri.js";
import { validirajFilm } from "./validacija/validacijaPolja.js";

export class TMDBklijent {
	private bazicniURL = "https://api.themoviedb.org/3";
	private bazicniUrlSlikePretrazivanje = "https://image.tmdb.org/t/p/w154/";
	private bazicniUrlSlikePozadina = "https://image.tmdb.org/t/p/w1280/";
	private bazicniUrlSlikePoster = "https://image.tmdb.org/t/p/w500/";
	private apiKljuc: string;
	constructor(apiKljuc: string) {
		this.apiKljuc = apiKljuc;
	}

	public async dohvatiFilm(id: number) {
		let resurs = "/movie/" + id;
		let odgovor = await this.obaviZahtjev(resurs);
		return JSON.parse(odgovor);
	}

	public async dohvatiVideo(id: number) {
		const resurs = `/movie/${id}/videos`;
		const odgovor = JSON.parse(await this.obaviZahtjev(resurs));
		if (Array.isArray(odgovor?.results)) return odgovor.results;
		return [];
	}

	public async dohvatiPoNazivu(
		naziv: string,
		stranica: number = 1
	): Promise<{
		stranica: number;
		filmovi: Array<{ [kljuc: string]: string }>;
		ukupnoStranica: number;
	}> {
		const resurs = "/search/movie";
		const parametri = {
			sort_by: "popularity.desc",
			include_adult: false,
			page: stranica,
			query: naziv,
		};

		const odgovor = JSON.parse(await this.obaviZahtjev(resurs, parametri)) as {
			page: number;
			results: Array<any>;
			total_pages: number;
		};

		const filmovi = odgovor.results.map((film) => ({
			tmdb_id: film.id,
			naslov: film.title,
			datum_izlaska: film.release_date,
			ocjena: film.vote_average,
			poster: this.bazicniUrlSlikePretrazivanje + film.poster_path,
		}));

		return {
			stranica: odgovor.page,
			filmovi: filmovi,
			ukupnoStranica: odgovor.total_pages,
		};
	}

	public async dohvatiPoTmdbId(id: number): Promise<ICitljvFilm> {
		const resurs = `/movie/${id}`;
		const podatci = JSON.parse(await this.obaviZahtjev(resurs));

		const film = validirajFilm(
			podatci,
			this.bazicniUrlSlikePozadina,
			this.bazicniUrlSlikePoster
		);

		return film;
	}

	public dajPocetnuPutanjuPostera(): string {
		return this.bazicniUrlSlikePoster;
	}

	public dajPocetnuPutanjuPozadine(): string {
		return this.bazicniUrlSlikePozadina;
	}

	private async obaviZahtjev(resurs: string, parametri: ITMDBParametri = {}) {
		let putanja = `${this.bazicniURL}${resurs}?api_key=${this.apiKljuc}`;

		for (let p in parametri) {
			putanja += "&" + p + "=" + parametri[p];
		}

		let odgovor = await fetch(putanja);
		if (!odgovor.ok) {
			const greska: FetchGreska = new Error();
			greska.status = odgovor.status;
			throw greska;
		}

		let rezultat = await odgovor.text();
		return rezultat;
	}
}
