import { FilmDAO } from "../dao/filmDAO.js";
import { Request, Response } from "express";

export class RestFilmovi {
	private filmovi: FilmDAO;

	constructor() {
		this.filmovi = new FilmDAO();
	}

	public async getLokalni(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(id) || id < 1) {
			odgovor.status(400).json({ greska: "neispravan id filma" });
			return;
		}

		const film = await this.filmovi.dajPoId(id);
		if (!film) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const multimedija = await this.filmovi.dajMultimediju(id);
		odgovor.status(200).json({ ...film, multimedija });
	}
}
