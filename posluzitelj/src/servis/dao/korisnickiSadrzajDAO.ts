import Baza from "../../zajednicko/sqliteBaza.js";
import { IKorisnickiSadrzaj } from "../../sucelja/servisi/IKorisnickiSadrzaj.js";
import { Konfiguracija } from "../../zajednicko/konfiguracija.js";

type Red = { [k: string]: any };
const mapSadrzaj = (r: Red): IKorisnickiSadrzaj => ({
	id: Number(r["id"]),
	naziv: r["naziv"] ?? null,
	putanja: r["putanja"],
	tip: r["tip"],
	velicina_bajt: r["velicina_bajt"] == null ? null : Number(r["velicina_bajt"]),
	privatan: Number(r["privatan"] ?? 0) ? 1 : 0,
	kreirano: r["kreirano"] ?? "",
});

export class KorisnickiSadrzajDAO {
	private baza: Baza;
	private bazaSpremna: Promise<void>;
	private konfiguracija: Konfiguracija;

	constructor(konf: Konfiguracija) {
		this.konfiguracija = konf;
		this.baza = new Baza("podaci/RWA2025lkanjir23.sqlite");
		this.bazaSpremna = this.baza.spoji();
	}

	private async osigurajTipSadrzaja(tip: string) {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`INSERT OR IGNORE INTO tip_sadrzaja (tip) VALUES (?)`,
			[tip]
		);
	}

	public async spremiSadrzaj(
		korisnikId: number,
		opcije: {
			naziv?: string | null;
			putanja: string;
			tip: string;
			velicina?: number | null;
			privatan?: number;
		}
	): Promise<number> {
		await this.bazaSpremna;
		await this.osigurajTipSadrzaja(opcije.tip);

		await this.baza.izvrsi(
			`INSERT INTO sadrzaj_multimedija
            (putanja, naziv, velicina_bajt, youtube_kljuc, 
            lokalni_sadrzaj, tip_sadrzaja_id, privatan)
            VALUES (?, ?, ?, NULL, 1, ?, ?)`,
			[
				opcije.putanja,
				opcije.naziv ?? null,
				opcije.velicina ?? null,
				opcije.tip,
				opcije.privatan ? 1 : 0,
			]
		);

		const red = await this.baza.dajJedan<{ id: number }>(
			`SELECT last_insert_rowid() as id`
		);

		const sadrzajId = red?.id;
		if (!sadrzajId) throw new Error("Spremanje sadržaja nije uspjelo");

		await this.baza.izvrsi(
			`INSERT INTO korisnik_sadrzaj (korisnik_id, 
            sadrzaj_id, naziv_prikaz)
            VALUES (?, ?, ?)`,
			[korisnikId, sadrzajId, opcije.naziv ?? null]
		);

		return sadrzajId;
	}

	public async dajStranicu(
		korisnikId: number,
		stranica: number
	): Promise<{ sadrzaj: Array<IKorisnickiSadrzaj>; ukupnoStranica: number }> {
		await this.bazaSpremna;
		const poStranici = parseInt(
			this.konfiguracija.dajKonfiguraciju().stranicaLimit
		);
		const kreniOd = Math.max(0, (stranica - 1) * poStranici);

		const [redovi, bazaUkupno] = await Promise.all([
			this.baza.dajSve<Red>(
				`SELECT sm.id, COALESCE(ks.naziv_prikaz, sm.naziv) AS naziv, 
                sm.putanja, sm.tip_sadrzaja_id AS tip, sm.velicina_bajt, 
                sm.privatan, ks.kreirano 
                FROM korisnik_sadrzaj ks 
                JOIN sadrzaj_multimedija sm ON sm.id = ks.sadrzaj_id 
                WHERE ks.korisnik_id = ? 
                ORDER BY ks.kreirano DESC LIMIT ? OFFSET ?`,
				[korisnikId, poStranici, kreniOd]
			),
			this.baza.dajJedan<{ ukupno: number }>(
				`SELECT COUNT(id) AS ukupno FROM korisnik_sadrzaj WHERE korisnik_id = ?`,
				[korisnikId]
			),
		]);

		let ukupno = 0;
		if (bazaUkupno) ukupno = bazaUkupno.ukupno;
		return {
			sadrzaj: redovi.map(mapSadrzaj),
			ukupnoStranica: Math.max(1, Math.ceil(ukupno / poStranici)),
		};
	}

	public async dajSveZaKorisnika(
		korisnikId: number
	): Promise<Array<IKorisnickiSadrzaj>> {
		await this.bazaSpremna;
		const redovi = await this.baza.dajSve<Red>(
			`SELECT sm.id, COALESCE(ks.naziv_prikaz, sm.naziv) AS naziv, 
			sm.putanja, sm.tip_sadrzaja_id AS tip, 
			sm.velicina_bajt, sm.privatan, ks.kreirano 
			FROM korisnik_sadrzaj ks 
			JOIN sadrzaj_multimedija sm ON sm.id = ks.sadrzaj_id 
			WHERE ks.korisnik_id = ? 
			ORDER BY ks.kreirano DESC`,
			[korisnikId]
		);

		return redovi.map(mapSadrzaj);
	}

	public async dajZaKorisnikaPoId(
		korisnikId: number,
		sadrzajId: number
	): Promise<IKorisnickiSadrzaj | null> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<Red>(
			`SELECT sm.id, COALESCE(ks.naziv_prikaz, sm.naziv) AS naziv, 
			sm.putanja, sm.tip_sadrzaja_id AS tip, sm.velicina_bajt, 
			sm.privatan, ks.kreirano 
			FROM korisnik_sadrzaj ks 
			JOIN sadrzaj_multimedija sm ON sm.id = ks.sadrzaj_id 
			WHERE ks.korisnik_id = ? AND sm.id = ? 
			LIMIT 1`,
			[korisnikId, sadrzajId]
		);

		return red ? mapSadrzaj(mapSadrzaj) : null;
	}

	public async azurirajVidljivost(
		korisnikId: number,
		sadrzajId: number,
		privatan: number
	): Promise<void> {
		await this.bazaSpremna;
		const postoji = await this.baza.dajJedan<{ id: number }>(
			`SELECT sm.id FROM korisnik_sadrzaj ks
			JOIN sadrzaj_multimedija sm ON sm.id = ks.sadrzaj_id
			WHERE ks.korisnik_id = ? AND sm.id = ?
			LIMIT 1`,
			[korisnikId, sadrzajId]
		);

		if (!postoji) throw new Error("sadrzaj ne postji");

		await this.baza.izvrsi(
			`UPDATE sadrzaj_multimedija SET privatan = ? WHERE id = ?`,
			[privatan ? 1 : 0, sadrzajId]
		);
	}
}
