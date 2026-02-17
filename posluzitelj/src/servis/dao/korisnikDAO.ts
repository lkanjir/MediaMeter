import { Konfiguracija } from "../../zajednicko/konfiguracija.js";
import {
	IKorisnik,
	IKorisnikCitljivo,
} from "../../sucelja/servisi/IKorisnik.js";
import Baza from "../../zajednicko/sqliteBaza.js";

type Red = { [k: string]: any };

const mapKorisnik = (r: Red): IKorisnik => ({
	ime: r["ime"] ?? "",
	prezime: r["prezime"] ?? "",
	adresa: r["adresa"] ?? "",
	nadimak: r["nadimak"] ?? "",
	omeni: r["o_meni"] ?? "",
	spolId: r["spol_id"] == null ? null : Number(r["spol_id"]),
	datrod: r["datum_rodjenja"] ?? "",
	korime: r["korime"] ?? "",
	hashLozinke: r["lozinka"] ?? "",
	email: r["email"] ?? "",
	sol: r["sol"] ?? "",
	jeBlokiran: !!Number(r["je_blokiran"]),
	neuspjesnePrijave: r["neuspjesne_prijave"]
		? Number(r["neuspjesne_prijave"])
		: 0,
	tipKorisnikaId: r["tip_korisnika_id"] ? Number(r["tip_korisnika_id"]) : 1,
	jeAktivan: !!Number(r["je_aktivan"]),
	aktivacijskiKod: r["aktivacijski_kod"] ?? null,
});

export class KorisnikDAO {
	private baza: Baza;
	private bazaSpremna: Promise<void>;
	private konfiguracija: Konfiguracija;

	constructor(konf: Konfiguracija) {
		this.baza = new Baza("podaci/RWA2025lkanjir23.sqlite");
		this.bazaSpremna = this.baza.spoji();
		this.konfiguracija = konf;
	}

	async dajStranicu(
		stranica: number
	): Promise<{ korisnici: Array<IKorisnikCitljivo>; ukupnoStranica: number }> {
		await this.bazaSpremna;
		const poStranici = parseInt(
			this.konfiguracija.dajKonfiguraciju().stranicaLimit
		);
		const kreniOd = Math.max(0, (stranica - 1) * poStranici);

		const [redovi, bazaUkupno] = await Promise.all([
			await this.baza.dajSve<Red>(
				`SELECT k.ime, k.prezime, k.adresa, k.nadimak, k.o_meni,
        		s.naziv as spol, k.datum_rodjenja, k.korime, k.email,
				k.je_blokiran, k.neuspjesne_prijave, t.naziv as tip
		FROM korisnik k
		LEFT JOIN spol s ON s.id = k.spol_id
		LEFT JOIN tip_korisnika t ON t.id = k.tip_korisnika_id
		ORDER BY k.korime
		LIMIT ? OFFSET ?`,
				[poStranici, kreniOd]
			),
			await this.baza.dajJedan<{ ukupno: number }>(
				"SELECT COUNT(id) as ukupno FROM korisnik"
			),
		]);

		let ukupno = 0;
		if (bazaUkupno) ukupno = bazaUkupno.ukupno;

		return {
			korisnici: redovi.map((red) => ({
				ime: red["ime"] ?? "",
				prezime: red["prezime"] ?? "",
				adresa: red["adresa"] ?? "",
				nadimak: red["nadimak"] ?? "",
				omeni: red["o_meni"] ?? "",
				spol: red["spol"] ?? "",
				datum_rodjenja: red["datum_rodjenja"] ?? "",
				korime: red["korime"] ?? "",
				email: red["email"],
				jeBlokiran: red["je_blokiran"] ? "Da" : "Ne",
				neuspjesnePrijave: String(red["neuspjesne_prijave"]),
				tipKorisnika: red["tip"],
			})),
			ukupnoStranica: Math.max(1, Math.ceil(ukupno / poStranici)),
		};
	}

	async dajPoKorime(korime: string): Promise<IKorisnik | null> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<Red>(
			"SELECT * FROM korisnik WHERE korime = ?",
			[korime]
		);

