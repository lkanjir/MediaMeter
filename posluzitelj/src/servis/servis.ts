import { RestKorisnik } from "./kontroleri/restKorisnik.js";
import { RestTMDB } from "./kontroleri/restTMDB.js";
import { Konfiguracija } from "../zajednicko/konfiguracija.js";
import { Application } from "express";
import { RestSpolovi } from "./kontroleri/restSpolovi.js";
import { potrebnaPrava, Prava } from "./upraviteljPrava.js";
import ds from "fs";
import { PUTANJA_KORISNICI_SADRZAJ } from "../zajednicko/putanje.js";
import { RestKolekcija } from "./kontroleri/restKolekcije.js";
import { RestFilmovi } from "./kontroleri/restFilmovi.js";
import { RestSadrzaj } from "./kontroleri/restSadrzaj.js";

export function pripremiPutanjeResursTMDB(
	server: Application,
	konf: Konfiguracija
) {
	let restTMDB = new RestTMDB(konf.dajKonfiguraciju()["tmdbApiKeyV3"]);
	server.get(
		"/api/tmdb/filmovi",
		potrebnaPrava(Prava.registrirani),
		restTMDB.dohvatiPoNazivu.bind(restTMDB)
	);

	server.get(
		"/api/tmdb/filmovi/:id",
		potrebnaPrava(Prava.registrirani),
		restTMDB.dohvatiPoTmdbId.bind(restTMDB)
	);
}

export function pripremiPutanjeResursaSpolova(
	server: Application,
	konf: Konfiguracija
) {
	let restSpol = new RestSpolovi();
	server.get("/api/javno/spolovi", restSpol.getSpolovi.bind(restSpol));
}

export function pripremiPutanjeResursFilmova(server: Application) {
	const restFilmovi = new RestFilmovi();
	server.get(
		"/api/filmovi/lokalni/:id",
		potrebnaPrava(Prava.registrirani),
		restFilmovi.getLokalni.bind(restFilmovi)
	);
}

export function PripremiPutanjeResursaKolekcija(
	server: Application,
	konf: Konfiguracija
) {
	const restKolekcija = new RestKolekcija(konf);

	server.post(
		"/api/kolekcije",
		potrebnaPrava(Prava.moderator),
		restKolekcija.postKolekcije.bind(restKolekcija)
	);

	server.get(
		"/api/kolekcije/",
		potrebnaPrava(Prava.moderator),
		restKolekcija.getKolekcije.bind(restKolekcija)
	);

	server.get(
		"/api/kolekcije/:id/korisnici",
		potrebnaPrava(Prava.moderator),
		restKolekcija.getClanove.bind(restKolekcija)
	);

	server.post(
		"/api/kolekcije/:id/korisnici",
		potrebnaPrava(Prava.moderator),
		restKolekcija.dodajClana.bind(restKolekcija)
	);

	server.delete(
		"/api/kolekcije/:id/korisnici/:korime",
		potrebnaPrava(Prava.moderator),
		restKolekcija.obrisiClana.bind(restKolekcija)
	);

	server.get(
		"/api/korisnici/moje-kolekcije",
		potrebnaPrava(Prava.registrirani),
		restKolekcija.getMojeKolekcije.bind(restKolekcija)
	);

	server.get(
		"/api/kolekcije/:id/sadrzaj",
		potrebnaPrava(Prava.registrirani),
		restKolekcija.getSadrzajKolekcije.bind(restKolekcija)
	);

	server.post(
		"/api/kolekcije/:id/sadrzaj",
		potrebnaPrava(Prava.registrirani),
		restKolekcija.postSadrzajUKolekciju.bind(restKolekcija)
	);

	server.patch(
		"/api/kolekcije/:id/sadrzaj/:filmId",
		potrebnaPrava(Prava.registrirani),
		restKolekcija.patchJavniSadrzaj.bind(restKolekcija)
	);

	server.delete(
		"/api/kolekcije/:id/sadrzaj/:filmId",
		potrebnaPrava(Prava.registrirani),
		restKolekcija.deleteSadrzaj.bind(restKolekcija)
	);

	server.put(
		"/api/kolekcije/:id",
		potrebnaPrava(Prava.registrirani),
		restKolekcija.putKolekcija.bind(restKolekcija)
	);

	server.post(
		"/api/kolekcije/:id/sadrzaj/lokalni",
		potrebnaPrava(Prava.registrirani),
		restKolekcija.postSadrzajLokalni.bind(restKolekcija)
	);

	server.get(
		"/api/javno/kolekcije",
		restKolekcija.getJavne.bind(restKolekcija)
	);

	server.get(
		"/api/javno/kolekcije/:id/sadrzaj",
		restKolekcija.getJavniSadrzaj.bind(restKolekcija)
	);

	server.post(
		"/api/kolekcije/:id/sadrzaj/:filmId/multimedija",
		potrebnaPrava(Prava.registrirani),
		restKolekcija.postMultimedijaZaFilm.bind(restKolekcija)
	);

	server.post(
		"/api/kolekcije/:id/sadrzaj/:filmId/povezi",
		potrebnaPrava(Prava.registrirani),
		restKolekcija.postPoveziMojSadrzaj.bind(restKolekcija)
	);

	server.delete(
		"/api/kolekcije/:id",
		potrebnaPrava(Prava.moderator),
		restKolekcija.deleteKolekcija.bind(restKolekcija)
	);
}

