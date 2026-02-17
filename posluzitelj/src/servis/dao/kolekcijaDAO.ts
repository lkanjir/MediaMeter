import { IMultimedija } from "../../sucelja/servisi/IFilm.js";
import {
	IKolekcija,
	IKolekcijaSadrzaj,
	IKorisnikKolekcija,
} from "../../sucelja/servisi/IKolekcija.js";
import { Konfiguracija } from "../../zajednicko/konfiguracija.js";
import Baza from "../../zajednicko/sqliteBaza.js";

type Red = { [k: string]: any };

const mapKolekcija = (red: Red): IKolekcija => ({
	id: Number(red["id"]),
	naziv: red["naziv"],
	javna_kolekcija: red["javna_kolekcija"] ? 1 : 0,
	slika_putanja: red["slika_putanja"] ?? null,
	opis: red["opis"] ?? null,
});

const mapMultimedija = (red: Red): IMultimedija => ({
	id: Number(red["sadrzaj_id"]),
	putanja: red["putanja"],
	naziv: red["naziv_sadrzaja"] ?? null,
	tip: red["tip_sadrzaja_id"],
	youtube_kljuc: red["youtube_kljuc"] ?? null,
	privatan: Number(red["privatan"] ?? 0),
	lokalni_sadrzaj: Number(red["lokalni_sadrzaj"] ?? 0),
	velicina_bajt:
		red["velicina_bajt"] == null ? null : Number(red["velicina_bajt"]),
});

export class KolekcijaDAO {
	private baza: Baza;
	private bazaSpremna: Promise<void>;
	private konfiguracija: Konfiguracija;

	constructor(konf: Konfiguracija) {
		this.baza = new Baza("podaci/RWA2025lkanjir23.sqlite");
		this.bazaSpremna = this.baza.spoji();
		this.konfiguracija = konf;
	}

	public async dajStranicu(
		stranica: number
	): Promise<{ kolekcije: Array<IKolekcija>; ukupnoStranica: number }> {
		await this.bazaSpremna;
		const poStranici = parseInt(
			this.konfiguracija.dajKonfiguraciju().stranicaLimit
		);
		const kreniOd = Math.max(0, (stranica - 1) * poStranici);

		const [redovi, bazaUkupno] = await Promise.all([
			this.baza.dajSve<Red>(
				`SELECT * FROM kolekcija ORDER BY id LIMIT ? OFFSET ?`,
				[poStranici, kreniOd]
			),
			this.baza.dajJedan<{ ukupno: number }>(
				`SELECT COUNT(id) AS ukupno FROM kolekcija`
			),
		]);

		let ukupno = 0;
		if (bazaUkupno) ukupno = bazaUkupno.ukupno;

		return {
			kolekcije: redovi.map(mapKolekcija),
			ukupnoStranica: Math.max(1, Math.ceil(ukupno / poStranici)),
		};
	}

	public async dajPoId(idKolekcije: number): Promise<IKolekcija | null> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<Red>(
			`SELECT * FROM kolekcija WHERE id = ?`,
			[idKolekcije]
		);

