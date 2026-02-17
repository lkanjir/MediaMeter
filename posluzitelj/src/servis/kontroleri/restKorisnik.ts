import { IKorisnik, RWASesija } from "../../sucelja/servisi/IKorisnik.js";
import { KorisnikDAO } from "../dao/korisnikDAO.js";
import { Request, Response } from "express";
import * as kodovi from "../../zajednicko/kodovi.js";
import {
	provjeriDatum,
	provjeriEmail,
	provjeriImePrezime,
	provjeriKorime,
	provjeriLozinku,
	provjeriSpol,
	provjeriTekst,
} from "../validacija/validacija.js";
import { parsirajDatum } from "../../zajednicko/pariranje.js";
import { Konfiguracija } from "../../zajednicko/konfiguracija.js";
import { dajPravoZaTipKorisnika } from "../../zajednicko/prava.js";
import { posaljiMail } from "../mail.js";

export class RestKorisnik {
	private korisnici;
	private konfiguracija;

	constructor(konf: Konfiguracija) {
		this.konfiguracija = konf;
		this.korisnici = new KorisnikDAO(this.konfiguracija);
	}

	async aktivirajKorisnika(zahtjev: Request, odgovor: Response) {
		const token = zahtjev.query["token"] as string | undefined;
		if (!token) {
			odgovor.status(400).json({ greska: "nedostaje aktivacijski token" });
			return;
		}

		const uspjeh = await this.korisnici.aktivirajKorisnika(token);
		if (!uspjeh) {
			odgovor.status(404).json({ greska: "neispravan aktivacijski token" });
			return;
		}

		odgovor.status(200).json({ status: "uspjeh" });
	}

	async getSesija(zahtjev: Request, odgovor: Response) {
		const sesija = zahtjev.session as RWASesija | undefined;
		if (!sesija?.korime || !sesija.tipKorisnikaId) {
			odgovor.json({ prijavljen: false });
			return;
		}

		odgovor.json({
			prijavljen: true,
			korime: sesija.korime,
			tipKorisnikaId: sesija.tipKorisnikaId,
			razinaPrava: dajPravoZaTipKorisnika(sesija.tipKorisnikaId),
		});
	}

	async odjaviKorisnika(zahtjev: Request, odgovor: Response) {
		zahtjev.session.destroy((greska) => {
			if (greska) {
				odgovor.status(500).json({ greska: "odjava nije uspjela" });
				return;
			}
			odgovor.status(200).json({ status: "uspjeh" });
		});
	}

	async getKorisnici(zahtjev: Request, odgovor: Response) {
		const stranica = parseInt(zahtjev.query["stranica"] as string);
		const stranicaInt = Number.isNaN(stranica) || stranica < 1 ? 1 : stranica;
		const podatciStranice = await this.korisnici.dajStranicu(stranicaInt);

		const stvarnoTrazenaStranica =
			stranicaInt > podatciStranice.ukupnoStranica
				? podatciStranice.ukupnoStranica
				: stranicaInt;

		let rezultat = podatciStranice;
		if (stvarnoTrazenaStranica == stranicaInt) rezultat = podatciStranice;
		else await this.korisnici.dajStranicu(stvarnoTrazenaStranica);

		odgovor.json({
			korisnici: rezultat.korisnici,
			stranica: stvarnoTrazenaStranica,
			ukupnoStranica: rezultat.ukupnoStranica,
		});
	}

	private async promijeniBlokadu(
		zahtjev: Request,
		odgovor: Response,
		blokiraj: boolean
	) {
		const korime = zahtjev.params["korime"];
		if (!korime) {
			odgovor.status(400).json({ greska: "Nedostaje korisničko ime" });
			return;
		}

		const korisnik = await this.korisnici.dajPoKorime(korime);
		if (!korisnik) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		const sesija = zahtjev.session as RWASesija | undefined;
		const trenutnoPrijavljen = sesija?.korime;
		const jeAdmin = korisnik.tipKorisnikaId == 3;

		if (jeAdmin && trenutnoPrijavljen == korisnik.korime) {
			odgovor.status(403).json({ greska: "nije moguce blokirati sam sebe" });
			return;
		}

		await this.korisnici.postaviBlokadu(korime, blokiraj);
		odgovor.status(201).json({ status: "uspjeh" });
	}

