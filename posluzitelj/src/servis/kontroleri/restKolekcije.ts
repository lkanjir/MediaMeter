import { PUTANJA_KORISNICI_SADRZAJ } from "../../zajednicko/putanje.js";
import { Konfiguracija } from "../../zajednicko/konfiguracija.js";
import { KolekcijaDAO } from "../dao/kolekcijaDAO.js";
import { Request, Response } from "express";
import formidable from "formidable";
import {
	IKolekcija,
	IKolekcijaSadrzaj,
} from "../../sucelja/servisi/IKolekcija.js";
import putanja from "path";
import { RWASesija } from "../../sucelja/servisi/IKorisnik.js";
import { KorisnikDAO } from "../dao/korisnikDAO.js";
import { FilmDAO } from "../dao/filmDAO.js";
import { TMDBklijent } from "../klijentTMDB.js";
import { KorisnickiSadrzajDAO } from "../dao/korisnickiSadrzajDAO.js";

const mapKolekcija = (kolekcija: IKolekcija) => {
	return {
		id: kolekcija.id,
		naziv: kolekcija.naziv,
		javna_kolekcija: kolekcija.javna_kolekcija,
		slika_putanja: kolekcija.slika_putanja,
		opis: kolekcija.opis,
	};
};

export class RestKolekcija {
	private kolekcije;
	private konfiguracija;
	private korisnici;
	private filmovi;
	private tmdb;
	private korisnickiSadrzaj;

	constructor(konf: Konfiguracija) {
		this.konfiguracija = konf;
		this.kolekcije = new KolekcijaDAO(this.konfiguracija);
		this.korisnici = new KorisnikDAO(this.konfiguracija);
		this.filmovi = new FilmDAO();
		this.tmdb = new TMDBklijent(
			this.konfiguracija.dajKonfiguraciju().tmdbApiKeyV3
		);
		this.korisnickiSadrzaj = new KorisnickiSadrzajDAO(this.konfiguracija);
	}

	public async postKolekcije(zahtjev: Request, odgovor: Response) {
		const forma = formidable({
			uploadDir: PUTANJA_KORISNICI_SADRZAJ,
			maxFiles: 1,
			maxFieldsSize: 1 * 1024 * 1024,
			keepExtensions: true,
		});

		forma.parse(zahtjev, async (greska, poljaForme, datoteke) => {
			if (greska) {
				odgovor.status(400).json({ greska: "greska u prijenosu datoteke" });
				return;
			}

			const slike = datoteke["slika"];
			let slika;
			if (Array.isArray(slike) && slike.length > 0) slika = slike[0];

			if (!slika) {
				odgovor
					.status(400)
					.json({ greska: "datoteka nije prenesena, a obavezna je" });
				return;
			}

			const naziv = String(poljaForme["naziv"] || "").trim();
			const javnaStr = String(poljaForme["javna"] || "");
			const javnaInt = !Number.isNaN(parseInt(javnaStr))
				? parseInt(javnaStr)
				: 0;
			const opis = String(poljaForme["opis"] || "").trim();

			const relativnaPutanja = putanja.join(
				"sadrzaj",
				putanja.basename(slika.filepath)
			);

			const kolekcija: IKolekcija = {
				naziv: naziv,
				javna_kolekcija: javnaInt,
				slika_putanja: relativnaPutanja,
				opis: opis,
			};

			const rezultat = await this.kolekcije.kreiraj(kolekcija);
			if (rezultat && rezultat > 0) {
				odgovor.status(201).json({ status: "uspjeh" });
				return;
			} else
				odgovor.status(500).json({ greska: "neuspjesno kreiranje kolekcije" });
		});
	}

	public async getKolekcije(zahtjev: Request, odgovor: Response) {
		const stranica = parseInt(zahtjev.query["stranica"] as string);
		const stranicaInt = Number.isNaN(stranica) || stranica < 1 ? 1 : stranica;

		const podatciStranice = await this.kolekcije.dajStranicu(stranicaInt);

		const stvarnoTrazenaStranica =
			stranicaInt > podatciStranice.ukupnoStranica
				? podatciStranice.ukupnoStranica
				: stranicaInt;

		let rezultat = podatciStranice;
		if (stvarnoTrazenaStranica == stranicaInt) rezultat = podatciStranice;
		else await this.kolekcije.dajStranicu(stvarnoTrazenaStranica);

		odgovor.json({
			kolekcije: rezultat.kolekcije,
			stranica: stvarnoTrazenaStranica,
			ukupnoStranica: rezultat.ukupnoStranica,
		});
	}

