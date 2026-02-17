import { PUTANJA_KORISNICI_SADRZAJ } from "../../zajednicko/putanje.js";
import { RWASesija } from "../../sucelja/servisi/IKorisnik.js";
import { Konfiguracija } from "../../zajednicko/konfiguracija.js";
import { KorisnickiSadrzajDAO } from "../dao/korisnickiSadrzajDAO.js";
import { KorisnikDAO } from "../dao/korisnikDAO.js";
import { Request, Response } from "express";
import formidable from "formidable";
import putanja from "path";
import { JavniSadrzajDAO } from "../dao/javniSadrzajDAO.js";

export class RestSadrzaj {
	private sadrzaji: KorisnickiSadrzajDAO;
	private korisnici: KorisnikDAO;
	private konfiguracija: Konfiguracija;
	private javniSadrzaj: JavniSadrzajDAO;

	constructor(konf: Konfiguracija) {
		this.konfiguracija = konf;
		this.sadrzaji = new KorisnickiSadrzajDAO(this.konfiguracija);
		this.korisnici = new KorisnikDAO(this.konfiguracija);
		this.javniSadrzaj = new JavniSadrzajDAO(this.konfiguracija);
	}

	public async getJavni(zahtjev: Request, odgovor: Response) {
		const naziv = String(zahtjev.query["naziv"] || "").trim();
		if (naziv && naziv.length < 3) {
			odgovor.status(400).json({ greska: "naziv mora imati barem 3 znaka" });
			return;
		}

		const autor = String(zahtjev.query["autor"] || "").trim();
		const datumOd = String(zahtjev.query["datumOd"] || "").trim();
		const datumDo = String(zahtjev.query["datumDo"] || "").trim();

		if (!(naziv.length >= 3 || autor || datumOd || datumDo)) {
			odgovor.status(200).json({ sadrzaj: [], stranica: 1, ukupnoStranica: 1 });
			return;
		}

		const stranica = parseInt(zahtjev.query["stranica"] as string);
		const stranciaInt = Number.isNaN(stranica) || stranica < 1 ? 1 : stranica;

		const podatciStranice = await this.javniSadrzaj.dajStranicu({
			naziv: naziv.length >= 3 ? naziv : null,
			autor: autor || null,
			datumOd: datumOd || null,
			datumDo: datumDo || null,
			stranica: stranciaInt,
		});

		const stvarnoTrazenaStranica =
			stranciaInt > podatciStranice.ukupnoStranica
				? podatciStranice.ukupnoStranica
				: stranciaInt;

		let rezultat = podatciStranice.sadrzaj;
		if (stvarnoTrazenaStranica != stranciaInt) {
			rezultat = (
				await this.javniSadrzaj.dajStranicu({
					naziv: naziv.length >= 3 ? naziv : null,
					autor: autor || null,
					datumOd: datumOd || null,
					datumDo: datumDo || null,
					stranica: stvarnoTrazenaStranica,
				})
			).sadrzaj;
		}

		odgovor.status(200).json({
			sadrzaj: rezultat,
			stranica: stvarnoTrazenaStranica,
			ukupnoStranica: podatciStranice.ukupnoStranica,
		});
	}

	public async getAutori(zahtjev: Request, odgovor: Response) {
		const autori = await this.javniSadrzaj.dajAutore();
		odgovor.status(200).json({ autori });
	}

	public async dajKorisnikId(
		zahtjev: Request,
		odgovor: Response
	): Promise<number | null> {
		const sesija = zahtjev.session as RWASesija | undefined;
		if (!sesija?.korime) {
			odgovor.status(401).json({ greska: "potrebna prijava" });
			return null;
		}

		const korisnikId = await this.korisnici.dajIdPoKorime(sesija.korime);
		if (!korisnikId) {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
			return null;
		}

		return korisnikId;
	}