		return red ? mapKolekcija(red) : null;
	}

	public async dajKolekcijeZaKorisnika(
		korime: string
	): Promise<Array<IKolekcija & { uloga_id: number }>> {
		await this.bazaSpremna;
		const redovi = await this.baza.dajSve<Red>(
			`SELECT k.*, kk.uloga_id
			FROm korisnik_kolekcija kk
			JOIN korisnik ko ON ko.id = kk.korisnik_id
			JOIN kolekcija k ON k.id == kk.kolekcija_id
			WHERE lower(ko.korime) = lower(?)
			ORDER BY k.naziv`,
			[korime]
		);

		return redovi.map((red) => ({
			...mapKolekcija(red),
			uloga_id: Number(red["uloga_id"] ?? 2),
		}));
	}

	public async kreiraj(kolekcija: IKolekcija): Promise<number | null> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`INSERT INTO kolekcija (naziv, javna_kolekcija, slika_putanja, opis)
            VALUES (?, ?, ?, ?)`,
			[
				kolekcija.naziv,
				kolekcija.javna_kolekcija ? 1 : 0,
				kolekcija.slika_putanja ?? null,
				kolekcija.opis ?? null,
			]
		);

		const red = await this.baza.dajJedan<{ id: number }>(
			`SELECT last_insert_rowid() as id`
		);
		return red?.id ?? null;
	}

	public async azurirajDjelomicno(
		id: number,
		polja: Partial<IKolekcija>
	): Promise<void> {
		await this.bazaSpremna;

		const dijelovi = new Array<string>();
		const vrijednosti = new Array<string | number | null>();

		if (polja.naziv !== undefined) {
			dijelovi.push("naziv = ?");
			vrijednosti.push(polja.naziv);
		}
		if (polja.javna_kolekcija !== undefined) {
			dijelovi.push("javna_kolekcija = ?");
			vrijednosti.push(polja.javna_kolekcija ? 1 : 0);
		}
		if (polja.slika_putanja !== undefined) {
			dijelovi.push("slika_putanja = ?");
			vrijednosti.push(polja.slika_putanja);
		}
		if (polja.opis !== undefined) {
			dijelovi.push("opis = ?");
			vrijednosti.push(polja.opis);
		}

		if (!dijelovi.length) return;

		await this.baza.izvrsi(
			`UPDATE kolekcija SET ${dijelovi.join(",")} WHERE id = ?`,
			[...vrijednosti, id]
		);
	}

	public async obrisi(id: number): Promise<void> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`DELETE FROM korisnik_kolekcija WHERE kolekcija_id = ?`,
			[id]
		);

		await this.baza.izvrsi(
			`DELETE FROM sadrzaj_kolekcije WHERE kolekcija_id = ?`,
			[id]
		);
		await this.baza.izvrsi(`DELETE FROM kolekcija WHERE id = ?`, [id]);
	}

	public async dodajKorisnikaUKolekciju(
		kolekcijaId: number,
		korisnikId: number,
		uloga_id: number
	): Promise<void> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`INSERT INTO korisnik_kolekcija (korisnik_id, kolekcija_id, uloga_id)
            VALUES (?, ?, ?)`,
			[korisnikId, kolekcijaId, uloga_id]
		);
	}

	public async obrisiKorisnikaIzKolekcije(
		kolekcija_id: number,
		korisnik_id: number
	): Promise<void> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`DELETE FROM korisnik_kolekcija
            WHERE kolekcija_id = ? AND korisnik_id = ?`,
			[kolekcija_id, korisnik_id]
		);
	}

	public async dajKorisnikeKolekcije(
		kolekcijaId: number,
		stranica: number
	): Promise<{ korisnici: Array<IKorisnikKolekcija>; ukupnoStranica: number }> {
		await this.bazaSpremna;

		const poStranici = parseInt(
			this.konfiguracija.dajKonfiguraciju().stranicaLimit
		);
		const kreniOd = Math.max(0, (stranica - 1) * poStranici);

		const [redovi, bazaUkupno] = await Promise.all([
			this.baza.dajSve<IKorisnikKolekcija>(
				`SELECT kk.korisnik_id, kk.kolekcija_id, kk.uloga_id, k.korime, u.naziv AS uloga
				FROM korisnik_kolekcija kk
				JOIN korisnik k ON k.id == kk.korisnik_id
				LEFT JOIN kolekcije_uloge u ON u.id = kk.uloga_id
				WHERE kk.kolekcija_id = ?
				ORDER BY k.korime
				LIMIT ? OFFSET ?`,
				[kolekcijaId, poStranici, kreniOd]
			),
			this.baza.dajJedan<{ ukupno: number }>(
				`SELECT COUNT(*) AS ukupno FROM  korisnik_kolekcija WHERE kolekcija_id = ?`,
				[kolekcijaId]
			),
		]);

		let ukupno = 0;
		if (bazaUkupno) ukupno = bazaUkupno.ukupno;

		return {
			korisnici: redovi,
			ukupnoStranica: Math.max(1, Math.ceil(ukupno / poStranici)),
		};
	}

	public async jeKorisnikUKolekciji(
		kolekcijaId: number,
		korime: string
	): Promise<boolean> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<{ postoji: number }>(
			`SELECT 1 AS postoji
			FROM korisnik_kolekcija kk
			JOIN korisnik k ON k.id = kk.korisnik_id
			WHERE kk.kolekcija_id = ? AND lower(k.korime) = lower(?)
			LIMIT 1`,
			[kolekcijaId, korime]
		);

		return !!red;
	}

	public async dajUloguKorisnika(
		kolekcijaId: number,
		korime: string
	): Promise<number | null> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<{ uloga_id: number }>(
			`SELECT kk.uloga_id
			FROM korisnik_kolekcija kk
			JOIN korisnik k ON k.id = kk.korisnik_id
			WHERE kk.kolekcija_id = ? and lower(k.korime) = lower(?) LIMIT 1`,
			[kolekcijaId, korime]
		);

		return red?.uloga_id ?? null;
	}

	public async jeFilmUKolekciji(
		kolekciaId: number,
		filmId: number
	): Promise<boolean> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<{ postoji: number }>(
			`SELECT 1 as postoji FROM sadrzaj_kolekcije
			WHERE kolekcija_id = ? AND film_id = ? LIMIT 1`,
			[kolekciaId, filmId]
		);

		return !!red;
	}

	public async dodajSadrzajUKolekciju(
		kolekciaId: number,
		filmId: number,
		javniSadrzaj: number
	): Promise<void> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`INSERT INTO sadrzaj_kolekcije (kolekcija_id, film_id, javni_sadrzaj)
			VALUES (?, ?, ?)`,
			[kolekciaId, filmId, javniSadrzaj ? 1 : 0]
		);
	}

	public async azurirajJavniStatusSadrzaja(
		kolekcijaId: number,
		filmId: number,
		javniSadrzaj: number
	): Promise<void> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`UPDATE sadrzaj_kolekcije
			SET javni_sadrzaj = ?
			WHERE kolekcija_id = ? AND film_id = ?`,
			[javniSadrzaj ? 1 : 0, kolekcijaId, filmId]
		);
	}

	public async obrisiSadrzajIzKolekcije(
		kolekcijaId: number,
		filmId: number
	): Promise<void> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`DELETE FROM sadrzaj_kolekcije WHERE kolekcija_id = ? AND film_id = ?`,
			[kolekcijaId, filmId]
		);
	}

	public async dajSadrzajKolekcije(
		kolekcijaId: number
	): Promise<Array<IKolekcijaSadrzaj>> {
		await this.bazaSpremna;
		const redovi = await this.baza.dajSve<Red>(
			`SELECT f.*, sk.javni_sadrzaj, sm.id AS sadrzaj_id,
			sm.putanja, sm.naziv AS naziv_sadrzaja, sm.youtube_kljuc,
			sm.tip_sadrzaja_id, sm.privatan, sm.lokalni_sadrzaj
			FROM sadrzaj_kolekcije sk
			JOIN film f ON f.id = sk.film_id
			LEFT JOIN film_multimedija fm ON fm.film_id = f.id
			LEFT JOIN sadrzaj_multimedija sm ON sm.id = fm.sadrzaj_id
			WHERE sk.kolekcija_id = ?
			ORDER BY f.naslov`,
			[kolekcijaId]
		);

		const mapiraniSadrzaj = new Map<number, IKolekcijaSadrzaj>();
		redovi.forEach((red) => {
			const filmId = Number(red["id"]);
			if (!mapiraniSadrzaj.has(filmId)) {
				mapiraniSadrzaj.set(filmId, {
					id: filmId,
					tmdb_id: red["tmdb_id"] == null ? null : Number(red["tmdb_id"]),
					naslov: red["naslov"],
					opis: red["opis"],
					datum_izlaska: red["datum_izlaska"] ?? null,
					trajanje_min:
						red["trajanje_min"] == null ? null : Number(red["trajanje_min"]),
					ocjena: red["ocjena"] == null ? null : Number(red["ocjena"]),
					broj_ocjena:
						red["broj_ocjena"] == null ? null : Number(red["broj_ocjena"]),
					slogan: red["slogan"] ?? null,
					budzet: red["budzet"] == null ? null : Number(red["budzet"]),
					javni_sadrzaj: red["javni_sadrzaj"] ? 1 : 0,
					multimedija: [],
				});
			}

			if (red["sadrzaj_id"])
				mapiraniSadrzaj.get(filmId)?.multimedija.push(mapMultimedija(red));
		});

		return Array.from(mapiraniSadrzaj.values());
	}

	public async dajJavneStranica(
		stranica: number
	): Promise<{ kolekcije: Array<IKolekcija>; ukupnoStranica: number }> {
		await this.bazaSpremna;
		const poStranici = parseInt(
			this.konfiguracija.dajKonfiguraciju().stranicaLimit
		);
		const kreniOd = Math.max(0, (stranica - 1) * poStranici);

		const [redovi, bazaUkupno] = await Promise.all([
			this.baza.dajSve<Red>(
				`SELECT * FROM kolekcija WHERE javna_kolekcija = 1 ORDER BY id LIMIT ? OFFSET ?`,
				[poStranici, kreniOd]
			),
			this.baza.dajJedan<{ ukupno: number }>(
				`SELECT COUNT(id) AS ukupno FROM kolekcija WHERE javna_kolekcija = 1`
			),
		]);

		let ukupno = 0;
		if (bazaUkupno) ukupno = bazaUkupno.ukupno;

		return {
			kolekcije: redovi.map(mapKolekcija),
			ukupnoStranica: Math.max(1, Math.ceil(ukupno / poStranici)),
		};
	}

	public async dajJavniSadrzajKolekcije(
		kolekcijaId: number
	): Promise<Array<IKolekcijaSadrzaj>> {
		await this.bazaSpremna;
		const redovi = await this.baza.dajSve<Red>(
			`SELECT f.*, sk.javni_sadrzaj, sm.id AS sadrzaj_id, 
			sm.putanja, sm.naziv AS naziv_sadrzaja, sm.youtube_kljuc,
			sm.tip_sadrzaja_id, sm.privatan, sm.lokalni_sadrzaj
			FROM sadrzaj_kolekcije sk
			JOIN film f ON f.id = sk.film_id
			LEFT JOIN film_multimedija fm ON fm.film_id = f.id
			LEFT JOIN sadrzaj_multimedija sm ON sm.id = fm.sadrzaj_id 
			AND (sm.privatan IS NULL OR sm.privatan = 0)
			WHERE sk.kolekcija_id = ? AND sk.javni_sadrzaj = 1
			ORDER BY f.naslov`,
			[kolekcijaId]
		);

		const mapiraniSadrzaj = new Map<number, IKolekcijaSadrzaj>();
		redovi.forEach((red) => {
			const filmId = Number(red["id"]);
			if (!mapiraniSadrzaj.has(filmId)) {
				mapiraniSadrzaj.set(filmId, {
					id: filmId,
					tmdb_id: red["tmdb_id"] == null ? null : Number(red["tmdb_id"]),
					naslov: red["naslov"],
					opis: red["opis"],
					datum_izlaska: red["datum_izlaska"] ?? null,
					trajanje_min:
						red["trajanje_min"] == null ? null : Number(red["trajanje_min"]),
					ocjena: red["ocjena"] == null ? null : Number(red["ocjena"]),
					broj_ocjena:
						red["broj_ocjena"] == null ? null : Number(red["broj_ocjena"]),
					slogan: red["slogan"] ?? null,
					budzet: red["budzet"] == null ? null : Number(red["budzet"]),
					javni_sadrzaj: red["javni_sadrzaj"] ? 1 : 0,
					multimedija: [],
				});
			}

			if (red["sadrzaj_id"]) {
				mapiraniSadrzaj.get(filmId)?.multimedija.push(mapMultimedija(red));
			}
		});

		return Array.from(mapiraniSadrzaj.values());
	}
}
