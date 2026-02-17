import { ICitljvFilm } from "../../sucelja/servisi/IFilm.js";

const NEMA = "Nema podatka";

function validirajTekst(
	vrijednost: unknown,
	osnovnaVrijednost: string
): string {
	if (typeof vrijednost == "string" && vrijednost.trim().length > 0)
		return vrijednost.trim();

	return osnovnaVrijednost;
}

function validirajNazive(
	vrijednost: unknown,
	osnovnaVrijednost: string
): Array<string> {
	if (Array.isArray(vrijednost)) {
		const nazivi = vrijednost
			.map((element) =>
				element && typeof element.name == "string" ? element.name.trim() : ""
			)
			.filter((naziv) => naziv.length > 0);

		if (nazivi.length > 0) return nazivi;
	}

	return [osnovnaVrijednost];
}

function validirajBrojeve(vrijednost: unknown): number | null {
	if (typeof vrijednost == "number" && Number.isFinite(vrijednost))
		return vrijednost;

	return null;
}

function validirajSliku(putanja: unknown, bazicnaPutanja: string): string {
	if (typeof putanja == "string" && putanja.trim().length > 0)
		return bazicnaPutanja + putanja;
	return "";
}

function validirajuGodinu(vrijednost: unknown): string {
	if (typeof vrijednost == "string" && vrijednost.split("-").length == 3) {
		const [godina, _, __] = vrijednost.split("-");
		return godina &&
			parseInt(godina || "") > 1895 &&
			parseInt(godina || "") < 2050
			? godina
			: NEMA;
	}
	return NEMA;
}

function validirajTrajanje(vrijednost: unknown): string {
	const broj = validirajBrojeve(vrijednost);
	return broj && broj > 0 ? `${broj} min` : NEMA;
}

function validirajOcjenu(vrijednost: unknown): string {
	const broj = validirajBrojeve(vrijednost);
	return broj ? broj.toFixed(1) : NEMA;
}

function validirajBudzet(vrijednost: unknown): string {
	const broj = validirajBrojeve(vrijednost);
	return broj && broj > 0 ? `$${broj / 1000_000}M` : NEMA;
}

export function validirajFilm(
	film: { [kljuc: string]: any },
	bazicnaPutanjaPozadina: string,
	bazicnaPutanjaPoster: string
): ICitljvFilm {
	return {
		tmdb_id: typeof film?.["id"] == "number" ? film["id"] : null,
		naslov: validirajTekst(film?.["title"], "Nema naslova."),
		budzet: validirajBudzet(film?.["budget"]),
		zanrovi: validirajNazive(film?.["genres"], "Nema žanrova."),
		opis: validirajTekst(film?.["overview"], "Nema opisa."),
		pozadina: validirajSliku(film?.["backdrop_path"], bazicnaPutanjaPozadina),
		poster: validirajSliku(film?.["poster_path"], bazicnaPutanjaPoster),
		kompanije: validirajNazive(
			film?.["production_companies"],
			"Nema komanija."
		),
		godina_izlaska: validirajuGodinu(film?.["release_date"]),
		trajanje: validirajTrajanje(film?.["runtime"]),
		slogan: validirajTekst(film?.["tagline"], "Nema slogana."),
		ocjena: validirajOcjenu(film?.["vote_average"]),
	};
}