	public async getMoji(zahtjev: Request, odgovor: Response) {
		const korisnikId = await this.dajKorisnikId(zahtjev, odgovor);
		if (!korisnikId) return;

		const traziSve = String(zahtjev.query["svi"] || "") == "1";
		if (traziSve) {
			const sadrzaj = await this.sadrzaji.dajSveZaKorisnika(korisnikId);
			odgovor.status(200).json({ sadrzaj, stranica: 1, ukupnoStranica: 1 });
			return;
		}

		const stranica = parseInt(zahtjev.query["stranica"] as string);
		const stranicaInt = Number.isNaN(stranica) || stranica < 1 ? 1 : stranica;

		const podatciStranice = await this.sadrzaji.dajStranicu(
			korisnikId,
			stranicaInt
		);
		const stvarnoTrazenaStranica =
			stranicaInt > podatciStranice.ukupnoStranica
				? podatciStranice.ukupnoStranica
				: stranicaInt;

		let rezultat = podatciStranice.sadrzaj;
		if (stvarnoTrazenaStranica !== stranicaInt) {
			rezultat = (
				await this.sadrzaji.dajStranicu(korisnikId, stvarnoTrazenaStranica)
			).sadrzaj;
		}

		odgovor.status(200).json({
			sadrzaj: rezultat,
			stranica: stvarnoTrazenaStranica,
			ukupnoStranica: podatciStranice.ukupnoStranica,
		});
	}

	public async postMoj(zahtjev: Request, odgovor: Response) {
		const korisnikId = await this.dajKorisnikId(zahtjev, odgovor);
		if (!korisnikId) return;

		const forma = formidable({
			uploadDir: PUTANJA_KORISNICI_SADRZAJ,
			maxFiles: 1,
			maxFileSize: 1024 * 1024,
			keepExtensions: true,
		});

		forma.parse(zahtjev, async (greska, polja, datoteke) => {
			if (greska) {
				odgovor.status(400).json({ greska: "greska u prijenosu datoteke" });
				return;
			}

			const tip = String(polja["tip"] || "")
				.trim()
				.toLowerCase();
			if (tip !== "slika" && tip !== "video") {
				odgovor
					.status(400)
					.json({ greska: 'tip mora biti "slika" ili "video"' });
				return;
			}

			const sveDatoteke = datoteke["datoteka"];
			let multimedija;

			if (Array.isArray(sveDatoteke)) multimedija = sveDatoteke[0];

			if (!multimedija) {
				odgovor.status(400).json({ greska: "datoteka je obavezna" });
				return;
			}

			if (tip == "slika" && multimedija.size > 500 * 1024) {
				odgovor
					.status(400)
					.json({ greska: "slika smije biti maksimalno 500KB" });
				return;
			}

			if (tip == "video" && multimedija.size > 1024 * 1024) {
				odgovor.status(400).json({ greska: "video smije biti maksimalno 1MB" });
				return;
			}

			const nazivPolje = String(polja["naziv"] || "").trim();
			const naziv =
				nazivPolje || String(multimedija.originalFilename || "").trim();

			const relativnaPutanja = putanja.join(
				"sadrzaj",
				putanja.basename(multimedija.filepath)
			);

			try {
				const privatnoPolje = polja["privatan"];
				const original = Array.isArray(privatnoPolje)
					? privatnoPolje[0]
					: String(privatnoPolje ?? "0");

				await this.sadrzaji.spremiSadrzaj(korisnikId, {
					naziv,
					putanja: relativnaPutanja,
					tip,
					velicina: multimedija.size,
					privatan: original == "1" ? 1 : 0,
				});
				odgovor.status(201).json({ status: "uspjeh" });
			} catch {
				odgovor.status(500).json({ greska: "neuspjesno kreiranje kolekcije" });
			}
		});
	}

	public async patchVidljivost(zahtjev: Request, odgovor: Response) {
		const korisnikId = await this.dajKorisnikId(zahtjev, odgovor);
		if (!korisnikId) return;

		const sadrzajId = parseInt(zahtjev.params["id"] || "");
		if (Number.isNaN(sadrzajId) || sadrzajId < 1) {
			odgovor.status(400).json({ greska: "neispravan id" });
			return;
		}

		const privatan = zahtjev.body?.privatan ? 1 : 0;
		try {
			await this.sadrzaji.azurirajVidljivost(korisnikId, sadrzajId, privatan);
			odgovor.status(201).json({ status: "uspjeh" });
		} catch {
			odgovor.status(404).json({ greska: "nepostojeći resurs" });
		}
	}
}