export function pripremiPutanjeResursaKorisnickogSadrzaja(
	server: Application,
	konf: Konfiguracija
) {
	const restSadrzaj = new RestSadrzaj(konf);

	server.get(
		"/api/korisnici/javni-sadrzaj",
		potrebnaPrava(Prava.registrirani),
		restSadrzaj.getJavni.bind(restSadrzaj)
	);

	server.get(
		"/api/korisnici/javni-sadrzaj/autori",
		potrebnaPrava(Prava.registrirani),
		restSadrzaj.getAutori.bind(restSadrzaj)
	);

	server.get(
		"/api/korisnici/moj-sadrzaj",
		potrebnaPrava(Prava.registrirani),
		restSadrzaj.getMoji.bind(restSadrzaj)
	);

	server.post(
		"/api/korisnici/moj-sadrzaj",
		potrebnaPrava(Prava.registrirani),
		restSadrzaj.postMoj.bind(restSadrzaj)
	);

	server.patch(
		"/api/korisnici/moj-sadrzaj/:id",
		potrebnaPrava(Prava.registrirani),
		restSadrzaj.patchVidljivost.bind(restSadrzaj)
	);
}

export function pripremiPutanjeResursKorisnika(
	server: Application,
	konf: Konfiguracija
) {
	let restKorisnik = new RestKorisnik(konf);

	server.get(
		"/api/javno/korisnici/aktivacija",
		restKorisnik.aktivirajKorisnika.bind(restKorisnik)
	);

	server.get("/api/javno/sesija", restKorisnik.getSesija.bind(restKorisnik));

	server.post(
		"/api/javno/korisnici/odjava",
		restKorisnik.odjaviKorisnika.bind(restKorisnik)
	);

	server.get(
		"/api/korisnici",
		potrebnaPrava(Prava.admin),
		restKorisnik.getKorisnici.bind(restKorisnik)
	);

	server.post(
		"/api/javno/korisnici/prijava",
		restKorisnik.prijaviKorisnika.bind(restKorisnik)
	);

	server.post(
		"/api/javno/korisnici/registracija",
		restKorisnik.registrirajKorisnika.bind(restKorisnik)
	);

	server.post(
		"/api/korisnici/:korime/blokiraj",
		potrebnaPrava(Prava.admin),

		restKorisnik.blokirajKorisnika.bind(restKorisnik)
	);

	server.post(
		"/api/korisnici/:korime/odblokiraj",
		potrebnaPrava(Prava.admin),
		restKorisnik.odblokirajKorisnika.bind(restKorisnik)
	);

	server.post(
		"/api/korisnici/:korime/uloga",
		potrebnaPrava(Prava.admin),
		restKorisnik.postaviUloguKorisnika.bind(restKorisnik)
	);
}

export function pripremiDirektorijMultimedije() {
	if (!ds.existsSync(PUTANJA_KORISNICI_SADRZAJ))
		ds.mkdirSync(PUTANJA_KORISNICI_SADRZAJ);
}
