import { TMDBklijent } from "../klijentTMDB.js";
import { Request, Response } from "express";

export class RestTMDB {
	private tmdbKlijent: TMDBklijent;

	constructor(api_kljuc: string) {
		this.tmdbKlijent = new TMDBklijent(api_kljuc);
		console.log(api_kljuc);

		this.tmdbKlijent
			.dohvatiFilm(500)
			.then((podaci: any) => {
				if (podaci.status_code == 7) {
					console.log("Servis TMDB ne vraća podatke. Provjerite API ključ!");
				} else {
					console.log("Servis TMDB vraća podatke!");
				}
			})
			.catch(console.log);
	}

	public async dohvatiPoNazivu(zahtjev: Request, odgovor: Response) {
		const naziv = zahtjev.query["naziv"] as string;
		const str = parseInt(zahtjev.query["stranica"] as string);

		const stranica = Number.isNaN(str) || str < 1 ? 1 : str;

		const podatci = await this.tmdbKlijent.dohvatiPoNazivu(naziv, stranica);

		odgovor.json(podatci);
	}

	public async dohvatiPoTmdbId(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(id) || id < 0) {
			odgovor.status(400).json({ greska: "neispravan id filma" });
			return;
		}

		try {
			const film = await this.tmdbKlijent.dohvatiPoTmdbId(id);
			return odgovor.status(200).json(film);
		} catch (e: any) {
			if (e.status == 404) {
				odgovor.status(404).json({ greska: "nepostojeći resurs" });
				return;
			}
			return odgovor
				.status(500)
				.json({ greska: "greksa u komunikaciji s TMDB servisom" });
		}
	}
}