		if (red) return mapKorisnik(red);
		return null;
	}

	async dajPoEmail(email: string): Promise<IKorisnik | null> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<Red>(
			"SELECT * FROM korisnik WHERE lower(email) = lower(?)",
			[email]
		);

		return red ? mapKorisnik(red) : null;
	}

	async dodaj(korisnik: IKorisnik): Promise<boolean> {
		await this.bazaSpremna;
		try {
			await this.baza.izvrsi(
				`INSERT INTO korisnik 
				(ime, prezime, adresa, nadimak, o_meni, spol_id, 
				datum_rodjenja, korime, lozinka, sol, email, je_blokiran, 
				neuspjesne_prijave, tip_korisnika_id, je_aktivan, aktivacijski_kod) 
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					korisnik.ime,
					korisnik.prezime,
					korisnik.adresa,
					korisnik.nadimak,
					korisnik.omeni,
					korisnik.spolId,
					korisnik.datrod ? korisnik.datrod : null,
					korisnik.korime,
					korisnik.hashLozinke,
					korisnik.sol,
					korisnik.email,
					0,
					0,
					1,
					korisnik.jeAktivan ? 1 : 0,
					korisnik.aktivacijskiKod,
				]
			);
			return true;
		} catch {
			return false;
		}
	}

	async aktivirajKorisnika(aktivacijskiKod: string): Promise<boolean> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<{ id: number }>(
			"SELECT id FROM korisnik WHERE aktivacijski_kod = ?",
			[aktivacijskiKod]
		);

		if (!red) return false;
		await this.baza.izvrsi(
			"UPDATE korisnik SET je_aktivan = 1, aktivacijski_kod = NULL WHERE id = ?",
			[red.id]
		);

		return true;
	}

	private async dajIdUloge(naziv: string): Promise<number | null> {
		const normaliziranaUloga = this.normalizirajUlogu(naziv);
		if (!normaliziranaUloga) return -1;

		await this.bazaSpremna;
		const red = await this.baza.dajJedan<{ id: number }>(
			"SELECT id FROM tip_korisnika WHERE lower(naziv) = lower(?)",
			[normaliziranaUloga]
		);
		return red?.id ?? null;
	}

	private normalizirajUlogu(naziv: string): string | null {
		const nazivLower = naziv.toLowerCase();
		if (nazivLower.includes("korisnik")) return "registrirani korisnik";
		if (nazivLower.includes("admin")) return "administrator";
		if (naziv.includes("moderator")) return "moderator";

		return null;
	}

	async postaviBlokadu(korime: string, blokiraj: boolean): Promise<void> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`UPDATE korisnik SET je_blokiran = ?, 
		 neuspjesne_prijave = CASE 
		 WHEN ? = 0 THEN 0
		 ELSE neuspjesne_prijave END 
		 WHERE korime = ?`,
			[blokiraj ? 1 : 0, blokiraj ? 1 : 0, korime]
		);
	}

	async postaviUlogu(korime: string, nazivUloge: string): Promise<boolean> {
		await this.bazaSpremna;
		const tipId = await this.dajIdUloge(nazivUloge);

		if (!tipId || tipId == -1) return false;
		await this.baza.izvrsi(
			`
		UPDATE korisnik SET tip_korisnika_id = ? WHERE korime = ?`,
			[tipId, korime]
		);
		return true;
	}

	async obrisi(korime: string): Promise<boolean> {
		await this.bazaSpremna;
		await this.baza.izvrsi("DELETE FROM korisnik WHERE korime= ?", [korime]);
		return true;
	}

	async povecajBrojPokusaja(korime: string): Promise<void> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			`UPDATE korisnik SET 
			neuspjesne_prijave = neuspjesne_prijave + 1, 
			je_blokiran = CASE 
				WHEN neuspjesne_prijave + 1 >= 3 THEN 1
				ELSE 0 END
			WHERE korime= ?`,
			[korime]
		);
	}

	async jeBlokiran(korime: string): Promise<boolean> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<{ je_blokiran: number }>(
			"SELECT je_blokiran FROM korisnik WHERE korime = ?",
			[korime]
		);

		return red?.je_blokiran == 1;
	}

	async resetirajBlokadu(korime: string): Promise<void> {
		await this.bazaSpremna;
		await this.baza.izvrsi(
			"UPDATE korisnik SET neuspjesne_prijave = 0, je_blokiran = 0 WHERE korime = ?",
			[korime]
		);
	}

	public async dajIdPoKorime(korime: string): Promise<number | null> {
		await this.bazaSpremna;
		const red = await this.baza.dajJedan<{ id: number }>(
			`SELECT id FROM korisnik WHERE lower(korime) = lower(?)`,
			[korime]
		);
		return red?.id ?? null;
	}
}