	public async getClanove(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(id) || id < 1) {
			odgovor.status(400).json({ greska: "neispravan id" });
			return;
		}

		const stranica = parseInt(zahtjev.query["stranica"] as string);
		const stranicaInt = Number.isNaN(stranica) || stranica < 1 ? 1 : stranica;

		const kolekcija = await this.kolekcije.dajPoId(id);
		if (!kolekcija) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const { korisnici, ukupnoStranica } =
			await this.kolekcije.dajKorisnikeKolekcije(id, stranicaInt);

		odgovor.status(200).json({
			clanovi: korisnici,
			stranica: stranicaInt,
			ukupnoStranica: ukupnoStranica,
		});
	}

	public async dodajClana(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(id) || id < 1) {
			odgovor.status(400).json({ greska: "neispravan id" });
			return;
		}

		const korime = (zahtjev.body?.korime ?? "").trim();
		if (!korime) {
			odgovor.status(400).json({ greska: "nedostaje korisnicko ime" });
			return;
		}

		const ulogaId = parseInt(zahtjev.body?.uloga_id ?? 1);
		if (Number.isNaN(ulogaId) || (ulogaId < 1 && ulogaId > 2)) {
			odgovor.status(400).json({ greska: "neispravna uloga" });
			return;
		}

		const kolekcija = await this.kolekcije.dajPoId(id);
		if (!kolekcija) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const korisnikId = await this.korisnici.dajIdPoKorime(korime);
		if (!korisnikId) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const jeUKolekciji = await this.kolekcije.jeKorisnikUKolekciji(id, korime);
		if (jeUKolekciji) {
			odgovor.status(400).json({ greska: "korisnik je već u kolekcji" });
			return;
		}

		await this.kolekcije.dodajKorisnikaUKolekciju(id, korisnikId, ulogaId);
		odgovor.status(201).json({ status: "uspjeh" });
	}

	public async obrisiClana(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");

		if (Number.isNaN(id) || id < 1) {
			odgovor.status(400).json({ greska: "neispravan id" });
			return;
		}

		const korime = (zahtjev.params["korime"] as string).trim();
		if (!korime) {
			odgovor.status(400).json({ greska: "nedostaje korisnicko ime" });
			return;
		}

		const korisnikId = await this.korisnici.dajIdPoKorime(korime);
		if (!korisnikId) {
			odgovor.status(404).json({ greska: "nepostojeci resurs" });
			return;
		}

		await this.kolekcije.obrisiKorisnikaIzKolekcije(id, korisnikId);
		odgovor.status(201).json({ status: "uspjeh" });
	}

	private async mozeUpravljatiKolekcijom(
		kolekcijaId: number,
		sesija?: RWASesija
	): Promise<boolean> {
		const jeModeratorIliAdmin = (sesija?.tipKorisnikaId ?? 0) >= 2;
		if (jeModeratorIliAdmin) return true;
		if (!sesija?.korime) return false;

		const uloga = await this.kolekcije.dajUloguKorisnika(
			kolekcijaId,
			sesija.korime
		);

		return !!uloga;
	}

	public async getMojeKolekcije(zahtjev: Request, odgovor: Response) {
		const sesija = zahtjev.session as RWASesija | undefined;
		if (!sesija?.korime) {
			odgovor.status(401).json({ greska: "potrebna prijava" });
			return;
		}

		const kolekcije = await this.kolekcije.dajKolekcijeZaKorisnika(
			sesija.korime
		);

		odgovor.status(200).json({ kolekcije });
	}

	public async getSadrzajKolekcije(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(id) || id < 1) {
			odgovor.status(400).json({ greska: "neispravan id" });
			return;
		}

		const kolekcija = await this.kolekcije.dajPoId(id);
		if (!kolekcija) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const sesija = zahtjev.session as RWASesija | undefined;
		const jeModeratorIliAdmin = (sesija?.tipKorisnikaId ?? 0) >= 2;
		const jeClan = sesija?.korime
			? await this.kolekcije.jeKorisnikUKolekciji(id, sesija.korime)
			: false;
		const jeJavna = kolekcija.javna_kolekcija == 1;

		if (!jeJavna && !jeModeratorIliAdmin && !jeClan) {
			odgovor.status(403).json("zabranjen pristup");
			return;
		}

		const sadrzaj: Array<IKolekcijaSadrzaj> =
			await this.kolekcije.dajSadrzajKolekcije(id);
		odgovor
			.status(200)
			.json({ kolekcija: mapKolekcija(kolekcija), sadrzaj: sadrzaj });
	}

	public async postSadrzajUKolekciju(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(id) || id < 1) {
			odgovor.status(400).json({ greska: "neispravan id kolekcije" });
			return;
		}

		const tmdbId = parseInt(zahtjev.body?.tmdb_id ?? "");
		if (Number.isNaN(tmdbId) || tmdbId < 1) {
			odgovor.status(400).json({ greska: "nedostaje tmdb_id" });
			return;
		}

		const javni = zahtjev.body?.javni_sadrzaj ? 1 : 0;
		const kolekcija = await this.kolekcije.dajPoId(id);
		if (!kolekcija) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const sesija = zahtjev.session as RWASesija | undefined;
		const ovlasten = await this.mozeUpravljatiKolekcijom(id, sesija);
		if (!ovlasten) {
			odgovor.status(403).json({ greska: "zabranjen pristup" });
			return;
		}

		let filmTmdb: any;
		try {
			filmTmdb = await this.tmdb.dohvatiFilm(tmdbId);
		} catch (e) {
			odgovor
				.status(500)
				.json({ greska: "greska u komunikaciji s TMDB serviosm" });
			return;
		}

		let videozapisi = new Array<any>();
		videozapisi = await this.tmdb.dohvatiVideo(tmdbId);
		const youtube = videozapisi.find(
			(video) => String(video?.site || "").toLowerCase() == "youtube"
		);

		const youtubeKljuc = youtube?.key ?? null;
		const posterUrl = filmTmdb?.poster_path
			? this.tmdb.dajPocetnuPutanjuPostera() + filmTmdb.poster_path
			: null;
		const pozadinaUrl = filmTmdb?.backdrop_path
			? this.tmdb.dajPocetnuPutanjuPozadine() + filmTmdb.backdrop_path
			: null;
		const videoUrl = youtubeKljuc
			? `https://www.youtube.com/embed/${youtubeKljuc}`
			: null;

		const filmId = await this.filmovi.spremiIzTmdb(filmTmdb, {
			posterUrl: posterUrl,
			pozadinaUrl: pozadinaUrl,
			videoUrl: videoUrl,
			youtubeKljuc: youtubeKljuc,
		});

		const jeVecDodan = await this.kolekcije.jeFilmUKolekciji(id, filmId);
		if (jeVecDodan) {
			odgovor.status(400).json({ greska: "film već postoji u kolekciji" });
			return;
		}

		await this.kolekcije.dodajSadrzajUKolekciju(id, filmId, javni);
		odgovor.status(201).json({ status: "uspjeh" });
	}

	public async postSadrzajLokalni(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(id) || id < 1) {
			odgovor.status(400).json({ greska: "neispravan id" });
			return;
		}

		const sesija = zahtjev.session as RWASesija | undefined;
		const ovlasten = await this.mozeUpravljatiKolekcijom(id, sesija);
		if (!ovlasten) {
			odgovor.status(403).json({ greska: "zabranjen pristup" });
			return;
		}

		const naslov: string = (zahtjev.body?.naslov ?? "").trim();
		if (!naslov) {
			odgovor.status(400).json({ greska: "naslov je obavezan" });
			return;
		}

		const godina = (zahtjev.body?.godina ?? "").trim();
		const opis = (zahtjev.body?.opis ?? "").trim();
		const trajanje = parseInt(zahtjev.body?.trajanje ?? "");
		const ocjena = parseFloat(zahtjev.body?.ocjena ?? "");

		let filmId: number;
		try {
			const podatciFilm: {
				naslov: string;
				opis?: string;
				datum_izlaska?: string;
				trajanje_min?: number;
				ocjena?: number;
			} = { naslov };

			if (opis) podatciFilm.opis = opis;
			if (godina) podatciFilm.datum_izlaska = godina;
			if (Number.isFinite(trajanje)) podatciFilm.trajanje_min = trajanje;
			if (Number.isFinite(ocjena)) podatciFilm.ocjena = ocjena;

			filmId = await this.filmovi.spremiLokalni(podatciFilm);
		} catch {
			odgovor.status(500).json({ greska: "spremanje nije uspjelo" });
			return;
		}

		await this.kolekcije.dodajSadrzajUKolekciju(
			id,
			filmId,
			zahtjev.body?.javni_sadrzaj ? 1 : 0
		);

		odgovor.status(201).json({ status: "uspjeh" });
	}

	public async patchJavniSadrzaj(zahtjev: Request, odgovor: Response) {
		const kolekcijaId = parseInt(zahtjev.params["id"] || "");
		const filmId = parseInt(zahtjev.params["filmId"] || "");
		if (Number.isNaN(kolekcijaId) || Number.isNaN(filmId)) {
			odgovor.status(400).json({ greska: "neispravni parametri" });
			return;
		}

		const sesija = zahtjev.session as RWASesija | undefined;
		const ovlasten = await this.mozeUpravljatiKolekcijom(kolekcijaId, sesija);
		if (!ovlasten) {
			odgovor.status(403).json({ greska: "zabranjen pristup" });
			return;
		}

		const javni = zahtjev.body?.javni_sadrzaj ? 1 : 0;
		await this.kolekcije.azurirajJavniStatusSadrzaja(
			kolekcijaId,
			filmId,
			javni
		);

		odgovor.status(201).json({ status: "uspjeh" });
	}

	public async deleteSadrzaj(zahtjev: Request, odgovor: Response) {
		const kolekciaId = parseInt(zahtjev.params["id"] || "");
		const filmId = parseInt(zahtjev.params["filmId"] || "");
		if (Number.isNaN(kolekciaId) || Number.isNaN(filmId)) {
			odgovor.status(400).json({ greska: "neispravni parametri" });
			return;
		}

		const sesija = zahtjev.session as RWASesija | undefined;
		const ovlasten = await this.mozeUpravljatiKolekcijom(kolekciaId, sesija);
		if (!ovlasten) {
			odgovor.status(403).json({ greska: "zabranjen pristup" });
			return;
		}

		await this.kolekcije.obrisiSadrzajIzKolekcije(kolekciaId, filmId);
		odgovor.status(200).json({ status: "uspjeh" });
	}

	public async putKolekcija(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(id) || id < 1) {
			odgovor.status(400).json({ greska: "neispravan id" });
			return;
		}

		const sesija = zahtjev.session as RWASesija | undefined;
		const ovlasten = await this.mozeUpravljatiKolekcijom(id, sesija);
		if (!ovlasten) {
			odgovor.status(403).json({ greska: "zabranjen pristup" });
			return;
		}

		const forma = formidable({
			uploadDir: PUTANJA_KORISNICI_SADRZAJ,
			maxFiles: 1,
			maxFileSize: 1 * 1024 * 1024,
			keepExtensions: true,
		});

		forma.parse(zahtjev, async (greska, polja, datoteke) => {
			if (greska) {
				odgovor.status(400).json({ greska: "greska u prijenosu datoteke" });
				return;
			}

			const podaci: Partial<IKolekcija> = {};
			if (polja["javna"] != undefined) {
				const javnaStr = String(polja["javna"]);
				podaci.javna_kolekcija = parseInt(javnaStr) ? 1 : 0;
			}

			if (polja["naziv"] != undefined)
				podaci.naziv = String(polja["naziv"]).trim();

			if (polja["opis"] != undefined)
				podaci.opis = String(polja["opis"]).trim();

			const slike = datoteke["slika"];
			let slika;
			if (Array.isArray(slike) && slike.length > 0) slika = slike[0];
			if (slika) {
				podaci.slika_putanja = putanja.join(
					"sadrzaj",
					putanja.basename(slika.filepath)
				);
			}

			await this.kolekcije.azurirajDjelomicno(id, podaci);
			odgovor.status(201).json({ status: "uspjeh" });
		});
	}

	public async getJavne(zahtjev: Request, odgovor: Response) {
		const stranica = parseInt(zahtjev.query["stranica"] as string);
		const stranicaInt = Number.isNaN(stranica) || stranica < 1 ? 1 : stranica;

		const podatciStranice = await this.kolekcije.dajJavneStranica(stranicaInt);
		const stvarnoTrazena =
			stranicaInt > podatciStranice.ukupnoStranica
				? podatciStranice.ukupnoStranica
				: stranicaInt;

		let rezultat = podatciStranice;
		if (stvarnoTrazena != stranicaInt) {
			rezultat = await this.kolekcije.dajJavneStranica(stvarnoTrazena);
		}

		odgovor.json({
			kolekcije: rezultat.kolekcije,
			stranica: stvarnoTrazena,
			ukupnoStranica: rezultat.ukupnoStranica,
		});
	}

	public async getJavniSadrzaj(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(id) || id < 1) {
			odgovor.status(400).json({ greska: "neispravan id" });
			return;
		}

		const kolekcija = await this.kolekcije.dajPoId(id);
		if (!kolekcija || kolekcija.javna_kolekcija != 1) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const sadrzaj = await this.kolekcije.dajJavniSadrzajKolekcije(id);
		odgovor.status(200).json({ kolekcija: mapKolekcija(kolekcija), sadrzaj });
	}

	public async postMultimedijaZaFilm(zahtjev: Request, odgovor: Response) {
		const kolekciaId = parseInt(zahtjev.params["id"] || "");
		const filmId = parseInt(zahtjev.params["filmId"] || "");
		if (Number.isNaN(kolekciaId) || Number.isNaN(filmId)) {
			odgovor.status(400).json({ greska: "neispravni parametri" });
			return;
		}

		const ovlasten = await this.mozeUpravljatiKolekcijom(
			kolekciaId,
			zahtjev.session as RWASesija | undefined
		);

		if (!ovlasten) {
			odgovor.status(403).json({ greska: "zabranjen pristup" });
			return;
		}

		const jeFilmUkolekciji = await this.kolekcije.jeFilmUKolekciji(
			kolekciaId,
			filmId
		);

		if (!jeFilmUkolekciji) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const forma = formidable({
			uploadDir: PUTANJA_KORISNICI_SADRZAJ,
			maxFiles: 1,
			maxFileSize: 1 * 1024 * 1024,
			keepExtensions: true,
		});

		forma.parse(zahtjev, async (greska, polja, datoteke) => {
			if (greska) {
				odgovor.status(400).json({ greska: "greska pri prijenosu datoteke" });
				return;
			}

			const tip = String(polja["tip"] || "")
				.trim()
				.toLocaleLowerCase();
			if (tip != "slika" && tip != "video") {
				odgovor
					.status(400)
					.json({ greska: `tip mora biti "slika" ili "video"` });
				return;
			}

			const sadrzaj = datoteke["datoteka"];
			let datoteka;
			if (Array.isArray(sadrzaj) && sadrzaj.length > 0) datoteka = sadrzaj[0];
			if (!datoteka) {
				odgovor.status(400).json({ greska: "datoteka je obavezna" });
				return;
			}

			const relativnaPutanja = putanja.join(
				"sadrzaj",
				putanja.basename(datoteka.filepath)
			);

			try {
				await this.filmovi.spremiLokalnuMultimediju({
					filmId,
					putanja: relativnaPutanja,
					naziv: String(polja["naziv"] || "") || null,
					tip,
					velicina: datoteka.size ?? null,
					privatan: polja["privatan"] ? 1 : 0,
				});
				odgovor.status(201).json({ status: "uspjeh" });
			} catch {
				odgovor.status(500).json({ greska: "Spremanje nije uspjelo" });
			}
		});
	}

	public async postPoveziMojSadrzaj(zahtjev: Request, odgovor: Response) {
		const kolekcijaId = parseInt(zahtjev.params["id"] || "");
		const filmId = parseInt(zahtjev.params["filmId"] || "");
		const sadrzajId = parseInt(zahtjev.body?.sadrzaj_id ?? "");

		if (
			Number.isNaN(kolekcijaId) ||
			Number.isNaN(filmId) ||
			Number.isNaN(sadrzajId)
		) {
			odgovor.status(400).json({ greska: "neispravni parametri" });
			return;
		}

		const sesija = zahtjev.session as RWASesija | undefined;

		if (!sesija?.korime) {
			odgovor.status(401).json({ greska: "potrebna prijava" });
			return;
		}

		const ovlasten = await this.mozeUpravljatiKolekcijom(kolekcijaId, sesija);
		if (!ovlasten) {
			odgovor.status(403).json({ greska: "zabranjen pristup" });
			return;
		}

		const jeUKolekciji = await this.kolekcije.jeFilmUKolekciji(
			kolekcijaId,
			filmId
		);

		if (!jeUKolekciji) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const korisnikId = await this.korisnici.dajIdPoKorime(sesija.korime);
		if (!korisnikId) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const sadrzaj = await this.korisnickiSadrzaj.dajZaKorisnikaPoId(
			korisnikId,
			sadrzajId
		);
		if (!sadrzaj) {
			odgovor.status(404).json({ greska: "nepostojeći sadržaj" });
			return;
		}

		await this.filmovi.poveziPostojecuMultimediju(filmId, sadrzajId);
		odgovor.status(201).json({ status: "uspjeh" });
	}

	public async deleteKolekcija(zahtjev: Request, odgovor: Response) {
		const id = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(id) || id < 1) {
			odgovor.status(400).json({ greska: "neispravan id" });
			return;
		}

		const kolekcija = await this.kolekcije.dajPoId(id);
		if (!kolekcija) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		await this.kolekcije.obrisi(id);
		odgovor.status(200).json({ status: "uspjeh" });
	}
}
