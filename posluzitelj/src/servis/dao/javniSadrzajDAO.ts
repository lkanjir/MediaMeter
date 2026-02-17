import { IJavniSadrzaj } from "../../sucelja/servisi/IJavniSadrzaj.js";
import { Konfiguracija } from "../../zajednicko/konfiguracija.js";
import Baza from "../../zajednicko/sqliteBaza.js";

type Red = { [kljuc: string]: any };
type Filteri = {
	naziv?: string | null;
	autor?: string | null;
	datumOd?: string | null;
	datumDo?: string | null;
	stranica: number;
};

const JOIN = `FROM sadrzaj_multimedija sm
LEFT JOIN korisnik_sadrzaj ks ON sm.id = ks.sadrzaj_id
LEFT JOIN korisnik k ON ks.korisnik_id = k.id
LEFT JOIN film_multimedija fm ON sm.id = fm.sadrzaj_id
LEFT JOIN film f ON fm.film_id = f.id
LEFT JOIN sadrzaj_kolekcije sk ON f.id = sk.film_id
LEFT JOIN kolekcija kol ON sk.kolekcija_id = kol.id`;

const NAZIV =
	"CASE WHEN sm.lokalni_sadrzaj = 1 THEN sm.naziv ELSE f.naslov END";
const AUTOR = "CASE WHEN sm.lokalni_sadrzaj = 1 THEN k.korime ELSE 'TMDB' END";

const mapJavniSadrzaj = (red: Red): IJavniSadrzaj => ({
	sadrzaj_id: Number(red["sadrzaj_id"]),
	naziv: red["naziv_sadrzaja"],
	putanja: red["putanja"],
	tip: red["tip"],
	youtube_kljuc: red["youtube_kljuc"] ?? null,
	kreirano: red["kreirano"],
	autor: red["autor"],
	film_id: red["film_id"] == null ? null : Number(red["film_id"]),
	film_naslov: red["film_naslov"] ?? null,
	kolekcija_id:
		red["kolekcija_id"] == null ? null : Number(red["kolekcija_id"]),
	kolekcija_naziv: red["kolekcija_naziv"] ?? null,
});

export class JavniSadrzajDAO {
	private baza: Baza;
	private bazaSpremna: Promise<void>;
	private konfiguracija: Konfiguracija;

	constructor(konf: Konfiguracija) {
		this.baza = new Baza("podaci/RWA2025lkanjir23.sqlite");
		this.bazaSpremna = this.baza.spoji();
		this.konfiguracija = konf;
	}

	public async dajStranicu(filteri: Filteri): Promise<{
		sadrzaj: IJavniSadrzaj[];
		ukupnoStranica: number;
	}> {
		await this.bazaSpremna;
		const poStranici = parseInt(
			this.konfiguracija.dajKonfiguraciju().stranicaLimit
		);
		const kreniOd = Math.max(0, (filteri.stranica - 1) * poStranici);

		const where = [
			"sm.privatan = 0",
			"(sm.lokalni_sadrzaj = 1 OR (sk.javni_sadrzaj = 1 AND kol.javna_kolekcija = 1))",
		];
		const parametri = new Array<string | number>();
		if (filteri.naziv) {
			where.push(`lower(${NAZIV}) LIKE ?`);
			parametri.push(`%${filteri.naziv.toLowerCase()}%`);
		}
		if (filteri.autor) {
			where.push(`lower(${AUTOR}) = lower(?)`);
			parametri.push(filteri.autor);
		}
		if (filteri.datumOd) {
			where.push("date(sm.kreirano) >= date(?)");
			parametri.push(filteri.datumOd);
		}
		if (filteri.datumDo) {
			where.push("date(sm.kreirano) <= date(?)");
			parametri.push(filteri.datumDo);
		}

		const whereSQL = `WHERE ${where.join(" AND ")}`;
		const orderSQL = filteri.naziv
			? "ORDER BY naziv_sadrzaja"
			: "ORDER BY sm.kreirano DESC";

		const [redovi, bazaUkupno] = await Promise.all([
			this.baza.dajSve<Red>(
				`SELECT sm.id AS sadrzaj_id, 
            ${NAZIV} AS naziv_sadrzaja,
            sm.putanja,
            sm.tip_sadrzaja_id AS tip,
            sm.youtube_kljuc,
            sm.kreirano,
            ${AUTOR} AS autor,
            MIN(f.id) AS film_id,
            MIN(f.naslov) AS film_naslov,
            MIN(kol.id) AS kolekcija_id,
            MIN(kol.naziv) AS kolekcija_naziv
            ${JOIN}
            ${whereSQL}
            GROUP BY sm.id
            ${orderSQL}
            LIMIT ? OFFSET ?`,
				[...parametri, poStranici, kreniOd]
			),
			this.baza.dajJedan<{ ukupno: number }>(
				`SELECT COUNT(DISTINCT sm.id) AS ukupno 
                ${JOIN}
                ${whereSQL}`,
				parametri
			),
		]);

		let ukupno = 0;
		if (bazaUkupno) ukupno = bazaUkupno.ukupno;
		return {
			sadrzaj: redovi.map(mapJavniSadrzaj),
			ukupnoStranica: Math.max(1, Math.ceil(ukupno / poStranici)),
		};
	}

	public async dajAutore(): Promise<string[]> {
		await this.bazaSpremna;
		const redovi = await this.baza.dajSve<{ autor: string }>(
			`SELECT DISTINCT autor FROM
            (SELECT CASE 
            WHEN sm.lokalni_sadrzaj = 1 
            THEN k.korime ELSE 'TMDB' END AS autor
            ${JOIN}
            WHERE sm.privatan = 0
            AND (sm.lokalni_sadrzaj = 1 OR (sk.javni_sadrzaj = 1 AND kol.javna_kolekcija = 1)))
            ORDER BY lower(autor)
            `
		);
		return redovi.map((red) => red.autor);
	}
}