	async blokirajKorisnika(zahtjev: Request, odgovor: Response) {
		await this.promijeniBlokadu(zahtjev, odgovor, true);
	}

	async odblokirajKorisnika(zahtjev: Request, odgovor: Response) {
		await this.promijeniBlokadu(zahtjev, odgovor, false);
	}

	async postaviUloguKorisnika(zahtjev: Request, odgovor: Response) {
		const korime = zahtjev.params["korime"];
		const novaUloga = zahtjev.body?.uloga as string | null;

		if (!korime || !novaUloga) {
			odgovor.status(400).json({ greska: "Nedostaju podatci" });
			return;
		}

		const korisnik = await this.korisnici.dajPoKorime(korime);
		if (!korisnik) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return;
		}

		if (korisnik.tipKorisnikaId == 3) {
			odgovor
				.status(403)
				.json({ greska: "Nije moguće mijenjati ulogu administratora" });
			return;
		}

		const uspjeh = await this.korisnici.postaviUlogu(korime, novaUloga);
		if (uspjeh) odgovor.status(201).json({ status: "uspjeh" });
		else odgovor.status(400).json({ greska: "Uloga ne postji" });
	}

	async prijaviKorisnika(zahtjev: Request, odgovor: Response) {
		const greska = { greska: "Neispravni podatci za prijavu!" };

		const validacije: IValidacija[] = [
			{
				kljuc: "Korisničko ime",
				vrijednost: zahtjev.body?.korime,
				validator: provjeriKorime,
			},
			{
				kljuc: "Lozinka",
				vrijednost: zahtjev.body?.lozinka,
				validator: provjeriLozinku,
			},
		];

		for (const v of validacije) {
			const greska = await v.validator(v.kljuc, v.vrijednost);
			if (greska) {
				odgovor.status(400).json({ greska: greska });
				return;
			}
		}

		const postojeciKorisnik = await this.korisnici.dajPoKorime(
			zahtjev.body.korime
		);

		if (!postojeciKorisnik) {
			odgovor.status(401).json(greska);
			return;
		}

		if (postojeciKorisnik.jeBlokiran) {
			odgovor.status(403).json({ greska: "Korisnički račun blokiran!" });
			return;
		}

		if (!postojeciKorisnik.jeAktivan) {
			odgovor.status(403).json({ greska: "najprije aktivirajte račun" });
			return;
		}

		const hashLozinke = kodovi.kreirajSHA256(
			zahtjev.body.lozinka,
			postojeciKorisnik.sol
		);

		if (hashLozinke != postojeciKorisnik.hashLozinke) {
			await this.korisnici.povecajBrojPokusaja(postojeciKorisnik.korime);
			const jeBlokiran = await this.korisnici.jeBlokiran(
				postojeciKorisnik.korime
			);

			if (jeBlokiran)
				odgovor.status(403).json({ greska: "Korisnički račun blokiran!" });
			else odgovor.status(401).json(greska);

			return;
		}

		await this.korisnici.resetirajBlokadu(postojeciKorisnik.korime);

		const sesija = zahtjev.session as RWASesija;
		sesija.korime = postojeciKorisnik.korime;
		sesija.tipKorisnikaId = postojeciKorisnik.tipKorisnikaId;

		odgovor.status(200).json({ status: "uspjeh" });
	}

	async registrirajKorisnika(zahtjev: Request, odgovor: Response) {
		const greska = { greska: "Odabrano korisnicko ime je zauzeto!" };
		const podatciKorisnika = zahtjev.body;

		const validacije: Array<IValidacija> = [
			{
				kljuc: "Korisničko ime",
				vrijednost: podatciKorisnika?.korime,
				validator: provjeriKorime,
			},
			{
				kljuc: "E-mail",
				vrijednost: podatciKorisnika?.email,
				validator: provjeriEmail,
			},
			{
				kljuc: "Lozinka",
				vrijednost: podatciKorisnika?.lozinka,
				validator: provjeriLozinku,
			},
			{
				kljuc: "Ime",
				vrijednost: podatciKorisnika?.ime,
				validator: provjeriImePrezime,
			},
			{
				kljuc: "Prezime",
				vrijednost: podatciKorisnika?.prezime,
				validator: provjeriImePrezime,
			},
			{
				kljuc: "Nadimak",
				vrijednost: podatciKorisnika?.nadimak,
				validator: provjeriTekst,
			},
			{
				kljuc: "Spol",
				vrijednost: podatciKorisnika?.spol,
				validator: provjeriSpol,
			},
			{
				kljuc: "Datum rođenja",
				vrijednost: podatciKorisnika?.datRod,
				validator: provjeriDatum,
			},
			{
				kljuc: "Adresa",
				vrijednost: podatciKorisnika?.adresa,
				validator: provjeriTekst,
			},
			{
				kljuc: "O meni",
				vrijednost: podatciKorisnika?.omeni,
				validator: provjeriTekst,
			},
		];

		for (const v of validacije) {
			const greska = await v.validator(v.kljuc, v.vrijednost);
			if (greska) {
				odgovor.status(400).json({ greska: greska });
				return;
			}
		}

		const [postojeciKorisnik, postojeciEmail] = await Promise.all([
			this.korisnici.dajPoKorime(podatciKorisnika.korime),
			this.korisnici.dajPoEmail(podatciKorisnika.email),
		]);

		if (postojeciKorisnik) {
			odgovor.status(400).json(greska);
			return;
		}

		if (postojeciEmail) {
			odgovor.status(400).json({ greska: "adresa e-pošte zauzeta" });
			return;
		}

		const aktivacijskiKod = kodovi.dajAktivacijskiKod();
		console.log(aktivacijskiKod);
		const sol = kodovi.kreirajSol();
		const hashLozinke = kodovi.kreirajSHA256(podatciKorisnika.lozinka, sol);

		const parsiraniDatumRod = parsirajDatum(podatciKorisnika.datRod);

		const korisnik: IKorisnik = {
			ime: podatciKorisnika.ime,
			prezime: podatciKorisnika.prezime,
			adresa: podatciKorisnika.adresa,
			nadimak: podatciKorisnika.nadimak,
			omeni: podatciKorisnika.omeni,
			spolId: podatciKorisnika.spol,
			datrod: parsiraniDatumRod,
			email: podatciKorisnika.email,
			korime: podatciKorisnika.korime,
			hashLozinke: hashLozinke,
			sol: sol,
			jeBlokiran: false,
			neuspjesnePrijave: 0,
			tipKorisnikaId: 1,
			jeAktivan: false,
			aktivacijskiKod: aktivacijskiKod,
		};

		const uspjeh = await this.korisnici.dodaj(korisnik);
		if (!uspjeh) {
			odgovor
				.status(400)
				.json({ greska: "korisničko ime ili adresa e-pošte zauzeti" });
			return;
		}

		const host = zahtjev.get("host");
		const link = `http://${host}/api/javno/korisnici/aktivacija?token=${encodeURIComponent(
			aktivacijskiKod
		)}`;

		try {
			await posaljiMail(
				"lkanjir23@student.foi.hr",
				korisnik.email,
				"Aktivacija računa RWA",
				`Za aktivacijku računa otvorite poveznicu: ${link}`,
				this.konfiguracija
			);
		} catch {
			await this.korisnici.obrisi(korisnik.korime);
			odgovor.status(500).json({
				greska:
					"slanje aktivacijske e-poruke nije uspjelo,registrirajte se ponovno",
			});
			return;
		}

		odgovor.status(201).json({ status: "uspjeh" });
	}
}
